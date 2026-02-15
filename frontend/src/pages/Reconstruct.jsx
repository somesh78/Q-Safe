
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { reconstructFromZip } from "../services/api";
import LogoutButton from "../components/LogoutButton";
import Header from "../components/Header";
import '../App.css';

export default function Reconstruct() {
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState("");
    const [fileBlob, setFileBlob] = useState(null);
    const [fileName, setFileName] = useState("");

    const navigate = useNavigate();

    const handleZipUpload = async (file) => {
        if (!password) {
            alert("Please enter a password before uploading the file.");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("zip", file);
            formData.append("password", password);

            const response = await reconstructFromZip(formData);

            let filename = "reconstructed_file";
            const disposition = response.headers?.["content-disposition"];

            if (disposition && disposition.includes("filename=")) {
                const match = disposition.match(/filename="?([^"]+)"?/);
                if (match && match[1]) {
                    filename = match[1];
                }
            }

            const blob = new Blob([response.data], { type: response.headers?.['content-type'] || "application/octet-stream" });
            setFileBlob(blob);
            setFileName(filename);
        } catch (error) {
            console.error("Reconstruction failed:", error);
            alert("Reconstruction failed. Please check the password or file integrity.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        const url = window.URL.createObjectURL(fileBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    return (
        <div className="app-container">
            <Header showHomeBtn={true} showLogout={true} />

            <main className="main-content">
                <div style={{ maxWidth: '600px', width: '100%', margin: '0 auto' }}>
                    <button
                        className="btn-secondary"
                        onClick={() => navigate('/app')}
                        style={{ 
                            fontSize: '0.9rem', 
                            marginBottom: '1.5rem',
                            padding: '0.625rem 1.25rem'
                        }}
                    >
                        ← Back to Home
                    </button>
                    
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h2 className="page-title">Reconstruct File</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto' }}>
                            Upload a ZIP file containing QR codes generated from Offline Mode to reconstruct and download your original encrypted file.
                        </p>
                    </div>

                    {/* Info Cards */}
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                        gap: '1rem', 
                        marginBottom: '2rem' 
                    }}>
                        <div style={{ 
                            padding: '1rem', 
                            background: 'rgba(255, 107, 107, 0.08)', 
                            border: '1px solid var(--border-color)', 
                            borderRadius: 'var(--radius-sm)',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📦</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Accepts ZIP files</div>
                        </div>
                        <div style={{ 
                            padding: '1rem', 
                            background: 'rgba(255, 107, 107, 0.08)', 
                            border: '1px solid var(--border-color)', 
                            borderRadius: 'var(--radius-sm)',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔐</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Password required</div>
                        </div>
                        <div style={{ 
                            padding: '1rem', 
                            background: 'rgba(255, 107, 107, 0.08)', 
                            border: '1px solid var(--border-color)', 
                            borderRadius: 'var(--radius-sm)',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚡</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Instant processing</div>
                        </div>
                    </div>

                    <div className="card animate-fade-in">
                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: "0.75rem", fontWeight: '600' }}>
                                <span>🔐</span> Decryption Password
                            </label>
                            <input
                                className="input-field"
                                type="password"
                                placeholder="Enter password used during creation"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: 0 }}>
                                Use the same password that was set when creating the QR codes
                            </p>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: "0.75rem", fontWeight: '600' }}>
                                <span>📦</span> Upload QR ZIP File
                            </label>
                            {!loading ? (
                                <div className="upload-zone">
                                    <div className="upload-icon">📦</div>
                                    <p>Click or Drag ZIP file here</p>
                                    <input
                                        type="file"
                                        accept=".zip"
                                        onChange={(e) => handleZipUpload(e.target.files[0])}
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
                                    <div className="spinner" style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
                                    <p>Decrypting & Reconstructing...</p>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>This happens locally in your browser/server securely.</p>
                                </div>
                            )}
                        </div>

                        {fileBlob && (
                            <div className="result-card" style={{ marginTop: 0, border: 'none', background: 'var(--bg-secondary)' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎉</div>
                                <h3>Reconstruction Successful!</h3>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{fileName}</p>
                                <button className="btn-primary" onClick={handleDownload}>
                                    Download Reconstructed File
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
