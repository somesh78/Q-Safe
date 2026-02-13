
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
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h2 className="page-title">Reconstruct File</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Upload a ZIP of QR codes (from Offline Mode) to reconstruct your original file.
                        </p>
                    </div>

                    <div className="card animate-fade-in">
                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: '600' }}>
                                Decryption Password
                            </label>
                            <input
                                className="input-field"
                                type="password"
                                placeholder="Enter password used during creation"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: '600' }}>
                                Upload QR ZIP
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
