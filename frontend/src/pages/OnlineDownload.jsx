
import { useParams } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import ThemeToggle from "../components/ThemeToggle";
import '../App.css';

export default function OnlineDownload() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDownload = async (e) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Password is required");
      return;
    }

    setLoading(true);

    try {
      // Updated to use relative path if proxy is set or configurable URL
      const apiUrl = process.env.REACT_APP_API_URL || 'https://q-safe.onrender.com';

      const response = await axios.post(
        `${apiUrl}/download/${token}/`,
        { password },
        {
          responseType: "blob",
          headers: { 'Content-Type': 'application/json' }
        }
      );

      let filename = "downloaded_file";
      const disposition = response.headers["content-disposition"];
      if (disposition && disposition.includes("filename=")) {
        filename = disposition.split("filename=")[1].replace(/"/g, "");
      }

      const blob = new Blob([response.data], { type: response.headers["content-type"] || "application/octet-stream" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Optional: Close window or show success message?
      // For now, just reset loading state
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 410) {
        setError("This link has expired.");
      } else if (err.response && err.response.status === 403) {
        setError("Access denied (IP Locked or Limit Reached).");
      } else {
        setError("Incorrect password or invalid link.");
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
          <h1 className="brand" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Q-Safe</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Secure File Transfer Portal</p>
        </div>

        <div style={{
          background: 'var(--bg-secondary)',
          padding: '1rem',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1.5rem',
          textAlign: 'center',
          border: '1px solid var(--border-color)'
        }}>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            You have received a secure encrypted file.
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
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Encryption Password
            </label>
            <input
              className="input-field"
              type="password"
              placeholder="Enter password to decrypt"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? "Decrypting & Downloading..." : "Unlock & Download"}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Locked by IP • One-time Use • Encrypted
        </div>
      </div>
    </div>
  );
}
