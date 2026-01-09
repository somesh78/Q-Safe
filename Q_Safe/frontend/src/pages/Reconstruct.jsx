import { useState } from "react";
import { reconstructFromZip } from "../services/api";

export default function Reconstruct() {
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState("");
    const [fileBlob, setFileBlob] = useState(null);
    const [fileName, setFileName] = useState("");

    const handleZipUpload = async (file) => {
        if (!password){
            alert("Please enter a password before uploading the file.");
            return;
        }

        setLoading(true);
        try{
            const response = await reconstructFromZip(file, password);

            let filename = file.name || "downloaded_file";
            let headers = response.headers || {};
            const disposition = headers['content-disposition'];
            
            if (typeof disposition === 'string' && disposition.includes('filename=')) {
                filename = disposition.split('filename=')[1].replace(/"/g, '').trim();
            }

            const blob = new Blob([response.data], { type: response.headers['content-type'] || "application/octet-stream" });

            setFileBlob(blob);
            setFileName(filename);
        }
        catch (error) {
            console.error("Reconstruction failed:", error);
            alert("Reconstruction failed. Please try again.");
        }
        setLoading(false);
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
        <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
            <h2>Reconstruct from QR ZIP</h2>

            <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ display: "block", marginBottom: "10px" }}
            />

            <input
                type="file"
                accept=".zip"
                onChange={(e) => handleZipUpload(e.target.files[0])}
            />

            {loading && <p>Decrypting & reconstructing…</p>}

            {fileBlob && (
                <div style={{ marginTop: "20px" }}>
                    <p>File ready:</p>
                    <button onClick={handleDownload}>
                        Download File
                    </button>
                </div>
            )}
        </div>
    );
}