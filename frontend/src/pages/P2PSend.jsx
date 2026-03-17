import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

const CHUNK_SIZE = 64 * 1024; // 64 KB — good balance for DataChannel throughput
const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

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
  const [status, setStatus] = useState("idle"); // idle | waiting | connected | sending | done | error
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [transferSpeed, setTransferSpeed] = useState("");

  const wsRef = useRef(null);
  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const fileRef = useRef(null);
  const transferStartedRef = useRef(false);
  const transferSaltRef = useRef(null);

  // Build the shareable link (never include password in URL)
  const shareLink = `${window.location.origin}/receive/${roomId}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback: select text
    }
  };

  // ── Clean up on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      dcRef.current?.close();
      pcRef.current?.close();
      wsRef.current?.close();
    };
  }, []);

  // ── Start signaling (called when user clicks "Create Transfer Link") ────────
  const startSignaling = useCallback(() => {
    if (!fileRef.current) return;
    setStatus("waiting");
    setError("");

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

      if (msg.type === "receiver_joined" || msg.type === "answer" || msg.type === "ice_candidate") {
        // Receiver is connecting — set up PeerConnection if not yet done
        if (!pcRef.current && msg.type === "receiver_joined") {
          await setupPeerConnection(ws);
        }
        if (msg.type === "answer" && pcRef.current) {
          await pcRef.current.setRemoteDescription({ type: "answer", sdp: msg.sdp });
        }
        if (msg.type === "ice_candidate" && pcRef.current) {
          try {
            await pcRef.current.addIceCandidate(msg.candidate);
          } catch {
            // Benign: stale candidate
          }
        }
      }

      if (msg.type === "peer_disconnected" && status !== "done") {
        setError("Receiver disconnected before the transfer was complete.");
        setStatus("error");
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // ── Set up WebRTC peer connection ──────────────────────────────────────────
  const setupPeerConnection = async (ws) => {
    setStatus("connected");

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    // Create data channel for file transfer
    const dc = pc.createDataChannel("file-transfer", { ordered: true });
    dcRef.current = dc;

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        ws.send(JSON.stringify({ type: "ice_candidate", candidate: e.candidate }));
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        if (status !== "done") {
          setError("WebRTC connection lost.");
          setStatus("error");
        }
      }
    };

    dc.onopen = () => {
      transferStartedRef.current = false;
      // Send metadata first; receiver will explicitly ACK when ready.
      sendFileMeta(dc);
    };

    dc.onmessage = async (event) => {
      if (typeof event.data !== "string") return;
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "receiver_ready" && !transferStartedRef.current) {
          transferStartedRef.current = true;
          await sendFile(dc);
        }
      } catch {
        // Ignore non-JSON control messages.
      }
    };

    dc.onerror = (e) => {
      setError("Data channel error: " + e.message);
      setStatus("error");
    };

    // Create and send offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    ws.send(JSON.stringify({ type: "offer", sdp: pc.localDescription.sdp }));
  };

  const sendFileMeta = async (dc) => {
    const f = fileRef.current;
    if (!f) return;

    transferSaltRef.current = (usePassword && password)
      ? crypto.getRandomValues(new Uint8Array(16))
      : null;

    // Send file metadata first
    dc.send(JSON.stringify({
      type: "file_meta",
      name: f.name,
      size: f.size,
      encrypted: !!(usePassword && password),
      salt: transferSaltRef.current ? btoa(String.fromCharCode(...transferSaltRef.current)) : null,
      password_hint: usePassword && password ? "required" : null,
    }));
  };

  // ── Send file over DataChannel ─────────────────────────────────────────────
  const sendFile = async (dc) => {
    setStatus("sending");
    const f = fileRef.current;
    if (!f) return;

    let cryptoKey = null;

    if (usePassword && password) {
      const saltBytes = transferSaltRef.current;
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
      while (dc.bufferedAmount > 4 * 1024 * 1024) {
        await new Promise((r) => setTimeout(r, 10));
      }

      const slice = f.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const ab = await slice.arrayBuffer();

      if (cryptoKey) {
        const encrypted = await encryptChunk(cryptoKey, ab);
        dc.send(encrypted);
      } else {
        dc.send(ab);
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

    dc.send(JSON.stringify({ type: "transfer_complete" }));
    setStatus("done");
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

                {usePassword && (
                  <input
                    type="password"
                    placeholder="Enter password"
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

                <button
                  className="btn-primary"
                  style={{ width: "100%", padding: "0.875rem", fontSize: "1rem" }}
                  onClick={handleStart}
                  disabled={!file || (usePassword && !password)}
                >
                  Create Transfer Link
                </button>
              </>
            )}

            {/* Step 2 — Waiting for receiver */}
            {(status === "waiting" || status === "connected") && (
              <>
                <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
                    {status === "waiting" ? "⏳" : "🔗"}
                  </div>
                  <div style={{ color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.25rem" }}>
                    {status === "waiting" ? "Waiting for receiver…" : "Receiver connected! Setting up transfer…"}
                  </div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                    <strong>{file?.name}</strong> ({file ? (file.size / (1024 * 1024)).toFixed(2) : 0} MB)
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
