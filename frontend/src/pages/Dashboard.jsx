
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import LogoutButton from "../components/LogoutButton";
import Header from "../components/Header";
import '../App.css';

export default function Dashboard() {
  const [files, setFiles] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/dashboard/').then(res => {
      // Handle both new format {files, user} and legacy flat array
      if (Array.isArray(res.data)) {
        setFiles(res.data);
      } else {
        setFiles(res.data.files || []);
        setUserInfo(res.data.user || null);
      }
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
        <div style={{ width: '100%', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 className="page-title" style={{ marginBottom: '0.5rem' }}>Your Files</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Manage and monitor your active file transfers
              </p>
            </div>
            <button className="btn-primary" onClick={() => navigate("/app")}>
              + New Transfer
            </button>
          </div>
        </div>

        {/* Verification Banner */}
        {userInfo && !userInfo.is_verified && userInfo.email && (
          <div style={{
            width: '100%',
            padding: '1rem 1.25rem',
            background: 'rgba(255, 167, 38, 0.1)',
            border: '1px solid rgba(255, 167, 38, 0.3)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
              ⚠️ Your email <strong>{userInfo.email}</strong> is not verified yet.
            </span>
            <button
              onClick={async () => {
                try {
                  await API.post('/resend-verification/', { email: userInfo.email });
                  alert('Verification email sent! Check your inbox.');
                } catch {
                  alert('Could not send verification email. Try again later.');
                }
              }}
              style={{
                padding: '0.4rem 1rem',
                background: 'rgba(255, 167, 38, 0.2)',
                border: '1px solid rgba(255, 167, 38, 0.4)',
                borderRadius: 'var(--radius-sm)',
                color: '#ffa726',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}
            >
              Resend Email
            </button>
          </div>
        )}

        {userInfo && userInfo.is_verified && (
          <div style={{
            width: '100%',
            padding: '0.5rem 1rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{
              padding: '0.2rem 0.6rem',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '20px',
              color: '#10b981',
              fontSize: '0.8rem',
              fontWeight: '600'
            }}>
              ✓ Verified
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {userInfo.email}
            </span>
          </div>
        )}

        {/* Statistics Cards */}
        {!loading && files.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total Files</div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)' }}>{files.length}</div>
            </div>
            <div style={{
              padding: '1.25rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              backdropFilter: 'blur(20px)'
            }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Active Links</div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--success)' }}>
                {files.filter(f => f.downloads < 3).length}
              </div>
            </div>
            <div style={{
              padding: '1.25rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              backdropFilter: 'blur(20px)'
            }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total Downloads</div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--accent-primary)' }}>
                {files.reduce((sum, f) => sum + (f.downloads || 0), 0)}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <p>Loading files...</p>
        ) : files.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>No Files Yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
              You haven't created any file transfers yet. Start by creating your first secure transfer.
            </p>
            <button className="btn-primary" onClick={() => navigate("/app")}>
              Create First Transfer
            </button>
          </div>
        ) : (
          <div className="file-grid">
            {files.map((f, idx) => (
              <div key={f.id} className={`card animate-fade-in stagger-${(idx % 6) + 1}`} style={{ padding: '1.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>📄</span>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', flex: 1, fontFamily: 'var(--font-display)' }}>
                      {f.filename || "Unknown File"}
                    </h3>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    📅 {new Date(f.created_at).toLocaleString()}
                  </span>
                </div>

                <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>📥 Downloads:</span>
                    <span style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                      {f.downloads !== null ? `${f.downloads}/3` : "N/A"}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                    <span>
                      {f.downloads >= 3 ? (
                        <span className="badge badge-error">❌ Expired</span>
                      ) : (
                        <span className="badge badge-success">✓ Active</span>
                      )}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>IP Lock:</span>
                    <span style={{ fontWeight: '600' }}>
                      {f.ip_lock ? "🔒 Enabled" : "🔓 Disabled"}
                    </span>
                  </div>
                </div>

                {f.downloads < 3 && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)'
                  }}>
                    💡 {3 - f.downloads} download(s) remaining
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
