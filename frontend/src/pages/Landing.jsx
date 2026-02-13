
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
                    <div className="mode-grid">
                        <div className="mode-card" style={{ cursor: 'default' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🌐</div>
                            <h3>Online Sharing</h3>
                            <p>Upload files securely. We generate a one-time link with optional IP locking and self-destruction timers.</p>
                        </div>
                        <div className="mode-card" style={{ cursor: 'default' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📴</div>
                            <h3>Offline Air-Gap</h3>
                            <p>Transfer files between devices that are never connected. We convert your file into a sequence of QR codes.</p>
                        </div>
                        <div className="mode-card" style={{ cursor: 'default' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔒</div>
                            <h3>Zero Knowledge</h3>
                            <p>Your password encrypts the file on your device. We never see your data, only the encrypted blobs.</p>
                        </div>
                    </div>
                </section>
            </main>

            <footer style={{
                padding: '2rem',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                borderTop: '1px solid var(--border-color)',
                width: '100%',
                background: 'rgba(15, 23, 42, 0.5)'
            }}>
                <p>&copy; {new Date().getFullYear()} Q-Safe. Secure. Private. Encrypted.</p>
            </footer>
        </div>
    );
}
