
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import LogoutButton from "../components/LogoutButton";
import Header from "../components/Header";
import '../App.css';

export default function Dashboard() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/dashboard/').then(res => {
      setFiles(res.data);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to fetch user files:", err);
      setLoading(false);
    });
  }, []);

  return (
    <div className="app-container">
      <Header showHomeBtn={true} showLogout={true} />

      <main className="main-content">
        <div style={{ width: '100%', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="page-title" style={{ marginBottom: 0 }}>Your Files</h2>
        </div>

        {loading ? (
          <p>Loading files...</p>
        ) : files.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '3rem' }}>
            <p>No active file transfers found.</p>
            <button className="btn-primary" onClick={() => navigate("/app")}>Create Transfer</button>
          </div>
        ) : (
          <div className="file-grid animate-fade-in">
            {files.map(f => (
              <div key={f.session_id} className="file-card">
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>
                    {f.filename || "Unknown File"}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Uploaded: {new Date(f.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Downloads:</span>
                    <span style={{ fontWeight: 'bold' }}>{f.downloads !== null ? f.downloads : "N/A"}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                    <span>
                      {f.downloads >= 3 ? (
                        <span className="badge badge-error">Expired</span>
                      ) : (
                        <span className="badge badge-success">Active</span>
                      )}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>IP Lock:</span>
                    <span>{f.ip_lock ? "🔒 On" : "Off"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
