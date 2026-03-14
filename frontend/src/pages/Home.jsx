
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createSession, uploadFile, getJobStatus, downloadJobResult } from "../services/api";
import Header from "../components/Header";
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
    const [customMaxDownloads, setCustomMaxDownloads] = useState(false);
    const [customExpiryHours, setCustomExpiryHours] = useState(false);

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
            <Header showDashboardBtn={true} showLogout={true} />

            <main className="main-content">

                {/* Hero / Mode Selection */}
                {!session && (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '3rem', maxWidth: '700px' }}>
                            <h1 className="page-title" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                                Choose Your Transfer Mode
                            </h1>
                            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                                Select the transfer method that best fits your security requirements. 
                                Both modes use military-grade AES-256 encryption to keep your data safe.
                            </p>
                        </div>
                        
                        <div className="mode-grid">
                            {/* Online Mode Card */}
                            <div className="mode-card animate-fade-in stagger-1" onClick={() => handleModeSelect("ONLINE")}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌐</div>
                                <h3>Online Secure Share</h3>
                                <p style={{ marginBottom: '1rem' }}>Upload files (up to 500MB) and generate a secure, self-destructing QR link. Perfect for quick internet-based sharing.</p>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                                    <div style={{ marginBottom: '0.5rem' }}>✓ Custom expiration times</div>
                                    <div style={{ marginBottom: '0.5rem' }}>✓ IP address locking</div>
                                    <div>✓ Download limit controls</div>
                                </div>
                            </div>

                            {/* P2P Mode Card */}
                            <div className="mode-card animate-fade-in stagger-2" onClick={() => navigate("/send")}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
                                <h3>P2P Direct Transfer</h3>
                                <p style={{ marginBottom: '1rem' }}>Send files browser-to-browser with WebRTC. Nothing is stored on the server, and the transfer stays live only while both peers are connected.</p>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                                    <div style={{ marginBottom: '0.5rem' }}>✓ No server-side file storage</div>
                                    <div style={{ marginBottom: '0.5rem' }}>✓ Direct browser-to-browser link</div>
                                    <div>✓ Optional password encryption</div>
                                </div>
                            </div>

                            {/* Offline Mode Card */}
                            <div className="mode-card animate-fade-in stagger-3" onClick={() => handleModeSelect("OFFLINE")}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📴</div>
                                <h3>Offline Air-Gap</h3>
                                <p style={{ marginBottom: '1rem' }}>Convert sensitive files into a series of QR codes. Reconstruct them on another device without any internet connection.</p>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                                    <div style={{ marginBottom: '0.5rem' }}>✓ No internet required</div>
                                    <div style={{ marginBottom: '0.5rem' }}>✓ Air-gapped security</div>
                                    <div>✓ QR code sequences</div>
                                </div>
                            </div>

                            {/* Reconstruct Card */}
                            <div className="mode-card animate-fade-in stagger-4" onClick={() => navigate("/reconstruct")}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧩</div>
                                <h3>Reconstruct File</h3>
                                <p style={{ marginBottom: '1rem' }}>Have a ZIP of QR codes or a series of images? Reassemble your original file here.</p>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                                    <div style={{ marginBottom: '0.5rem' }}>✓ Upload QR ZIP file</div>
                                    <div style={{ marginBottom: '0.5rem' }}>✓ Enter decryption password</div>
                                    <div>✓ Download original file</div>
                                </div>
                            </div>
                        </div>
                    </>
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
                            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>🔐</span> Step 1: Encryption Password
                            </h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                Set a strong password to encrypt your file before it leaves your device. 
                                This password is never sent to our servers - it stays with you.
                            </p>
                            <input
                                className="input-field"
                                type="password"
                                placeholder="Enter encryption password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <div style={{ 
                                marginTop: '0.75rem', 
                                padding: '0.75rem',
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: '0.5rem'
                            }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>💡 Tip: Use a strong, unique password you'll remember</span>
                            </div>
                        </div>

                        {/* Security Settings */}
                        <div className="card" style={{ marginBottom: '2rem' }}>
                            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>⚙️</span> Step 2: Security Settings
                            </h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                                    Configure how long your file remains accessible and who can download it.
                                </p>
                                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
                                    <div>
                                        <label style={{ display: "block", marginBottom: "5px", fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                            Max Downloads
                                        </label>
                                        <select
                                            className="input-field"
                                            value={customMaxDownloads ? 'custom' : maxDownloads}
                                            onChange={(e) => {
                                                if (e.target.value === 'custom') {
                                                    setCustomMaxDownloads(true);
                                                    setMaxDownloads(1);
                                                } else {
                                                    setCustomMaxDownloads(false);
                                                    setMaxDownloads(parseInt(e.target.value));
                                                }
                                            }}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <option value={1}>1</option>
                                            <option value={3}>3</option>
                                            <option value={5}>5</option>
                                            <option value={10}>10</option>
                                            <option value="custom">Custom</option>
                                        </select>
                                        {customMaxDownloads && (
                                            <input
                                                className="input-field"
                                                type="number"
                                                min="1"
                                                max="100"
                                                value={maxDownloads}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value);
                                                    if (val >= 1) setMaxDownloads(val);
                                                    else if (e.target.value === '') setMaxDownloads('');
                                                }}
                                                onBlur={() => { if (!maxDownloads || maxDownloads < 1) setMaxDownloads(1); }}
                                                placeholder="Enter number (min 1)"
                                                style={{ marginTop: '0.5rem' }}
                                            />
                                        )}
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Link expires after this many downloads</span>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", marginBottom: "5px", fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                            Expiry (Hours)
                                        </label>
                                        <select
                                            className="input-field"
                                            value={customExpiryHours ? 'custom' : expiryHours}
                                            onChange={(e) => {
                                                if (e.target.value === 'custom') {
                                                    setCustomExpiryHours(true);
                                                    setExpiryHours(1);
                                                } else {
                                                    setCustomExpiryHours(false);
                                                    setExpiryHours(parseInt(e.target.value));
                                                }
                                            }}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <option value={1}>1 hour</option>
                                            <option value={6}>6 hours</option>
                                            <option value={12}>12 hours</option>
                                            <option value={24}>24 hours</option>
                                            <option value="custom">Custom</option>
                                        </select>
                                        {customExpiryHours && (
                                            <input
                                                className="input-field"
                                                type="number"
                                                min="1"
                                                max="72"
                                                value={expiryHours}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value);
                                                    if (val >= 1) setExpiryHours(val);
                                                    else if (e.target.value === '') setExpiryHours('');
                                                }}
                                                onBlur={() => { if (!expiryHours || expiryHours < 1) setExpiryHours(1); }}
                                                placeholder="Enter hours (min 1)"
                                                style={{ marginTop: '0.5rem' }}
                                            />
                                        )}
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Auto-delete after this time period</span>
                                    </div>
                                </div>
                                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255, 107, 107, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                                    <label style={{ display: "flex", alignItems: "center", cursor: "pointer", gap: '0.75rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={enableIpLock}
                                            onChange={(e) => setEnableIpLock(e.target.checked)}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                        <div>
                                            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                                🔒 Enable IP Lock
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                                Restrict downloads to the first downloader's IP address for maximum security
                                            </div>
                                        </div>
                                    </label>
                                </div>
                        </div>

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
                        <h2 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>Generation Complete!</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Your QR code bundle has been generated and downloaded successfully.</p>
                        
                        <div style={{ 
                            background: 'rgba(255, 167, 38, 0.1)', 
                            padding: '1.25rem', 
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '2rem',
                            border: '1px solid rgba(255, 167, 38, 0.2)',
                            textAlign: 'left'
                        }}>
                            <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--text-primary)' }}>📋 Next Steps:</h4>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                                1. Extract the ZIP file to access QR codes<br/>
                                2. Display or print QR codes for scanning<br/>
                                3. Scan on air-gapped device to transfer<br/>
                                4. Use Reconstruct page to reassemble file
                            </div>
                        </div>
                        
                        <button className="btn-primary" onClick={() => handleJobDownload(jobId, zipName)}>
                            📥 Download ZIP Again
                        </button>
                        <br /><br />
                        <button className="btn-secondary" onClick={() => { setSession(null); setJobId(null); }}>
                            ← Start New Session
                        </button>
                    </div>
                )}

                {/* ONLINE RESULT */}
                {uploadResult && session?.mode === "ONLINE" && (
                    <div className="result-card">
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                        <h2 style={{ marginBottom: '0.5rem' }}>File Ready to Share</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem' }}>
                            {uploadResult.filename}
                        </p>

                        <div style={{ 
                            background: 'rgba(255, 167, 38, 0.1)', 
                            padding: '1rem', 
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '1.5rem',
                            border: '1px solid rgba(255, 167, 38, 0.2)'
                        }}>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.6' }}>
                                <strong style={{ color: 'var(--text-primary)' }}>📱 Share this QR code</strong> with your recipient. 
                                They'll need the password you set to decrypt and download the file.
                            </p>
                        </div>

                        <div className="qr-container">
                            <img
                                src={`data:image/png;base64,${uploadResult.qr_code}`}
                                alt="QR Code"
                                style={{ width: "200px", height: "auto" }}
                            />
                        </div>

                        <div style={{ margin: '1.5rem 0' }}>
                            <a
                                href={`data:image/png;base64,${uploadResult.qr_code}`}
                                download={`q_safe_qrcode_${uploadResult.filename}.png`}
                                className="btn-primary"
                                style={{ display: 'inline-block', textDecoration: 'none' }}
                            >
                                💾 Save QR Code Image
                            </a>
                        </div>

                        <div style={{ 
                            padding: '1rem', 
                            background: 'rgba(255, 107, 107, 0.08)', 
                            borderRadius: 'var(--radius-sm)',
                            marginBottom: '1.5rem',
                            fontSize: '0.85rem',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)'
                        }}>
                            🔒 Security: IP locked • Max {maxDownloads} downloads • Expires in {expiryHours}h
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
