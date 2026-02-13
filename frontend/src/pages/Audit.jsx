
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import LogoutButton from "../components/LogoutButton";
import Header from "../components/Header";
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
      <Header showHomeBtn={true} showLogout={true} />

      <main className="main-content">
        <div style={{ width: '100%', marginBottom: '2rem' }}>
          <h2 className="page-title">Access Audit Logs</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '700px' }}>
            Monitor all download attempts for your files. Track successful downloads and failed access attempts with detailed information including IP addresses, timestamps, and failure reasons.
          </p>
        </div>

        {/* Statistics */}
        {!loading && logs.length > 0 && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
            gap: '1rem', 
            marginBottom: '2rem',
            width: '100%'
          }}>
            <div style={{ 
              padding: '1.25rem', 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius-md)',
              backdropFilter: 'blur(20px)'
            }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total Attempts</div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)' }}>{logs.length}</div>
            </div>
            <div style={{ 
              padding: '1.25rem', 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius-md)',
              backdropFilter: 'blur(20px)'
            }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Successful</div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--success)' }}>
                {logs.filter(log => log.status === 'SUCCESS').length}
              </div>
            </div>
            <div style={{ 
              padding: '1.25rem', 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius-md)',
              backdropFilter: 'blur(20px)'
            }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Failed</div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--error)' }}>
                {logs.filter(log => log.status !== 'SUCCESS').length}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
            <p>Loading audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📋</div>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>No Audit Logs</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              No download attempts have been recorded yet. Audit logs will appear here once someone attempts to access your files.
            </p>
          </div>
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
