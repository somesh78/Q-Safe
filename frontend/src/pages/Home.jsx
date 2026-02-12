
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createSession, uploadFile, getJobStatus, downloadJobResult } from "../services/api";
import LogoutButton from "../components/LogoutButton";
import '../App.css';

export default function Home() {
    const [session, setSession] = useState(null);
    const [uploadResult, setUploadResult] = useState(null);
    const [zipBlob, setZipBlob] = useState(null);
    const [zipName, setZipName] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    // Async job state (offline mode)
    const [jobId, setJobId] = useState(null);
    const [jobStatus, setJobStatus] = useState(null);
    const [jobProgress, setJobProgress] = useState(0);

    // Upload options
    const [maxDownloads, setMaxDownloads] = useState(3);
    const [expiryHours, setExpiryHours] = useState(1);
    const [enableIpLock, setEnableIpLock] = useState(true);

    const navigate = useNavigate();

    // Poll job status for offline mode
    useEffect(() => {
        if (!jobId || jobStatus === 'COMPLETED' || jobStatus === 'FAILED') return;

        const interval = setInterval(async () => {
            try {
                const response = await getJobStatus(jobId);
                const data = response.data;

                setJobStatus(data.status);
                setJobProgress(data.progress.percent);

                if (data.status === 'COMPLETED') {
                    clearInterval(interval);
                    setLoading(false);
                    // Auto-download the result
                    await handleJobDownload(jobId, data.original_filename);
                } else if (data.status === 'FAILED') {
                    clearInterval(interval);
                    setLoading(false);
                    alert(`Job failed: ${data.error_message || 'Unknown error'}`);
                }
            } catch (err) {
                console.error('Failed to fetch job status:', err);
                if (err.response && err.response.status === 401) {
                    clearInterval(interval);
                    setLoading(false);
                }
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [jobId, jobStatus]);

    const handleJobDownload = async (downloadJobId, filename) => {
        try {
            const response = await downloadJobResult(downloadJobId);
            const blob = new Blob([response.data], { type: 'application/zip' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `qr_codes_${filename}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to download job result:', err);
            alert('Failed to download result');
        }
    };

    const handleModeSelect = async (selectedMode) => {
        setUploadResult(null);
        setZipBlob(null);
        setZipName("");
        setPassword("");
        const res = await createSession(selectedMode);
        setSession(res.data);
    };

    const handleFileUpload = async (file) => {
        if (!password) {
            alert("Please enter a password before uploading the file.");
            return;
        }

        setLoading(true);

        try {
            const response = await uploadFile(file, session.session_id, password, {
                maxDownloads,
                expiryHours,
                enableIpLock
            });

            if (session.mode === "OFFLINE") {
                const data = response.data;
                if (data.job_id) {
                    setJobId(data.job_id);
                    setJobStatus('PENDING');
                    setZipName(`${file.name}_qr_bundle.zip`);
                } else {
                    alert('Failed to start job');
                    setLoading(false);
                }
                return;
            }

            setUploadResult(response.data);
            setLoading(false);

        } catch (err) {
            console.error("Upload failed:", err);
            alert("File upload failed. Check the file size or connection.");
            setLoading(false);
        }
    };

    return (
        <div className="app-container">
            {/* Header */}
            <header className="app-header">
                <div className="brand">Q-Safe</div>
                <div className="nav-actions">
                    <button className="btn-secondary" onClick={() => navigate("/dashboard")}>
                        Dashboard
                    </button>
                    <button className="btn-secondary" onClick={() => navigate("/audit")}>
                        Audit Logs
                    </button>
                    <LogoutButton />
                </div>
            </header>

            <main className="main-content">

                {/* Hero / Mode Selection */}
                {!session && (
                    <div className="mode-grid">
                        {/* Online Mode Card */}
                        <div className="mode-card" onClick={() => handleModeSelect("ONLINE")}>
                            <h3>🌐 Online Secure Share</h3>
                            <p>Upload files (max 50MB) and generate a secure, self-destructing QR link. Perfect for quick internet-based sharing.</p>
                        </div>

                        {/* Offline Mode Card */}
                        <div className="mode-card" onClick={() => handleModeSelect("OFFLINE")}>
                            <h3>📴 Offline Air-Gap</h3>
                            <p>Convert sensitive files into a series of QR codes. Reconstruct them on another device without any internet connection.</p>
                        </div>

                        {/* Reconstruct Card */}
                        <div className="mode-card" onClick={() => navigate("/reconstruct")}>
                            <h3>🧩 Reconstruct File</h3>
                            <p>Have a ZIP of QR codes or a series of images? Reassemble your original file here.</p>
                        </div>
                    </div>
                )}

                {/* Upload Workflow */}
                {session && !uploadResult && !zipBlob && (
                    <div className="animate-fade-in" style={{ width: '100%', maxWidth: '600px' }}>
                        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                            <button
                                className="btn-secondary"
                                onClick={() => setSession(null)}
                                style={{ fontSize: '0.9rem', marginBottom: '1rem' }}
                            >
                                ← Back to Modes
                            </button>
                            <h2>{session.mode === 'ONLINE' ? '🌐 Online Transfer' : '📴 Offline Generation'}</h2>
                            <p style={{ color: 'var(--text-secondary)' }}>Session ID: <span style={{ fontFamily: 'monospace' }}>{session.session_id.substring(0, 8)}...</span></p>
                        </div>

                        {/* Password Input */}
                        <div className="card" style={{ marginBottom: '2rem' }}>
                            <h3 style={{ marginTop: 0 }}>Step 1: Encryption</h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                Set a password to encrypt your file before it leaves your device.
                            </p>
                            <input
                                className="input-field"
                                type="password"
                                placeholder="Enter encryption password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {/* Online Options */}
                        {session.mode === "ONLINE" && (
                            <div className="card" style={{ marginBottom: '2rem' }}>
                                <h3 style={{ marginTop: 0 }}>Step 2: Security Settings</h3>
                                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
                                    <div>
                                        <label style={{ display: "block", marginBottom: "5px", fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                            Max Downloads
                                        </label>
                                        <input
                                            className="input-field"
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={maxDownloads}
                                            onChange={(e) => setMaxDownloads(parseInt(e.target.value) || 3)}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", marginBottom: "5px", fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                            Expiry (Hours)
                                        </label>
                                        <input
                                            className="input-field"
                                            type="number"
                                            min="1"
                                            max="24"
                                            value={expiryHours}
                                            onChange={(e) => setExpiryHours(parseInt(e.target.value) || 1)}
                                        />
                                    </div>
                                </div>
                                <div style={{ marginTop: '1rem' }}>
                                    <label style={{ display: "flex", alignItems: "center", cursor: "pointer", gap: '0.5rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={enableIpLock}
                                            onChange={(e) => setEnableIpLock(e.target.checked)}
                                        />
                                        <span style={{ fontSize: '0.95rem' }}>Enable IP Lock (restrict to first downloader's IP)</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* File Upload */}
                        <div className="card">
                            <h3 style={{ marginTop: 0 }}>Step {session.mode === 'ONLINE' ? '3' : '2'}: Upload File</h3>
                            {!loading ? (
                                <div className="upload-zone">
                                    <div className="upload-icon">📁</div>
                                    <p>Click or Drag file here to upload</p>
                                    <input
                                        type="file"
                                        onChange={(e) => handleFileUpload(e.target.files[0])}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            opacity: 0,
                                            cursor: 'pointer'
                                        }}
                                    />
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '2rem' }}>
                                    <p>Processing...</p>
                                    <div className="progress-container">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${session.mode === 'OFFLINE' ? jobProgress : 100}%` }}
                                        />
                                    </div>
                                    {session.mode === 'OFFLINE' && (
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                            Generating QR Codes: {jobProgress}%
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* OFFLINE RESULT */}
                {jobId && session?.mode === "OFFLINE" && jobStatus === 'COMPLETED' && (
                    <div className="result-card">
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                        <h2 style={{ color: 'var(--success)' }}>Generation Complete!</h2>
                        <p>Your QR code bundle has been generated.</p>
                        <button className="btn-primary" onClick={() => handleJobDownload(jobId, zipName)}>
                            Download ZIP Again
                        </button>
                        <br /><br />
                        <button className="btn-secondary" onClick={() => { setSession(null); setJobId(null); }}>
                            Start New Session
                        </button>
                    </div>
                )}

                {/* ONLINE RESULT */}
                {uploadResult && session?.mode === "ONLINE" && (
                    <div className="result-card">
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                        <h2>File Ready to Share</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>{uploadResult.filename}</p>

                        <div className="qr-container">
                            <img
                                src={`data:image/png;base64,${uploadResult.qr_code}`}
                                alt="QR Code"
                                style={{ width: "200px", height: "auto" }}
                            />
                        </div>

                        <div style={{ margin: '1rem 0' }}>
                            <a
                                href={`data:image/png;base64,${uploadResult.qr_code}`}
                                download={`q_safe_qrcode_${uploadResult.filename}.png`}
                                className="btn-primary"
                                style={{ display: 'inline-block' }}
                            >
                                Download QR Code
                            </a>
                        </div>

                        <button className="btn-secondary" onClick={() => { setSession(null); setUploadResult(null); }}>
                            Done
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
