import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import Header from "../components/Header";
import { createSession, uploadFile, getJobStatus, downloadJobResult, getTurnCredentials } from "../services/api";
import "../App.css";

// ─── Web Crypto helpers ───────────────────────────────────────────────────────

async function deriveKey(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptChunk(key, plaintext) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  const out = new Uint8Array(12 + ciphertext.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(ciphertext), 12);
  return out.buffer;
}

// ─── WebSocket URL helper ─────────────────────────────────────────────────────

function wsUrl(roomId) {
  const token = localStorage.getItem('access') || sessionStorage.getItem('access_token');
  const tokenParam = token ? `?token=${token}` : '';
  const defaultProto = window.location.protocol === "https:" ? "wss:" : "ws:";
  const configured = process.env.REACT_APP_WS_URL || process.env.REACT_APP_API_URL;

  if (configured) {
    try {
      // Supports values like:
      // - https://q-safe.live
      // - wss://q-safe.live
      // - /api
      // - api (relative)
      const parsed = new URL(configured, window.location.origin);
      const wsProto = parsed.protocol === "wss:" || parsed.protocol === "ws:"
        ? parsed.protocol
        : (parsed.protocol === "https:" ? "wss:" : "ws:");
      const badHost = !parsed.host || parsed.hostname === "api";
      const host = badHost ? window.location.host : parsed.host;
      return `${wsProto}//${host}/ws/p2p/${roomId}/${tokenParam}`;
    } catch {
      // Fallback to same-origin host when env value is malformed.
    }
  }

  return `${defaultProto}//${window.location.host}/ws/p2p/${roomId}/${tokenParam}`;
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Dynamic chunks and watermarks based on connection type
const CHUNK_SIZE_LAN = 256 * 1024;
const CHUNK_SIZE_INTERNET = 64 * 1024;
const BUFFER_HIGH_WATERMARK_LAN = 12 * 1024 * 1024; // 12 MB - safetly below browser 16MB limit to prevent queue overflow
const BUFFER_HIGH_WATERMARK_INTERNET = 1024 * 1024; // 1 MB — strict pacing for slow TURN relays
const HYBRID_AIRGAP_MAX_BYTES = 2 * 1024 * 1024;
const LOCAL_CONNECT_TIMEOUT_MS = 25000; // 25s — give ICE more time for host candidates on restrictive WiFi
const ICE_SERVERS_LOCAL_ONLY = [];

function randomRoomId() {
  return crypto.randomUUID();
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function P2PSend() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [password, setPassword] = useState("");
  const [usePassword, setUsePassword] = useState(false);

  const [roomId] = useState(() => randomRoomId());
  const [status, setStatus] = useState("idle"); // idle | waiting | connected | sending | done | offline_processing | offline_done | error
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [transferSpeed, setTransferSpeed] = useState("");
  const [strategy, setStrategy] = useState("auto"); // auto | lan | internet
  const [allowBroadcast, setAllowBroadcast] = useState(true);
  const [connectedReceivers, setConnectedReceivers] = useState(0);
  const [joinedReceivers, setJoinedReceivers] = useState(0);
  const [completedReceivers, setCompletedReceivers] = useState(0);
  const [offlineJobId, setOfflineJobId] = useState(null);
  const [offlineJobStatus, setOfflineJobStatus] = useState(null);
  const [offlineJobProgress, setOfflineJobProgress] = useState(0);
  const [offlineZipName, setOfflineZipName] = useState("");
  const [connectionType, setConnectionType] = useState(null); // "lan" | "relay" | "stun"

  const wsRef = useRef(null);
  const senderPeerIdRef = useRef(null);
  const peersRef = useRef(new Map()); // peerId => { pc, dc, transferStarted, transferSalt, completed, fallbackTried }
  const fileRef = useRef(null);
  // Ref so ws.onmessage closures always read the *current* status, not stale captured value.
  const statusRef = useRef(status);
  useEffect(() => { statusRef.current = status; }, [status]);

  useEffect(() => {
    return () => {
      Array.from(peersRef.current.values()).forEach(peer => {
        peer.channels?.forEach(ch => {
          ch.onopen = null;
          ch.onmessage = null;
          ch.onerror = null;
          ch.onclose = null;
          if (ch.readyState !== 'closed') ch.close();
        });
        if (peer.pc) {
          peer.pc.onicecandidate = null;
          peer.pc.onconnectionstatechange = null;
          peer.pc.close();
        }
      });
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      peersRef.current.clear();
    };
  }, []);

  const getOpenPeerCount = () => {
    let openCount = 0;
    peersRef.current.forEach((peer) => {
      if (peer.channelOpen) openCount += 1;
    });
    return openCount;
  };

  const resolvedStrategy = (() => {
    if (strategy !== "auto") return strategy;
    // Auto is LAN-first for best same-WiFi performance, with automatic
    // fallback to internet STUN if local candidate connectivity fails.
    return "lan";
  })();

  const hybridAirGapEligible = strategy === "auto" && !!file && file.size <= HYBRID_AIRGAP_MAX_BYTES;

  const shareQuery = new URLSearchParams({
    strategy: resolvedStrategy,
    multi: allowBroadcast ? "1" : "0",
  }).toString();

  // Build the shareable link (never include password in URL)
  const shareLink = `${window.location.origin}/p2p/${roomId}?${shareQuery}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback: select text
    }
  };

  const downloadOfflineResult = async (jobId, filename) => {
    const response = await downloadJobResult(jobId);
    const blob = new Blob([response.data], { type: "application/zip" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `offline_qr_${filename}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // ── Clean up on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    const peers = peersRef.current;
    return () => {
      peers.forEach((peer) => {
        peer.dc?.close();
        peer.pc?.close();
      });
      wsRef.current?.close();
    };
  }, []);

  // ── Poll offline QR job status for Hybrid Air-Gap path ───────────────────
  useEffect(() => {
    if (!offlineJobId || status !== "offline_processing") return;

    const interval = setInterval(async () => {
      try {
        const response = await getJobStatus(offlineJobId);
        const data = response.data;

        setOfflineJobStatus(data.status);
        setOfflineJobProgress(data.progress?.percent || 0);

        if (data.status === "COMPLETED") {
          clearInterval(interval);
          const filename = data.original_filename || fileRef.current?.name || "q_safe_bundle";
          await downloadOfflineResult(offlineJobId, filename);
          setStatus("offline_done");
        } else if (data.status === "FAILED") {
          clearInterval(interval);
          setError(data.error_message || "Offline QR generation failed.");
          setStatus("error");
        }
      } catch {
        clearInterval(interval);
        setError("Failed to fetch offline generation status.");
        setStatus("error");
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [offlineJobId, status]);

  // ── Start signaling (called when user clicks "Create Transfer Link") ────────
  const startSignaling = useCallback(() => {
    if (!fileRef.current) return;
    setStatus("waiting");
    setError("");
    setProgress(0);
    setTransferSpeed("");
    setCompletedReceivers(0);

    // Reset any stale peers from previous attempts.
    peersRef.current.forEach((peer) => {
      peer.dc?.close();
      peer.pc?.close();
    });
    peersRef.current.clear();
    setConnectedReceivers(0);
    setJoinedReceivers(0);

    const ws = new WebSocket(wsUrl(roomId));
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "sender_ready" }));
    };

    ws.onerror = () => {
      setError("Could not connect to signaling server. Check your internet connection.");
      setStatus("error");
    };

    ws.onclose = (e) => {
      if (status !== "done" && status !== "sending") {
        // Only show error if we didn't finish
      }
    };

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === "peer_id") {
        senderPeerIdRef.current = msg.peer_id;
      }

      if (msg.type === "receiver_joined" && msg.from) {
        if (!allowBroadcast && peersRef.current.size > 0) {
          return;
        }
        if (!peersRef.current.has(msg.from)) {
          setJoinedReceivers(prev => prev + 1);
          const preferLocal = msg.prefer_local === true || resolvedStrategy === "lan";
          await setupPeerConnection(ws, msg.from, preferLocal, false);
        }
      }

      if (msg.type === "answer" && msg.from) {
        const peer = peersRef.current.get(msg.from);
        if (peer?.pc) {
          await peer.pc.setRemoteDescription({ type: "answer", sdp: msg.sdp });
        }
      }

      if (msg.type === "ice_candidate" && msg.from) {
        const peer = peersRef.current.get(msg.from);
        if (peer?.pc) {
          try {
            await peer.pc.addIceCandidate(msg.candidate);
          } catch {
            // Benign: stale candidate
          }
        }
      }

      if (msg.type === "peer_disconnected" && msg.from) {
        const peer = peersRef.current.get(msg.from);
        if (peer) {
          if (peer.connectTimeout) {
            clearTimeout(peer.connectTimeout);
          }
          if (peer.readyTimeout) {
            clearTimeout(peer.readyTimeout);
          }
          peer.dc?.close();
          peer.pc?.close();
          peersRef.current.delete(msg.from);
          setConnectedReceivers(getOpenPeerCount());
          setJoinedReceivers(prev => Math.max(0, prev - 1));
          // Use statusRef.current to avoid stale closure — status captured at
          // startSignaling() time is always "idle", not the live value.
          if (peersRef.current.size === 0 && statusRef.current !== "done") {
            setError("Receiver disconnected before the transfer was complete.");
            setStatus("error");
          }
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowBroadcast, resolvedStrategy, roomId]);

  const startHybridAirGap = async () => {
    const f = fileRef.current;
    if (!f) return;
    if (!password) {
      setError("Hybrid Air-Gap requires a password for offline QR generation.");
      setStatus("error");
      return;
    }

    setStatus("offline_processing");
    setError("");
    setProgress(0);
    setTransferSpeed("");
    setOfflineJobProgress(0);
    setOfflineJobStatus("PENDING");

    try {
      const sessionRes = await createSession("OFFLINE");
      const sessionId = sessionRes.data?.session_id;
      if (!sessionId) {
        throw new Error("Failed to create offline session.");
      }

      const uploadRes = await uploadFile(f, sessionId, password, {
        maxDownloads: 3,
        expiryHours: 1,
        enableIpLock: true,
      });

      const jobId = uploadRes.data?.job_id;
      if (!jobId) {
        throw new Error("Failed to start offline QR generation job.");
      }

      setOfflineJobId(jobId);
      setOfflineZipName(`${f.name}_qr_bundle.zip`);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Could not start Hybrid Air-Gap flow.");
      setStatus("error");
    }
  };

  // ── Set up WebRTC peer connection ──────────────────────────────────────────
  const setupPeerConnection = async (ws, receiverPeerId, preferLocal, fallbackTried) => {
    try {
      const previousPeer = peersRef.current.get(receiverPeerId);
      if (previousPeer?.connectTimeout) {
        clearTimeout(previousPeer.connectTimeout);
      }
      if (previousPeer?.readyTimeout) {
        clearTimeout(previousPeer.readyTimeout);
      }
      previousPeer?.dc?.close();
      previousPeer?.pc?.close();

      // Default to a known STUN server
      let fetchedIceServers = [ { urls: "stun:stun.l.google.com:19302" } ];

      if (!preferLocal) {
        try {
          const res = await getTurnCredentials();
          // Use the list of iceServers returned by the API
          if (res.data.iceServers) {
            fetchedIceServers = res.data.iceServers;
          } else {
            // Backward compatibility: build from single credentials
            fetchedIceServers = [
              { urls: "stun:stun.l.google.com:19302" },
              {
                urls: res.data.urls,
                username: res.data.username,
                credential: res.data.password
              }
            ];
          }
        } catch (err) {
          console.warn("Failed to fetch TURN credentials", err);
        }
      }

      const pc = new RTCPeerConnection({
        iceServers: preferLocal ? ICE_SERVERS_LOCAL_ONLY : fetchedIceServers,
        iceCandidatePoolSize: 10,
        iceTransportPolicy: "all",
      });

      const NUM_CHANNELS = 4;
      const channels = Array.from({ length: NUM_CHANNELS }, (_, i) => {
        const channel = pc.createDataChannel(`file-${i}`, { ordered: true });
        channel.bufferedAmountLowThreshold = 1024 * 1024; // 1MB
        return channel;
      });

      const peerState = {
        pc,
        channels,
        transferStarted: false,
        transferSalt: null,
        completed: false,
        preferLocal,
        fallbackTried,
        channelOpen: false,
        connectTimeout: null,
      };
    peersRef.current.set(receiverPeerId, peerState);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        ws.send(JSON.stringify({
          type: "ice_candidate",
          candidate: e.candidate,
          to: receiverPeerId,
        }));
      }
    };

    pc.onicecandidateerror = (e) => {
      console.warn(`[P2PSend] ICE candidate error: ${e.errorCode} ${e.errorText} url=${e.url}`);
    };

    pc.onconnectionstatechange = async () => {
      console.log('[P2PSend] Connection state:', pc.connectionState);

      if (pc.connectionState === "failed" && !peerState.completed) {
        if (peerState.connectTimeout) {
          clearTimeout(peerState.connectTimeout);
          peerState.connectTimeout = null;
        }
        if (peerState.readyTimeout) {
          clearTimeout(peerState.readyTimeout);
          peerState.readyTimeout = null;
        }
        if (peerState.preferLocal && !peerState.fallbackTried) {
          // Automatic proximity fallback: retry with internet STUN if LAN-only fails.
          peerState.fallbackTried = true;
          peerState.dc?.close();
          peerState.pc?.close();
          peersRef.current.delete(receiverPeerId);
          await setupPeerConnection(ws, receiverPeerId, false, true);
          return;
        }

        // Use statusRef.current to avoid being masked by stale closure
        if (statusRef.current !== "done") {
          setError(`WebRTC connection lost (${pc.connectionState}). Ensure firewall allows P2P.`);
          setStatus("error");
        }
      }
    };

    pc.oniceconnectionstatechange = async () => {
      console.log('[P2PSend] ICE state:', pc.iceConnectionState);
      
      if (pc.iceConnectionState === 'disconnected') {
        console.warn('[P2PSend] ICE disconnected — may recover...');
        setTimeout(() => {
          if (pc.iceConnectionState === 'disconnected') {
            console.error('[P2PSend] ICE did not recover, triggering failure UI');
            if (statusRef.current !== "done") {
              setError("Connection dropped. Please retry.");
              setStatus("error");
            }
          }
        }, 5000);
      }
      
      if (pc.iceConnectionState === 'failed') {
        console.error('[P2PSend] ICE failed — no viable candidate pair found');
        if (statusRef.current !== "done") {
          setError("Could not establish connection on this network. Try mobile data instead.");
          setStatus("error");
        }
      }

      if (pc.iceConnectionState === 'connected') {
        try {
          const stats = await pc.getStats();
          let localType = '', remoteType = '', protocol = '';
          stats.forEach(report => {
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
              stats.forEach(r => {
                if (r.type === 'local-candidate' && r.id === report.localCandidateId) {
                  localType = r.candidateType;
                  protocol = r.protocol;
                }
                if (r.type === 'remote-candidate' && r.id === report.remoteCandidateId) {
                  remoteType = r.candidateType;
                }
              });
            }
          });

          let resolvedType = 'host';
          if (localType === 'relay' || remoteType === 'relay') resolvedType = 'relay';
          else if (localType === 'srflx' || remoteType === 'srflx') resolvedType = 'srflx';
          else if (localType !== 'host' && remoteType !== 'host') resolvedType = 'srflx';

          console.log(`[Q-Safe] Connection type: ${localType || 'unknown'} → ${remoteType || 'unknown'}`);
          console.log(`[Q-Safe] Protocol: ${protocol || 'unknown'}`);

          setConnectionType({
            type: resolvedType,
            local: localType,
            remote: remoteType,
            protocol: protocol
          });
        } catch (err) {
          console.warn("Could not get WebRTC stats:", err);
        }
      }
    };

    let openCount = 0;

    channels.forEach((dc, index) => {
      dc.onopen = async () => {
        openCount++;
        console.log(`[P2PSend] Data channel ${index} opened`);
        
        if (openCount === NUM_CHANNELS) {
          if (peerState.connectTimeout) {
            clearTimeout(peerState.connectTimeout);
            peerState.connectTimeout = null;
          }
          peerState.channelOpen = true;
          setConnectedReceivers(getOpenPeerCount());
          setStatus("connected");
          peerState.transferStarted = false;
          
          console.log("[P2PSend] All parallel Data channels opened for receiver:", receiverPeerId);
          sendFileMeta(receiverPeerId);

          peerState.readyTimeout = setTimeout(() => {
            if (!peerState.transferStarted && peerState.channelOpen) {
              console.error("[P2PSend] Timeout waiting for receiver_ready from:", receiverPeerId);
              setError("Receiver did not respond. The connection may have been interrupted.");
              setStatus("error");
            }
          }, 10000);
        }
      };

      dc.onclose = () => {
        if (peerState.channelOpen) {
          peerState.channelOpen = false;
          setConnectedReceivers(getOpenPeerCount());
        }
      };

      dc.onerror = (e) => {
        setError("Data channel error: " + (e?.message || "unknown"));
        setStatus("error");
      };
      
      // Use channel 0 for signaling to guarantee metadata ordering
      if (index === 0) {
        dc.onmessage = async (event) => {
          if (typeof event.data !== "string") return;
          try {
            const msg = JSON.parse(event.data);
            console.log("[P2PSend] Received message from receiver:", msg.type);
            if (msg.type === "receiver_ready" && !peerState.transferStarted) {
              console.log("[P2PSend] Receiver ready, checking if all channels are open...");
              
              // Wait for all 4 channels to reach "open" state before striping data
              const allOpen = peerState.channels.every(ch => ch.readyState === "open");
              if (!allOpen) {
                console.log("[P2PSend] Waiting for all parallel channels to sync...");
                await Promise.all(
                  peerState.channels.map(ch => ch.readyState === "open" 
                    ? Promise.resolve() 
                    : new Promise(res => ch.addEventListener("open", res, { once: true }))
                  )
                );
              }

              console.log("[P2PSend] All channels open, starting file transfer to:", receiverPeerId);
              if (peerState.readyTimeout) {
                clearTimeout(peerState.readyTimeout);
                peerState.readyTimeout = null;
              }
              peerState.transferStarted = true;
              await sendFile(receiverPeerId);
            }
          } catch (err) {
            console.error("[P2PSend] Error parsing receiver message:", err);
          }
        };
      }
    });

    // Create and send offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    ws.send(JSON.stringify({
      type: "offer",
      sdp: pc.localDescription.sdp,
      to: receiverPeerId,
      strategy: preferLocal ? "lan" : "internet",
    }));

    // Some networks stay in "connecting" for too long without firing "failed".
    // In LAN-first mode, proactively retry with STUN after a timeout.
    if (preferLocal && !fallbackTried) {
      peerState.connectTimeout = setTimeout(async () => {
        const currentPeer = peersRef.current.get(receiverPeerId);
        if (!currentPeer || currentPeer.channelOpen || currentPeer.completed || currentPeer.fallbackTried) {
          return;
        }
        currentPeer.fallbackTried = true;
        currentPeer.channels?.forEach(ch => ch.close());
        currentPeer.pc?.close();
        peersRef.current.delete(receiverPeerId);
        await setupPeerConnection(ws, receiverPeerId, false, true);
      }, LOCAL_CONNECT_TIMEOUT_MS);
    } else if (!preferLocal) {
      // Absolute timeout for Internet ICE attempt (35s)
      peerState.connectTimeout = setTimeout(() => {
        const currentPeer = peersRef.current.get(receiverPeerId);
        if (!currentPeer || currentPeer.channelOpen || currentPeer.completed) {
          return;
        }
        currentPeer.channels?.forEach(ch => ch.close());
        currentPeer.pc?.close();
        if (statusRef.current !== "done") {
          setError(`Could not establish connection on this network. Try mobile data instead.`);
          setStatus("error");
        }
      }, 30000);
    }
  } catch (err) {
    console.error("PeerConnection failed: ", err);
    setError("Failed to establish P2P: " + err.message);
    setStatus("error");
  }
};

  // ── Send metadata to Peer ──────────────────────────────────────────────────
  const sendFileMeta = async (receiverPeerId) => {
    const peer = peersRef.current.get(receiverPeerId);
    if (!peer?.channels || peer.channels.length === 0) return;

    const f = fileRef.current;
    if (!f) return;

    peer.transferSalt = (usePassword && password)
      ? crypto.getRandomValues(new Uint8Array(16))
      : null;

    const metadata = {
      type: "file_meta",
      name: f.name,
      size: f.size,
      encrypted: !!(usePassword && password),
      salt: peer.transferSalt ? btoa(String.fromCharCode(...peer.transferSalt)) : null,
      password_hint: usePassword && password ? "required" : null,
    };

    console.log("[P2PSend] Sending file metadata to receiver:", receiverPeerId, metadata);
    // Send file metadata on primary channel
    peer.channels[0].send(JSON.stringify(metadata));
  };

  // ── Send file over DataChannel ─────────────────────────────────────────────
  const waitForBuffer = async (channel, threshold = 1024 * 1024) => {
    if (channel.bufferedAmount <= threshold) return;
    await new Promise((res) => {
      channel.bufferedAmountLowThreshold = threshold;
      const onLow = () => {
        channel.removeEventListener("bufferedamountlow", onLow);
        res();
      };
      channel.addEventListener("bufferedamountlow", onLow);
    });
  };

  const sendOnChannelWithRetry = async (channel, data, retries = 5) => {
    for (let i = 0; i < retries; i++) {
        if (channel.readyState === "open") {
            try {
                channel.send(data);
                return true;
            } catch (err) {
                console.warn(`[P2PSend] Send failed on channel ${channel.label}, attempt ${i+1}:`, err);
            }
        }
        if (channel.readyState === "closed" || channel.readyState === "closing") {
            return false; // Return failure to allow fallback
        }
        // Wait for state to recover or for a moment before retry
        await new Promise((res) => setTimeout(res, 100 * (i + 1)));
    }
    return false;
  };

  const sendFile = async (receiverPeerId) => {
    const peer = peersRef.current.get(receiverPeerId);
    if (!peer?.channels || peer.channels.length === 0) return;

    setStatus("sending");
    const f = fileRef.current;
    if (!f) return;

    let cryptoKey = null;

    if (usePassword && password) {
      const saltBytes = peer.transferSalt;
      if (!saltBytes) {
        setError("Transfer initialization failed. Please try again.");
        setStatus("error");
        return;
      }
      cryptoKey = await deriveKey(password, saltBytes);
    }

    const resolvedType = connectionType?.type || "host";
    const isLAN = resolvedType === "host";
    const isRelay = resolvedType === "relay";
    const chunkSize = connectionType === 'lan' 
      ? CHUNK_SIZE_LAN 
      : CHUNK_SIZE_INTERNET;
    const NUM_ACTIVE = isLAN ? 2 : 1;
    console.log(`[Q-Safe] Applying profile: ${chunkSize/1024}KB chunks, ${NUM_ACTIVE} channel(s)`);

    const totalChunks = Math.ceil(f.size / chunkSize);
    let sentBytes = 0;
    const startTime = Date.now();
    const activeChannels = peer.channels.slice(0, NUM_ACTIVE);

    for (let i = 0; i < totalChunks; i++) {
      let channel = activeChannels[i % NUM_ACTIVE];

      try {
        // 🚦 CONGESTION CONTROL: If buffer is getting deep, breathe for 5ms to let SCTP ack/drain
        if (channel.bufferedAmount > 2 * 1024 * 1024) {
          await new Promise(res => setTimeout(res, 5));
        }

        // Dynamic lane protection: if single-channel or current lane died, find any survivor
        if (channel.readyState !== "open") {
          channel = peer.channels.find(ch => ch.readyState === "open");
          if (!channel) {
            setError("All data channels closed. Connection unstable.");
            setStatus("error");
            return;
          }
        }

        await waitForBuffer(channel);
        
        const slice = f.slice(i * chunkSize, (i + 1) * chunkSize);
        const ab = await slice.arrayBuffer();
        let payload;

        if (cryptoKey) {
            payload = await encryptChunk(cryptoKey, ab);
        } else {
            payload = ab;
        }

        const finalPayload = new Uint8Array(4 + payload.byteLength);
        const view = new DataView(finalPayload.buffer);
        view.setUint32(0, i); 
        finalPayload.set(new Uint8Array(payload), 4);

        const success = await sendOnChannelWithRetry(channel, finalPayload.buffer);
        
        if (!success) {
          // If a retry failed or channel died mid-loop, find a survivor channel
          const fallback = peer.channels.find(ch => ch.readyState === "open");
          if (!fallback) {
            setError("All data channels failed during transfer.");
            setStatus("error");
            return;
          }
          await sendOnChannelWithRetry(fallback, finalPayload.buffer);
        }

        sentBytes += ab.byteLength;
      } catch (err) {
        console.error("[P2PSend] Critical error during striping:", err);
        setError(`Transfer aborted: ${err.message}`);
        setStatus("error");
        return;
      }
      
      // Update UI only roughly every MB to keep high throughput uninterrupted
      if (i % 4 === 0 || i === totalChunks - 1) {
        const pct = Math.round((sentBytes / f.size) * 100);
        setProgress(pct);

        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed > 0) {
          const bps = sentBytes / elapsed;
          setTransferSpeed(formatSpeed(bps));
        }
      }
    }

    // Tell receiver we are explicitly done on the primary signaling channel
    peer.channels[0].send(JSON.stringify({ type: "transfer_complete" }));
    peer.completed = true;
    setCompletedReceivers((prev) => {
      const next = prev + 1;
      if (next >= Math.max(1, peersRef.current.size)) {
        setStatus("done");
      }
      return next;
    });
    setProgress(100);
  };

  function formatSpeed(bps) {
    if (bps > 1024 * 1024) return (bps / (1024 * 1024)).toFixed(1) + " MB/s";
    if (bps > 1024) return (bps / 1024).toFixed(1) + " KB/s";
    return bps.toFixed(0) + " B/s";
  }

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      fileRef.current = f;
    }
  };

  const handleStart = () => {
    if (!file) return;
    if (hybridAirGapEligible) {
      startHybridAirGap();
      return;
    }
    startSignaling();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="app-container">
      <Header />
      <div className="main-content" style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 560 }}>

          {/* Title */}
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <h1 style={{
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              fontWeight: 800,
              fontFamily: "var(--font-display)",
              color: "var(--text-primary)",
              marginBottom: "0.5rem"
            }}>
              P2P File Transfer
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              Send files directly to another browser — zero server storage.
            </p>
          </div>

          <div className="card" style={{ padding: "2rem" }}>

            {/* Step 1 — Pick file */}
            {status === "idle" && (
              <>
                <label style={{ display: "block", marginBottom: "1.25rem" }}>
                  <div style={{
                    border: "2px dashed var(--border-color)",
                    borderRadius: 12,
                    padding: "2rem",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "border-color 0.2s",
                    background: file ? "var(--bg-secondary)" : "transparent"
                  }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const f = e.dataTransfer.files[0];
                      if (f) { setFile(f); fileRef.current = f; }
                    }}
                  >
                    <input
                      type="file"
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />
                    {file ? (
                      <>
                        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📄</div>
                        <div style={{ color: "var(--text-primary)", fontWeight: 600, wordBreak: "break-all" }}>{file.name}</div>
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📂</div>
                        <div style={{ color: "var(--text-secondary)" }}>Drop a file here or <span style={{ color: "var(--accent-primary)" }}>click to select</span></div>
                      </>
                    )}
                  </div>
                </label>

                {/* Optional password */}
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={usePassword}
                    onChange={(e) => setUsePassword(e.target.checked)}
                    style={{ width: 16, height: 16 }}
                  />
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Encrypt with password</span>
                </label>

                {(usePassword || hybridAirGapEligible) && (
                  <input
                    type="password"
                    placeholder={hybridAirGapEligible ? "Enter password (required for Hybrid Air-Gap)" : "Enter password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      borderRadius: 8,
                      border: "1px solid var(--border-color)",
                      background: "var(--bg-secondary)",
                      color: "var(--text-primary)",
                      fontSize: "0.95rem",
                      marginBottom: "1rem",
                      boxSizing: "border-box"
                    }}
                  />
                )}

                {hybridAirGapEligible && (
                  <div style={{
                    marginBottom: "1rem",
                    padding: "0.75rem",
                    background: "rgba(16, 185, 129, 0.12)",
                    border: "1px solid rgba(16, 185, 129, 0.35)",
                    borderRadius: 8,
                    fontSize: "0.82rem",
                    color: "var(--text-secondary)"
                  }}>
                    📴 Hybrid Air-Gap detected: this file is ≤ 2MB. In Auto mode, Q-Safe will generate an offline QR ZIP bundle instead of a live P2P stream.
                  </div>
                )}

                <div style={{
                  marginBottom: "1rem",
                  display: "grid",
                  gap: "0.75rem"
                }}>
                  <label style={{ color: "var(--text-secondary)", fontSize: "0.9rem", display: "grid", gap: "0.35rem" }}>
                    Transfer strategy
                    <select
                      value={strategy}
                      onChange={(e) => setStrategy(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.75rem",
                        borderRadius: 8,
                        border: "1px solid var(--border-color)",
                        background: "var(--bg-secondary)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <option value="auto">Auto (recommended)</option>
                      <option value="lan">Proximity LAN first</option>
                      <option value="internet">Internet optimized</option>
                    </select>
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                    <input
                      type="checkbox"
                      checked={allowBroadcast}
                      onChange={(e) => setAllowBroadcast(e.target.checked)}
                      style={{ width: 16, height: 16 }}
                    />
                    Allow multiple receivers (broadcast mode)
                  </label>
                </div>

                <button
                  className="btn-primary"
                  style={{ width: "100%", padding: "0.875rem", fontSize: "1rem", marginBottom: "0.75rem" }}
                  onClick={handleStart}
                  disabled={!file || ((usePassword || hybridAirGapEligible) && !password)}
                >
                  {hybridAirGapEligible ? "Generate Offline QR Bundle" : "Create Transfer Link"}
                </button>

                <div style={{
                  padding: "0.6rem",
                  background: "var(--bg-secondary)",
                  borderRadius: 8,
                  fontSize: "0.75rem",
                  color: "var(--text-secondary)",
                  textAlign: "center",
                  lineHeight: "1.3"
                }}>
                  <span style={{color: "var(--accent-primary)", fontWeight: 500}}>Note for College / Office Networks:</span> Strict firewalls may automatically route transfers through an encrypted relay server (slower speeds).
                </div>
              </>
            )}

            {/* Step 2 — Waiting for receiver */}
            {(status === "waiting" || status === "connected") && (
              <>
                <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
                    {status === "waiting" ? (peersRef.current.size > 0 ? "⚡" : "⏳") : "🔗"}
                  </div>
                  <div style={{ color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.25rem" }}>
                    {status === "waiting" 
                      ? (peersRef.current.size > 0 ? "Negotiating P2P Connection…" : "Waiting for receiver…") 
                      : "Receiver connected! Setting up transfer…"}
                  </div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                    <strong>{file?.name}</strong> ({file ? (file.size / (1024 * 1024)).toFixed(2) : 0} MB)
                  </div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem", marginTop: "0.35rem" }}>
                    👥 Joined: {joinedReceivers} · Connected: {connectedReceivers} · Completed: {completedReceivers}
                  </div>
                </div>

                <div style={{
                  background: "var(--bg-secondary)",
                  borderRadius: 10,
                  padding: "1rem",
                  wordBreak: "break-all",
                  fontSize: "0.82rem",
                  color: "var(--text-secondary)",
                  marginBottom: "1rem",
                  fontFamily: "monospace"
                }}>
                  {shareLink}
                </div>

                <div style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "1rem",
                  padding: "0.75rem",
                  background: "#fff",
                  borderRadius: 12,
                  border: "1px solid var(--border-color)"
                }}>
                  <QRCodeCanvas
                    value={shareLink}
                    size={180}
                    includeMargin={true}
                    bgColor="#ffffff"
                    fgColor="#111111"
                    level="M"
                  />
                </div>

                <div style={{
                  marginBottom: "1rem",
                  textAlign: "center",
                  fontSize: "0.82rem",
                  color: "var(--text-secondary)"
                }}>
                  Scan this QR to open the receiver page instantly.
                </div>

                <button
                  className={copied ? "btn-secondary" : "btn-primary"}
                  style={{ width: "100%" }}
                  onClick={copyLink}
                >
                  {copied ? "✓ Copied!" : "Copy Link"}
                </button>

                {usePassword && password && (
                  <div style={{
                    marginTop: "0.75rem",
                    padding: "0.75rem",
                    background: "rgba(255, 193, 7, 0.1)",
                    border: "1px solid rgba(255, 193, 7, 0.3)",
                    borderRadius: 8,
                    fontSize: "0.82rem",
                    color: "var(--text-secondary)"
                  }}>
                    🔒 Password is NOT included in the link. Share it separately with the receiver.
                  </div>
                )}
              </>
            )}

            {/* Step 3 — Sending */}
            {status === "sending" && (
              <>
                <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🚀</div>
                  <div style={{ color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.25rem" }}>
                    Sending…
                  </div>
                  {connectionType && (
                    <div style={{ textAlign: "center", marginBottom: "0.5rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
                      <div style={{ 
                        display: "inline-block", 
                        padding: "0.2rem 0.6rem", 
                        borderRadius: 12, 
                        fontSize: "0.75rem", 
                        background: connectionType.type === "host" ? "rgba(16, 185, 129, 0.15)" : (connectionType.type === "srflx" ? "rgba(234, 179, 8, 0.15)" : "rgba(239, 68, 68, 0.15)"),
                        color: connectionType.type === "host" ? "#10b981" : (connectionType.type === "srflx" ? "#eab308" : "#ef4444"),
                        fontWeight: 600
                      }}>
                        {connectionType.type === "host" ? "🟢 LAN (Direct)" : (connectionType.type === "srflx" ? "🟡 Internet (STUN)" : "🔴 Relayed (TURN)")}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                        {connectionType.type === "host" ? "~20-50 MB/s expected" : (connectionType.type === "srflx" ? "~2-10 MB/s expected" : "~0.5-4 MB/s expected")}
                      </div>
                      {connectionType.type === "host" && connectionType.local === "host" && (
                        <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", marginTop: "0.2rem", fontStyle: "italic" }}>
                          Tip: If speed is low, try disabling mDNS in chrome://flags
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                    {file?.name} · {transferSpeed}
                  </div>
                </div>

                <div style={{ background: "var(--bg-secondary)", borderRadius: 100, height: 8, overflow: "hidden", marginBottom: "0.5rem" }}>
                  <div style={{
                    height: "100%",
                    width: `${progress}%`,
                    background: "var(--accent-gradient)",
                    borderRadius: 100,
                    transition: "width 0.2s ease"
                  }} />
                </div>
                <div style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                  {progress}%
                </div>
              </>
            )}

            {/* Hybrid Air-Gap Processing */}
            {status === "offline_processing" && (
              <>
                <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📴</div>
                  <div style={{ color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.25rem" }}>
                    Generating Offline QR Bundle…
                  </div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                    {file?.name} · {offlineJobProgress}%
                  </div>
                </div>

                <div style={{ background: "var(--bg-secondary)", borderRadius: 100, height: 8, overflow: "hidden", marginBottom: "0.5rem" }}>
                  <div style={{
                    height: "100%",
                    width: `${offlineJobProgress}%`,
                    background: "var(--accent-gradient)",
                    borderRadius: 100,
                    transition: "width 0.2s ease"
                  }} />
                </div>

                <div style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  Job status: {offlineJobStatus || "PENDING"}
                </div>
              </>
            )}

            {/* Hybrid Air-Gap Done */}
            {status === "offline_done" && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>✅</div>
                <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "1.25rem", marginBottom: "0.5rem" }}>
                  Offline QR Bundle Ready
                </div>
                <div style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                  <strong>{offlineZipName || `${file?.name}_qr_bundle.zip`}</strong> has been generated and downloaded.
                </div>
                <button
                  className="btn-primary"
                  style={{ marginRight: "0.75rem" }}
                  onClick={() => offlineJobId && downloadOfflineResult(offlineJobId, file?.name || "q_safe_bundle")}
                >
                  Download Again
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => navigate("/send")}
                >
                  Start New Transfer
                </button>
              </div>
            )}

            {/* Step 4 — Done */}
            {status === "done" && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>✅</div>
                <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "1.25rem", marginBottom: "0.5rem" }}>
                  Transfer Complete!
                </div>
                <div style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                  <strong>{file?.name}</strong> was delivered successfully.
                </div>
                <button className="btn-primary" onClick={() => navigate("/send")}>
                  Send Another File
                </button>
              </div>
            )}

            {/* Error */}
            {status === "error" && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>❌</div>
                <div style={{ color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.5rem" }}>Transfer Failed</div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>{error}</div>
                <button className="btn-secondary" onClick={() => { setStatus("idle"); setError(""); setProgress(0); }}>
                  Try Again
                </button>
              </div>
            )}
          </div>

          {/* Info badges */}
          {status === "idle" && (
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", flexWrap: "wrap", justifyContent: "center" }}>
              {["🔒 End-to-end encrypted", "🚫 No server storage", "♾️ No file size limit"].map((b) => (
                <span key={b} style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: 20,
                  padding: "0.3rem 0.85rem",
                  fontSize: "0.8rem",
                  color: "var(--text-secondary)"
                }}>{b}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
