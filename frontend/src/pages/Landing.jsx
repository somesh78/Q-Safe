
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

export default function Landing() {
    const navigate = useNavigate();
    const isLoggedIn = !!localStorage.getItem('access');

    return (
        <div className="app-container">
            {/* Header */}
            <Header showLogout={false} />

            <main className="main-content" style={{ justifyContent: 'center' }}>
                {/* Hero Section */}
                <section className="hero-section animate-fade-in">
                    <h1 className="hero-title">
                        Secure File Transfer <br />
                        <span className="text-gradient">For the Modern Web</span>
                    </h1>
                    <p className="hero-subtitle">
                        Share sensitive data with military-grade encryption.
                        Choose between <b>Online</b> secure links or <b>Offline</b> air-gapped QR transfer.
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
                        <button
                            className="btn-primary"
                            style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}
                            onClick={() => navigate(isLoggedIn ? "/app" : "/signup")}
                        >
                            {isLoggedIn ? 'Launch Dashboard' : 'Start Transferring Now'}
                        </button>
                        <button
                            className="btn-secondary"
                            style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}
                            onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                        >
                            Learn More
                        </button>
                    </div>
                </section>

                {/* Features Grid */}
                <section id="features" style={{ marginTop: '5rem', width: '100%', maxWidth: '1000px' }}>
                    <h2 style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: '800', marginBottom: '3rem', color: 'var(--text-primary)' }}>
                        Why Choose Q-Safe?
                    </h2>
                    <div className="mode-grid">
                        <div className="mode-card" style={{ cursor: 'default' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🌐</div>
                            <h3>Online Sharing</h3>
                            <p>Upload files securely up to 50MB. Generate one-time links with optional IP locking, download limits, and automatic expiration. Perfect for sharing confidential documents with clients or colleagues.</p>
                        </div>
                        <div className="mode-card" style={{ cursor: 'default' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📴</div>
                            <h3>Offline Air-Gap</h3>
                            <p>Transfer files between devices that never connect to the internet. Your file is converted into QR codes that can be scanned on air-gapped systems. Ideal for high-security environments.</p>
                        </div>
                        <div className="mode-card" style={{ cursor: 'default' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔒</div>
                            <h3>Zero Knowledge</h3>
                            <p>End-to-end encryption using AES-256. Your password encrypts files client-side before upload. We never have access to your encryption keys or unencrypted data.</p>
                        </div>
                        <div className="mode-card" style={{ cursor: 'default' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⏱️</div>
                            <h3>Self-Destructing Links</h3>
                            <p>Set custom expiration times from 1 to 24 hours. Control maximum download attempts. Links automatically expire after conditions are met, leaving no trace.</p>
                        </div>
                        <div className="mode-card" style={{ cursor: 'default' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📊</div>
                            <h3>Access Audit Logs</h3>
                            <p>Track every download attempt with detailed logs including IP addresses, timestamps, and success/failure reasons. Stay informed about who accesses your files.</p>
                        </div>
                        <div className="mode-card" style={{ cursor: 'default' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎯</div>
                            <h3>IP Locking</h3>
                            <p>Restrict file downloads to a specific IP address. Once the first download occurs, the link becomes locked to that IP, preventing unauthorized access.</p>
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section style={{ marginTop: '5rem', width: '100%', maxWidth: '900px' }}>
                    <h2 style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: '800', marginBottom: '3rem', color: 'var(--text-primary)' }}>
                        How It Works
                    </h2>
                    <div style={{ display: 'grid', gap: '2rem' }}>
                        <div className="card" style={{ cursor: 'default' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
                                <div style={{ 
                                    fontSize: '2rem', 
                                    fontWeight: '800', 
                                    background: 'var(--accent-gradient)', 
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    minWidth: '40px'
                                }}>1</div>
                                <div>
                                    <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Choose Your Mode</h3>
                                    <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: '1.6' }}>
                                        Select between Online mode for internet-based sharing or Offline mode for air-gapped transfers. Each mode is optimized for different security requirements.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="card" style={{ cursor: 'default' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
                                <div style={{ 
                                    fontSize: '2rem', 
                                    fontWeight: '800', 
                                    background: 'var(--accent-gradient)', 
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    minWidth: '40px'
                                }}>2</div>
                                <div>
                                    <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Encrypt Your File</h3>
                                    <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: '1.6' }}>
                                        Set a strong password. Your file is encrypted on your device using AES-256 before any data leaves your browser. We never see the unencrypted content.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="card" style={{ cursor: 'default' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
                                <div style={{ 
                                    fontSize: '2rem', 
                                    fontWeight: '800', 
                                    background: 'var(--accent-gradient)', 
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    minWidth: '40px'
                                }}>3</div>
                                <div>
                                    <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Share Securely</h3>
                                    <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: '1.6' }}>
                                        Get a QR code or download link. Share the password separately through a different channel for maximum security. Recipients decrypt the file using the password you provide.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Use Cases Section */}
                <section style={{ marginTop: '5rem', width: '100%', maxWidth: '900px', marginBottom: '3rem' }}>
                    <h2 style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: '800', marginBottom: '3rem', color: 'var(--text-primary)' }}>
                        Perfect For
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                        <div style={{ padding: '1.5rem', background: 'rgba(255, 107, 107, 0.05)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>🏢 Business</h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>Share contracts, financial reports, and sensitive documents with clients securely.</p>
                        </div>
                        <div style={{ padding: '1.5rem', background: 'rgba(255, 107, 107, 0.05)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>🏥 Healthcare</h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>Transfer patient records and medical data while maintaining HIPAA compliance.</p>
                        </div>
                        <div style={{ padding: '1.5rem', background: 'rgba(255, 107, 107, 0.05)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>⚖️ Legal</h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>Exchange confidential legal documents with attorney-client privilege protection.</p>
                        </div>
                        <div style={{ padding: '1.5rem', background: 'rgba(255, 107, 107, 0.05)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>🔬 Research</h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>Share sensitive research data between air-gapped laboratory systems.</p>
                        </div>
                        <div style={{ padding: '1.5rem', background: 'rgba(255, 107, 107, 0.05)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>🛡️ Government</h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>Secure file transfers for classified or sensitive government operations.</p>
                        </div>
                        <div style={{ padding: '1.5rem', background: 'rgba(255, 107, 107, 0.05)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>👤 Personal</h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>Keep your private files, tax documents, and personal data secure.</p>
                        </div>
                    </div>
                </section>
            </main>

            <footer style={{
                padding: '3rem 2rem',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                borderTop: '1px solid var(--border-color)',
                width: '100%',
                background: 'rgba(26, 15, 10, 0.7)',
                backdropFilter: 'blur(20px)',
                marginTop: '5rem'
            }}>
                <p style={{ fontSize: '0.95rem', fontWeight: '500', margin: 0 }}>
                    &copy; {new Date().getFullYear()} Q-Safe. Secure. Private. Encrypted.
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', opacity: 0.7 }}>
                    Military-grade encryption • Zero-knowledge architecture • Open source
                </p>
            </footer>
        </div>
    );
}
