import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ModeSelector from "../components/ModeSelector";
import FileUploader from "../components/FileUploader";
import { createSession, uploadFile, getJobStatus, downloadJobResult } from "../services/api";
import LogoutButton from "../components/LogoutButton";


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
            }
        }, 2000); // Poll every 2 seconds

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

            // 🔵 OFFLINE MODE → ASYNC JOB
            if (session.mode === "OFFLINE") {
                console.log("Processing OFFLINE mode (async)...");
                const data = response.data;
                
                if (data.job_id) {
                    setJobId(data.job_id);
                    setJobStatus('PENDING');
                    setZipName(`${file.name}_qr_bundle.zip`);
                    // Keep loading=true, will be set to false when job completes
                } else {
                    alert('Failed to start job');
                    setLoading(false);
                }
                return;
            }

            // 🔵 ONLINE MODE → JSON RESPONSE
            console.log("Processing ONLINE mode...");
            setUploadResult(response.data);
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

            {/* OFFLINE RESULT - ASYNC PROGRESS */}
            {jobId && session?.mode === "OFFLINE" && (
                <div style={{ marginTop: "30px", padding: "20px", background: "#f5f5f5", borderRadius: "5px" }}>
                    <h3>🔄 Generating QR Codes...</h3>
                    <p><strong>Status:</strong> {jobStatus || 'PENDING'}</p>
                    
                    {jobProgress > 0 && (
                        <>
                            <div style={{
                                width: "100%",
                                height: "30px",
                                background: "#ddd",
                                borderRadius: "5px",
                                overflow: "hidden",
                                marginTop: "10px"
                            }}>
                                <div style={{
                                    width: `${jobProgress}%`,
                                    height: "100%",
                                    background: "linear-gradient(90deg, #4CAF50, #8BC34A)",
                                    transition: "width 0.3s",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "white",
                                    fontWeight: "bold"
                                }}>
                                    {jobProgress}%
                                </div>
                            </div>
                            <p style={{ marginTop: "10px", textAlign: "center" }}>
                                Processing... This may take a few minutes for larger files.
                            </p>
                        </>
                    )}

                    {jobStatus === 'COMPLETED' && (
                        <div style={{ marginTop: "15px", color: "#4CAF50" }}>
                            <h4>✅ Complete!</h4>
                            <p>Your QR code ZIP has been downloaded automatically.</p>
                            <button onClick={() => handleJobDownload(jobId, zipName)}>
                                Download Again
                            </button>
                        </div>
                    )}

                    {jobStatus === 'FAILED' && (
                        <div style={{ marginTop: "15px", color: "#f44336" }}>
                            <h4>❌ Failed</h4>
                            <p>QR code generation failed. Please try again.</p>
                        </div>
                    )}
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