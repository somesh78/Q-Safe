
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import LogoutButton from "../components/LogoutButton";
import '../App.css';

export default function Audit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const res = await API.get('/audit/');
      setLogs(res.data);
    }
    catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="brand" onClick={() => navigate("/")}>Q-Safe</div>
        <div className="nav-actions">
          <button className="btn-secondary" onClick={() => navigate("/")}>
            ← Back Home
          </button>
          <LogoutButton />
        </div>
      </header>

      <main className="main-content">
        <div style={{ width: '100%', marginBottom: '2rem' }}>
          <h2 className="page-title">Access Logs</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Track who accessed your secure files.</p>
        </div>

        {loading ? (
          <p>Loading audit logs...</p>
        ) : logs.length === 0 ? (
          <p>No audit logs found.</p>
        ) : (
          <div className="table-container animate-fade-in">
            <table className="styled-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>User</th>
                  <th>IP Address</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: '600' }}>{log.file_name}</td>
                    <td>{log.user || 'Anonymous'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{log.ip_address}</td>
                    <td>
                      <span className={`badge ${log.status === 'SUCCESS' ? 'badge-success' : 'badge-error'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td>{log.reason || '-'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
