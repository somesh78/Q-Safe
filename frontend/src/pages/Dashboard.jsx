import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function Dashboard() {
    const [files, setFiles] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        API.get('/dashboard/').then(res => {
            setFiles(res.data);
        }).catch(err => {
            console.error("Failed to fetch user files:", err);
        });
    }, []);

     return (
    <div style={{ padding: 30 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2>Your Files</h2>
        <button onClick={() => navigate("/")}>← Back to Home</button>
      </div>

      {files.map(f => (
        <div key={f.session_id} style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10 }}>
          <b>{f.filename || "OFFLINE Session"}</b>
          <p>Downloads: {f.downloads !== null ? f.downloads : "N/A"}</p>
          <p>Expires: {f.expires_at ? new Date(f.expires_at).toLocaleString() : "N/A"}</p>
          <p>IP Lock: {f.ip_lock ? "Enabled" : "No"}</p>
        </div>
      ))}
    </div>
  );
}