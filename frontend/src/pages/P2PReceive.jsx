import { useParams } from "react-router-dom";
import { useState, useRef, useEffect, useCallback } from "react";
import Header from "../components/Header";
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

async function decryptChunk(key, buffer) {
  const iv = buffer.slice(0, 12);
  const ciphertext = buffer.slice(12);
  return crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
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

// ─── Download helpers ─────────────────────────────────────────────────────────

async function saveWithFSAPI(chunks, filename) {
  if (!("showSaveFilePicker" in window)) return false;
  const handle = await window.showSaveFilePicker({ suggestedName: filename });
  const writable = await handle.createWritable();
  for (const chunk of chunks) await writable.write(chunk);
  await writable.close();
  return true;
}

function saveAsBlobUrl(chunks, filename) {
  const blob = new Blob(chunks);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

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

// ─── Component ────────────────────────────────────────────────────────────────

export default function P2PReceive() {
  const { roomId } = useParams();
  const query = new URLSearchParams(window.location.search);
  const requestedStrategy = query.get("strategy") || "auto";
  const preferLocal = requestedStrategy === "lan";

  // Backward compatibility: consume password from legacy hash links once.
  const [legacyHashPassword] = useState(() => {
    const rawHash = window.location.hash.slice(1);
    if (!rawHash) return "";
    try {
      return decodeURIComponent(rawHash);
    } catch {
      return rawHash;
    }
  });

  const [status, setStatus] = useState("connecting"); // connecting | waiting | receiving | done | error | password_required
  const [error, setError] = useState("");
  const [fileMeta, setFileMeta] = useState(null); // { name, size, encrypted, salt }
  const [progress, setProgress] = useState(0);
  const [manualPassword, setManualPassword] = useState("");
  const [transferSpeed, setTransferSpeed] = useState("");

  const wsRef = useRef(null);
  const pcRef = useRef(null);
  const receiverPeerIdRef = useRef(null);
  const senderPeerIdRef = useRef(null);
  const chunksRef = useRef([]);
  const receivedBytesRef = useRef(0);
  const startTimeRef = useRef(null);
  const cryptoKeyRef = useRef(null);
  const fileMetaRef = useRef(null);
  const dataChannelRef = useRef(null);

  // ── Connect to signaling server ────────────────────────────────────────────
  const connect = useCallback((passwordOverride) => {
    setStatus("connecting");
    setError("");

    const ws = new WebSocket(wsUrl(roomId));
    wsRef.current = ws;

    ws.onerror = () => {
      setError("Could not connect to signaling server.");
      setStatus("error");
    };

    ws.onopen = () => {
      setStatus("waiting");
      ws.send(JSON.stringify({ type: "receiver_joined", prefer_local: preferLocal }));
    };

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === "peer_id") {
        receiverPeerIdRef.current = msg.peer_id;
        return;
      }

      if (msg.type === "offer") {
        if (msg.to && msg.to !== receiverPeerIdRef.current) return;
        senderPeerIdRef.current = msg.from || senderPeerIdRef.current;
        await setupPeerConnection(ws, msg.sdp, passwordOverride, msg.from || null, msg.strategy || requestedStrategy);
      }
      if (msg.type === "ice_candidate" && pcRef.current) {
        if (msg.to && msg.to !== receiverPeerIdRef.current) return;
        try {
          await pcRef.current.addIceCandidate(msg.candidate);
        } catch {
          // Benign stale candidate
        }
      }
      if (msg.type === "peer_disconnected" && status !== "done") {
        // Only show error if the data channel was already open (real mid-transfer
        // disconnect). If dc never opened, the sender may just be doing a fallback
        // retry — a new offer will arrive on the same WebSocket shortly.
        const dcState = dataChannelRef.current?.readyState;
        if (dcState === "open" || dcState === "closing") {
          setError("Sender disconnected.");
          setStatus("error");
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferLocal, requestedStrategy, roomId]); // intentionally omit 'status' and 'setupPeerConnection' — they are stable refs

  useEffect(() => {
    // Remove hash from address bar so password isn't exposed after page load.
    if (window.location.hash) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }

    connect(legacyHashPassword || null);
    return () => {
      pcRef.current?.close();
      wsRef.current?.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount only

  // ── Set up WebRTC on receiving offer ───────────────────────────────────────
  const setupPeerConnection = async (ws, offerSdp, passwordOverride, senderPeerId, transportStrategy) => {
    setStatus("waiting");

    pcRef.current?.close();

    const pc = new RTCPeerConnection({
      iceServers: transportStrategy === "lan" ? [] : ICE_SERVERS,
      iceCandidatePoolSize: 10,
      iceTransportPolicy: "all",
    });
    pcRef.current = pc;

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        ws.send(JSON.stringify({
          type: "ice_candidate",
          candidate: e.candidate,
          to: senderPeerId || senderPeerIdRef.current,
        }));
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") {
        setError("WebRTC connection failed. The sender may be behind a strict firewall.");
        setStatus("error");
      }
    };

    pc.ondatachannel = (event) => {
      const dc = event.channel;
      dataChannelRef.current = dc;

      // Wait for data channel to be fully open before processing messages
      dc.onopen = () => {
        console.log("[P2PReceive] Data channel opened, ready to receive");
      };

      dc.onmessage = async (e) => {
        if (typeof e.data === "string") {
          const msg = JSON.parse(e.data);

          if (msg.type === "file_meta") {
            fileMetaRef.current = msg;
            setFileMeta(msg);
            chunksRef.current = [];
            receivedBytesRef.current = 0;
            startTimeRef.current = Date.now();

            if (msg.encrypted) {
              const pw = passwordOverride;
              if (pw) {
                const saltBytes = Uint8Array.from(atob(msg.salt), (c) => c.charCodeAt(0));
                cryptoKeyRef.current = await deriveKey(pw, saltBytes);
                // Ensure data channel is open before sending receiver_ready
                if (dc.readyState === "open") {
                  console.log("[P2PReceive] Sending receiver_ready (encrypted file)");
                  dc.send(JSON.stringify({ type: "receiver_ready" }));
                  setStatus("receiving");
                } else {
                  console.error("[P2PReceive] Data channel not open, cannot send receiver_ready");
                  setError("Connection not ready. Please try again.");
                  setStatus("error");
                }
              } else {
                // No password in URL → ask user
                setStatus("password_required");
              }
            } else {
              cryptoKeyRef.current = null;
              // Ensure data channel is open before sending receiver_ready
              if (dc.readyState === "open") {
                console.log("[P2PReceive] Sending receiver_ready (unencrypted file)");
                dc.send(JSON.stringify({ type: "receiver_ready" }));
                setStatus("receiving");
              } else {
                console.error("[P2PReceive] Data channel not open, cannot send receiver_ready");
                setError("Connection not ready. Please try again.");
                setStatus("error");
              }
            }
          }

          if (msg.type === "transfer_complete") {
            await finalize();
          }
        } else {
          // Binary chunk
          // Never process encrypted chunks until decryption key is ready.
          if (fileMetaRef.current?.encrypted && !cryptoKeyRef.current) {
            return;
          }

          let chunk;
          if (cryptoKeyRef.current) {
            try {
              chunk = await decryptChunk(cryptoKeyRef.current, e.data);
            } catch {
              setError("Decryption failed. The password may be incorrect.");
              setStatus("error");
              dc.close();
              return;
            }
          } else {
            chunk = e.data;
          }

          chunksRef.current.push(chunk instanceof ArrayBuffer ? new Uint8Array(chunk) : chunk);
          receivedBytesRef.current += (chunk instanceof ArrayBuffer ? chunk.byteLength : chunk.byteLength);

          const meta = fileMetaRef.current;
          if (meta?.size > 0) {
            // Throttle UI updates to only trigger on percentage change or every ~10 chunks
            // to prevent massively choking the React render thread on fast networks.
            if (!chunksRef.current.length || chunksRef.current.length % 10 === 0) {
              const pct = Math.min(100, Math.round((receivedBytesRef.current / meta.size) * 100));
              setProgress(pct);

              const elapsed = (Date.now() - startTimeRef.current) / 1000;
              if (elapsed > 0) {
                const bps = receivedBytesRef.current / elapsed;
                setTransferSpeed(formatSpeed(bps));
              }
            }
          }
        }
      };
    };

    await pc.setRemoteDescription({ type: "offer", sdp: offerSdp });
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    ws.send(JSON.stringify({
      type: "answer",
      sdp: pc.localDescription.sdp,
      to: senderPeerId || senderPeerIdRef.current,
    }));
  };

  const finalize = async () => {
    const meta = fileMetaRef.current;
    if (!meta) return;

    setProgress(100);
    setStatus("done");

    const saved = await saveWithFSAPI(chunksRef.current, meta.name).catch(() => false);
    if (!saved) {
      saveAsBlobUrl(chunksRef.current, meta.name);
    }
  };

  const handleManualPasswordSubmit = async () => {
    if (!manualPassword) return;
    const meta = fileMetaRef.current;
    if (!meta?.salt) return;

    const dc = dataChannelRef.current;
    if (!dc || dc.readyState !== "open") {
      setError("Connection not ready. Please try again.");
      setStatus("error");
      return;
    }

    const saltBytes = Uint8Array.from(atob(meta.salt), (c) => c.charCodeAt(0));
    cryptoKeyRef.current = await deriveKey(manualPassword, saltBytes);
    console.log("[P2PReceive] Sending receiver_ready (manual password)");
    dc.send(JSON.stringify({ type: "receiver_ready" }));
    setStatus("receiving");
  };

  function formatSpeed(bps) {
    if (bps > 1024 * 1024) return (bps / (1024 * 1024)).toFixed(1) + " MB/s";
    if (bps > 1024) return (bps / 1024).toFixed(1) + " KB/s";
    return bps.toFixed(0) + " B/s";
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="app-container">
      <Header />
      <div className="main-content" style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 480, textAlign: "center" }}>

          <h1 style={{
            fontSize: "clamp(1.75rem, 4vw, 2.25rem)",
            fontWeight: 800,
            fontFamily: "var(--font-display)",
            color: "var(--text-primary)",
            marginBottom: "0.5rem"
          }}>
            Receiving File
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "2rem" }}>
            Direct browser-to-browser transfer — no server storage.
          </p>

          <div className="card" style={{ padding: "2rem" }}>

            {status === "connecting" && (
              <StatusBlock icon="🔄" title="Connecting to signaling server…" />
            )}

            {status === "waiting" && (
              <StatusBlock icon="⏳" title="Waiting for sender…"
                subtitle="Keep this tab open. The sender needs to have their page open too." />
            )}

            {status === "password_required" && (
              <>
                <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🔒</div>
                <div style={{ color: "var(--text-primary)", fontWeight: 600, marginBottom: "1rem" }}>
                  This transfer is encrypted. Enter the password:
                </div>
                <input
                  type="password"
                  placeholder="Password"
                  value={manualPassword}
                  onChange={(e) => setManualPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleManualPasswordSubmit()}
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
                <button className="btn-primary" style={{ width: "100%" }} onClick={handleManualPasswordSubmit}>
                  Decrypt &amp; Receive
                </button>
              </>
            )}

            {status === "receiving" && (
              <>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📥</div>
                <div style={{ color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.25rem" }}>
                  Receiving {fileMeta?.name}
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
                  {fileMeta ? (fileMeta.size / (1024 * 1024)).toFixed(2) : 0} MB · {transferSpeed}
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
                <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{progress}%</div>
              </>
            )}

            {status === "done" && (
              <>
                <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>✅</div>
                <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "1.25rem", marginBottom: "0.5rem" }}>
                  File Received!
                </div>
                <div style={{ color: "var(--text-secondary)" }}>
                  <strong>{fileMeta?.name}</strong> has been saved to your device.
                </div>
              </>
            )}

            {status === "error" && (
              <>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>❌</div>
                <div style={{ color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.5rem" }}>Connection Error</div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>{error}</div>
                <button className="btn-secondary" onClick={() => connect(legacyHashPassword || null)}>
                  Retry
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBlock({ icon, title, subtitle }) {
  return (
    <div>
      <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>{icon}</div>
      <div style={{ color: "var(--text-primary)", fontWeight: 600, marginBottom: subtitle ? "0.5rem" : 0 }}>{title}</div>
      {subtitle && <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>{subtitle}</div>}
    </div>
  );
}
