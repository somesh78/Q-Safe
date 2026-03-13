
import { useParams } from "react-router-dom";
import { useState } from "react";
import ThemeToggle from "../components/ThemeToggle";
import '../App.css';

function getFilenameFromContentDisposition(dispositionHeader) {
  if (!dispositionHeader) return "downloaded_file";

  // RFC 5987: filename*=UTF-8''encoded-name
  const utf8NameMatch = dispositionHeader.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8NameMatch && utf8NameMatch[1]) {
    try {
      return decodeURIComponent(utf8NameMatch[1]);
    } catch {
      return utf8NameMatch[1];
    }
  }

  const plainNameMatch = dispositionHeader.match(/filename="?([^";]+)"?/i);
  if (plainNameMatch && plainNameMatch[1]) {
    return plainNameMatch[1];
  }

  return "downloaded_file";
}

async function streamToFile(response, filename, onProgress) {
  if (!("showSaveFilePicker" in window)) {
    return false;
  }

  const handle = await window.showSaveFilePicker({
    suggestedName: filename,
    types: [{
      description: "Downloaded file",
      accept: { "application/octet-stream": [".*"] }
    }]
  });

  const writable = await handle.createWritable();
  const reader = response.body?.getReader();

  if (!reader) {
    await writable.close();
    throw new Error("Streaming is not supported by this browser response.");
  }

  const totalBytes = Number(response.headers.get("content-length") || 0);
  let writtenBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      await writable.write(value);
      writtenBytes += value.byteLength;

      if (totalBytes > 0) {
        onProgress(Math.min(100, Math.round((writtenBytes / totalBytes) * 100)));
      }
    }

    await writable.close();
    return true;
  } catch (error) {
    try {
      await writable.abort();
    } catch {
      // Ignore abort failures.
    }
    throw error;
  }
}

export default function OnlineDownload() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [downloadProgress, setDownloadProgress] = useState(0);

  const handleDownload = async (e) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Password is required");
      return;
    }

    setLoading(true);
    setDownloadProgress(0);

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'https://q-safe.onrender.com';

      const response = await fetch(`${apiUrl}/download/${token}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (!response.ok) {
        let serverError = '';
        try {
          const errorJson = await response.json();
          serverError = errorJson?.error || '';
        } catch {
          // Ignore JSON parsing issues for non-JSON error responses.
        }

        if (response.status === 410) {
          throw new Error(serverError || "This link has expired.");
        }
        if (response.status === 403) {
          throw new Error(serverError || "Access denied (IP Locked or Limit Reached).");
        }
        if (response.status === 404) {
          throw new Error(serverError || "Invalid or unavailable link.");
        }
        if (response.status === 429) {
          throw new Error(serverError || "Download limit reached.");
        }

        throw new Error(serverError || "Incorrect password or invalid link.");
      }

      const filename = getFilenameFromContentDisposition(response.headers.get("content-disposition"));

      const streamed = await streamToFile(response, filename, setDownloadProgress);

      if (!streamed) {
        // Fallback for browsers without File System Access API.
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }

      setDownloadProgress(100);
    } catch (err) {
      console.error(err);
      if (err && err.name === 'AbortError') {
        setError("Download was canceled.");
      } else {
        setError(err?.message || "Incorrect password or invalid link.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
        <ThemeToggle />
      </div>
      <div className="auth-card animate-fade-in">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 className="brand" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Q-Safe</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Secure File Transfer Portal</p>
        </div>

        <div style={{
          background: 'rgba(255, 107, 107, 0.1)',
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          textAlign: 'center',
          border: '1px solid rgba(255, 107, 107, 0.2)'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔐</div>
          <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '500', color: 'var(--text-primary)', lineHeight: '1.5' }}>
            You have received a secure encrypted file. Enter the password to decrypt and download.
          </p>
        </div>

        {error && (
          <div style={{
            color: 'var(--error)',
            background: 'rgba(239, 68, 68, 0.1)',
            padding: '0.75rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1rem',
            textAlign: 'center',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleDownload}>
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: "block", marginBottom: "0.75rem", fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              🔑 Encryption Password
            </label>
            <input
              className="input-field"
              type="password"
              placeholder="Enter password to decrypt"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: 0 }}>
              Ask the sender for the password if you don't have it
            </p>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? "🔓 Decrypting & Downloading..." : "🔓 Unlock & Download"}
          </button>

          {loading && (
            <div style={{ marginTop: '1rem' }}>
              <div className="progress-container">
                <div className="progress-fill" style={{ width: `${downloadProgress}%` }} />
              </div>
              <p style={{
                marginTop: '0.5rem',
                marginBottom: 0,
                textAlign: 'center',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)'
              }}>
                {downloadProgress > 0 ? `Downloading: ${downloadProgress}%` : 'Preparing secure stream...'}
              </p>
            </div>
          )}
        </form>

        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem',
          background: 'rgba(255, 167, 38, 0.08)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(255, 167, 38, 0.2)'
        }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
            <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>🛡️ Security Features</div>
            <div>• End-to-end encryption</div>
            <div>• IP locked access</div>
            <div>• Limited downloads</div>
            <div>• Auto-expiration</div>
          </div>
        </div>
      </div>
    </div>
  );
}
