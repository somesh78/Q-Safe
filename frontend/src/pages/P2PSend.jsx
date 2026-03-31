import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import Header from "../components/Header";
import { createSession, uploadFile, getJobStatus, downloadJobResult } from "../services/api";
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
      return `${wsProto}//${host}/ws/p2p/${roomId}/`;
    } catch {
      // Fallback to same-origin host when env value is malformed.
    }
  }

  return `${defaultProto}//${window.location.host}/ws/p2p/${roomId}/`;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CHUNK_SIZE = 256 * 1024; // 256 KB improves throughput for large file transfers
const BUFFER_HIGH_WATERMARK = 1024 * 1024; // 1 MB — keeps buffer well below Chrome's 16MB hard limit to prevent 'send queue is full' crash
const HYBRID_AIRGAP_MAX_BYTES = 2 * 1024 * 1024;
const LOCAL_CONNECT_TIMEOUT_MS = 15000; // 15s — give ICE more time before STUN fallback
const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  // Free public TURN servers for symmetric-NAT traversal.
  // Replace with a private coturn/Cloudflare TURN server in production.
  {
    urls: ["turn:openrelay.metered.ca:80", "turn:openrelay.metered.ca:443"],
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turns:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];
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
  const [completedReceivers, setCompletedReceivers] = useState(0);
  const [offlineJobId, setOfflineJobId] = useState(null);
  const [offlineJobStatus, setOfflineJobStatus] = useState(null);
  const [offlineJobProgress, setOfflineJobProgress] = useState(0);
  const [offlineZipName, setOfflineZipName] = useState("");

  const wsRef = useRef(null);
  const senderPeerIdRef = useRef(null);
  const peersRef = useRef(new Map()); // peerId => { pc, dc, transferStarted, transferSalt, completed, fallbackTried }
  const fileRef = useRef(null);
  // Ref so ws.onmessage closures always read the *current* status, not stale captured value.
  const statusRef = useRef(status);
  useEffect(() => { statusRef.current = status; }, [status]);

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
  }, [allowBroadcast, resolvedStrategy, roomId, status]);

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

      const pc = new RTCPeerConnection({
        iceServers: preferLocal ? ICE_SERVERS_LOCAL_ONLY : ICE_SERVERS,
      });

      // Create data channel for file transfer
      const dc = pc.createDataChannel("file-transfer", { ordered: true });

      const peerState = {
        pc,
      dc,
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

    pc.onconnectionstatechange = async () => {
      if ((pc.connectionState === "failed" || pc.connectionState === "disconnected") && !peerState.completed) {
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

    dc.onopen = () => {
      if (peerState.connectTimeout) {
        clearTimeout(peerState.connectTimeout);
        peerState.connectTimeout = null;
      }
      peerState.channelOpen = true;
      setConnectedReceivers(getOpenPeerCount());
      setStatus("connected");
      peerState.transferStarted = false;
      console.log("[P2PSend] Data channel opened for receiver:", receiverPeerId);
      // Send metadata first; receiver will explicitly ACK when ready.
      sendFileMeta(receiverPeerId);

      // Set timeout for receiver_ready acknowledgment (10 seconds)
      peerState.readyTimeout = setTimeout(() => {
        if (!peerState.transferStarted && peerState.channelOpen) {
          console.error("[P2PSend] Timeout waiting for receiver_ready from:", receiverPeerId);
          setError("Receiver did not respond. The connection may have been interrupted.");
          setStatus("error");
        }
      }, 10000);
    };

    dc.onclose = () => {
      peerState.channelOpen = false;
      setConnectedReceivers(getOpenPeerCount());
    };

    dc.onmessage = async (event) => {
      if (typeof event.data !== "string") return;
      try {
        const msg = JSON.parse(event.data);
        console.log("[P2PSend] Received message from receiver:", msg.type);
        if (msg.type === "receiver_ready" && !peerState.transferStarted) {
          console.log("[P2PSend] Receiver ready, starting file transfer to:", receiverPeerId);
          // Clear the ready timeout
          if (peerState.readyTimeout) {
            clearTimeout(peerState.readyTimeout);
            peerState.readyTimeout = null;
          }
          peerState.transferStarted = true;
          await sendFile(receiverPeerId);
        }
      } catch (err) {
        console.error("[P2PSend] Error parsing receiver message:", err);
        // Ignore non-JSON control messages.
      }
    };

    dc.onerror = (e) => {
      setError("Data channel error: " + (e?.message || "unknown"));
      setStatus("error");
    };

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
        currentPeer.dc?.close();
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
        currentPeer.dc?.close();
        currentPeer.pc?.close();
        if (statusRef.current !== "done") {
          setError(`Transfer failed. Ensure you aren't on a strict VPN/firewall.`);
          setStatus("error");
        }
      }, 35000);
    }
  } catch (err) {
    console.error("PeerConnection failed: ", err);
    setError("Failed to establish P2P: " + err.message);
    setStatus("error");
  }
};

  const sendFileMeta = async (receiverPeerId) => {
    const peer = peersRef.current.get(receiverPeerId);
    if (!peer?.dc) return;

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
    // Send file metadata first
    peer.dc.send(JSON.stringify(metadata));
  };

  // ── Send file over DataChannel ─────────────────────────────────────────────
  const sendFile = async (receiverPeerId) => {
    const peer = peersRef.current.get(receiverPeerId);
    if (!peer?.dc) return;

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

    const totalChunks = Math.ceil(f.size / CHUNK_SIZE);
    let sentBytes = 0;
    const startTime = Date.now();

    for (let i = 0; i < totalChunks; i++) {
      // Back-pressure: pause when buffer is full
      while (peer.dc.bufferedAmount > BUFFER_HIGH_WATERMARK) {
        await new Promise((r) => setTimeout(r, 2));
      }

      const slice = f.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const ab = await slice.arrayBuffer();

      if (cryptoKey) {
        const encrypted = await encryptChunk(cryptoKey, ab);
        peer.dc.send(encrypted);
      } else {
        peer.dc.send(ab);
      }

      sentBytes += ab.byteLength;
      const pct = Math.round((sentBytes / f.size) * 100);
      setProgress(pct);

      // Calculate speed every ~10 chunks
      if (i % 10 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed > 0) {
          const bps = sentBytes / elapsed;
          setTransferSpeed(formatSpeed(bps));
        }
      }
    }

    peer.dc.send(JSON.stringify({ type: "transfer_complete" }));
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
                  style={{ width: "100%", padding: "0.875rem", fontSize: "1rem" }}
                  onClick={handleStart}
                  disabled={!file || ((usePassword || hybridAirGapEligible) && !password)}
                >
                  {hybridAirGapEligible ? "Generate Offline QR Bundle" : "Create Transfer Link"}
                </button>
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
                    👥 Receivers connected: {connectedReceivers} · Completed: {completedReceivers}
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
