import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ModeSelector from "../components/ModeSelector";
import FileUploader from "../components/FileUploader";
import { createSession, uploadFile } from "../services/api";
import LogoutButton from "../components/LogoutButton";


export default function Home() {
    const [session, setSession] = useState(null);
    const [uploadResult, setUploadResult] = useState(null);
    const [zipBlob, setZipBlob] = useState(null);
    const [zipName, setZipName] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    
    // Upload options
    const [maxDownloads, setMaxDownloads] = useState(3);
    const [expiryHours, setExpiryHours] = useState(1);
    const [enableIpLock, setEnableIpLock] = useState(true);

    const navigate = useNavigate();

    // STEP 1: Create session (ONLINE / OFFLINE)
    const handleModeSelect = async (selectedMode) => {
        setUploadResult(null);
        setZipBlob(null);
        setZipName("");
        setPassword("");
        const res = await createSession(selectedMode);
        setSession(res.data);
    };

    // STEP 2: Upload file (mode-aware)
    const handleFileUpload = async (file) => {
        if (!password){
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
            
            console.log("Upload response:", response);
            console.log("Session mode:", session.mode);

            // 🔵 OFFLINE MODE → ZIP DOWNLOAD
            if (session.mode === "OFFLINE") {
                console.log("Processing OFFLINE mode...");
                const blob = new Blob([response.data], {
                    type: "application/zip",
                });
                console.log("Blob created:", blob.size, "bytes");
                setZipBlob(blob);
                setZipName(`${file.name}_qr_bundle.zip`);
                setLoading(false);
                return;
            }

            // 🔵 ONLINE MODE → JSON RESPONSE
            console.log("Processing ONLINE mode...");
            const text = await response.data.text();
            const json = JSON.parse(text);
            console.log("Parsed JSON:", json);
            setUploadResult(json);
            setLoading(false);

        } catch (err) {
            console.error("Upload failed:", err);
            console.error("Error details:", err.response?.data);
            alert("File upload failed. Check console for details.");
            setLoading(false);
        }
    };

    const handleZipDownload = () => {
        const url = window.URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = zipName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    return (
        <div style={{ padding: "20px", maxWidth: "700px", margin: "auto" }}>
            
            {/* Top Bar */}
            <div className="home-header">
                <h2>Q-Safe</h2>

                <div className="home-actions">
                    <button onClick={() => navigate("/dashboard")}>
                        📊 Dashboard
                    </button>

                    <button onClick={() => navigate("/audit")}>
                        🧾 Audit Logs
                    </button>
                    
                    <LogoutButton />
                </div>
            </div>

            {/* Reconstruct Button */}
            <button
                style={{ marginBottom: "20px" }}
                onClick={() => navigate("/reconstruct")}
            >
                Reconstruct File from QR ZIP
            </button>

            {/* Mode Selection */}
            {!session && (
                <ModeSelector onSelect={handleModeSelect} />
            )}

            {/* Upload Section */}
            {session && !uploadResult && !zipBlob && (
                <>
                    <p><strong>Session ID:</strong> {session.session_id}</p>
                    <p><strong>Mode:</strong> {session.mode}</p>

                    {/* 🔐 PASSWORD INPUT */}
                    <input
                        type="password"
                        placeholder="Enter encryption password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ marginBottom: "10px", width: "100%", padding: "8px" }}
                    />

                    {/* 🔧 ONLINE MODE OPTIONS */}
                    {session.mode === "ONLINE" && (
                        <div style={{ 
                            padding: "15px", 
                            background: "#f5f5f5", 
                            borderRadius: "5px",
                            marginBottom: "15px" 
                        }}>
                            <h4 style={{ marginTop: 0 }}>Security Options</h4>
                            
                            <div style={{ marginBottom: "10px" }}>
                                <label style={{ display: "block", marginBottom: "5px" }}>
                                    Max Downloads (1-10):
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={maxDownloads}
                                    onChange={(e) => setMaxDownloads(parseInt(e.target.value) || 3)}
                                    style={{ width: "100%", padding: "8px" }}
                                />
                            </div>

                            <div style={{ marginBottom: "10px" }}>
                                <label style={{ display: "block", marginBottom: "5px" }}>
                                    Expiry Time (1-24 hours):
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="24"
                                    value={expiryHours}
                                    onChange={(e) => setExpiryHours(parseInt(e.target.value) || 1)}
                                    style={{ width: "100%", padding: "8px" }}
                                />
                            </div>

                            <div style={{ marginBottom: "10px" }}>
                                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                                    <input
                                        type="checkbox"
                                        checked={enableIpLock}
                                        onChange={(e) => setEnableIpLock(e.target.checked)}
                                        style={{ marginRight: "8px" }}
                                    />
                                    Enable IP Lock (restrict to first downloader's IP)
                                </label>
                            </div>
                        </div>
                    )}

                    <FileUploader onUpload={handleFileUpload} />
                    {loading && <p>Processing file…</p>}
                </>
            )}

            {/* OFFLINE RESULT */}
            {zipBlob && session?.mode === "OFFLINE" && (
                <div style={{ marginTop: "30px" }}>
                    <h3>QR ZIP Ready</h3>
                    <p>Your QR bundle is ready.</p>
                    <button onClick={handleZipDownload}>
                        Download QR ZIP
                    </button>
                </div>
            )}

            {/* ONLINE RESULT */}
            {uploadResult && session?.mode === "ONLINE" && (
                <div style={{ marginTop: "30px" }}>
                    <h3>File Uploaded Successfully!</h3>
                    <p><strong>File:</strong> {uploadResult.filename}</p>
                    <p><strong>Mode:</strong> {uploadResult.mode}</p>

                    <a
                        href={uploadResult.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Download File
                    </a>

                    <p style={{ marginTop: "20px" }}>
                        Scan the QR code below to download the file:
                    </p>

                    <img
                        src={`data:image/png;base64,${uploadResult.qr_code}`}
                        alt="QR Code"
                        style={{ width: "250px" }}
                    />
                </div>
            )}
        </div>
    );
}