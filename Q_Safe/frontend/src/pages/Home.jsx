import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ModeSelector from "../components/ModeSelector";
import FileUploader from "../components/FileUploader";
import { createSession, uploadFile } from "../services/api";

export default function Home() {
    const [session, setSession] = useState(null);
    const [uploadResult, setUploadResult] = useState(null);
    const [zipBlob, setZipBlob] = useState(null);
    const [zipName, setZipName] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

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
        }

        setLoading(true);

        try {
            const response = await uploadFile(file, session.session_id, password);

            // 🔵 OFFLINE MODE → ZIP DOWNLOAD
            if (session.mode === "OFFLINE") {
                const blob = new Blob([response.data], {
                    type: "application/zip",
                });
                setZipBlob(blob);
                setZipName(`${file.name}_qr_bundle.zip`);
                setLoading(false);
                return;
            }

            // 🔵 ONLINE MODE → JSON RESPONSE
            const text = await response.data.text();
            const json = JSON.parse(text);
            setUploadResult(json);

        } catch (err) {
            console.error("Upload failed:", err);
            alert("File upload failed. Check console for details.");
        }

        setLoading(false);
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
            <h2>QR Vault – Secure File Transfer</h2>

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
                        style={{ marginBottom: "10px", display: "block" }}
                    />

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