
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Landing() {
    const navigate = useNavigate();
    const isLoggedIn = !!localStorage.getItem('access');

    return (
        <div className="app-container">
            <Header showLogout={false} />

            <main className="main-content" style={{ justifyContent: 'center' }}>
                {/* Hero Section */}
                <section className="hero-section">
                    <h1 className="hero-title">
                        Transfer files with
                        <br />
                        <span className="text-gradient">military-grade security</span>
                    </h1>
                    <p className="hero-subtitle">
                        Q-Safe combines end-to-end encryption with self-destructing links to give you
                        complete control over your sensitive data. Share confidently, knowing your files
                        are protected every step of the way.
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2.5rem', flexWrap: 'wrap' }}>
                        <button
                            className="btn-primary"
                            style={{ padding: '1.125rem 2.25rem', fontSize: '1.0625rem' }}
                            onClick={() => navigate(isLoggedIn ? "/app" : "/signup")}
                        >
                            {isLoggedIn ? 'Go to Dashboard →' : 'Create free account →'}
                        </button>
                        <button
                            className="btn-secondary"
                            style={{ padding: '1.125rem 2.25rem', fontSize: '1.0625rem' }}
                            onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                        >
                            See how it works
                        </button>
                    </div>

                    {/* Trust Indicators */}
                    <div style={{
                        marginTop: '3.5rem',
                        display: 'flex',
                        gap: '3rem',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                        color: 'var(--text-secondary)',
                        fontSize: '0.9375rem',
                        fontWeight: '500'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.25rem' }}>🔒</span>
                            <span>AES-256 Encryption</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.25rem' }}>⚡</span>
                            <span>Zero-knowledge Architecture</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.25rem' }}>🛡️</span>
                            <span>GDPR Compliant</span>
                        </div>
                    </div>
                </section>

                {/* Main Features Section */}
                <section id="features" style={{
                    marginTop: '8rem',
                    width: '100%',
                    maxWidth: '1200px',
                    marginBottom: '6rem'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                        <h2 style={{
                            fontSize: 'clamp(2rem, 4vw, 3rem)',
                            fontWeight: '800',
                            fontFamily: 'var(--font-display)',
                            marginBottom: '1rem',
                            letterSpacing: '-0.03em',
                            lineHeight: '1.2'
                        }}>
                            Complete control over<br />your sensitive data
                        </h2>
                        <p style={{
                            fontSize: '1.125rem',
                            color: 'var(--text-secondary)',
                            maxWidth: '600px',
                            margin: '0 auto',
                            lineHeight: '1.7'
                        }}>
                            Two powerful transfer modes designed for different security requirements.
                            Choose the method that fits your workflow.
                        </p>
                    </div>

                    <div className="mode-grid">
                        <div className="mode-card animate-fade-in stagger-1" style={{ cursor: 'default' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🌐</div>
                            <h3 style={{
                                fontSize: '1.75rem',
                                fontWeight: '700',
                                marginBottom: '1rem',
                                fontFamily: 'var(--font-display)'
                            }}>
                                Online Sharing
                            </h3>
                            <p style={{ fontSize: '1.0625rem', lineHeight: '1.7', marginBottom: '1.5rem' }}>
                                Upload files up to 50MB and generate secure, one-time links. Set custom expiration times,
                                download limits, and optional IP locking for maximum security.
                            </p>
                            <ul style={{
                                listStyle: 'none',
                                padding: 0,
                                margin: 0,
                                fontSize: '0.9375rem',
                                color: 'var(--text-secondary)'
                            }}>
                                <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ color: 'var(--accent-primary)' }}>✓</span>
                                    <span>Self-destructing links</span>
                                </li>
                                <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ color: 'var(--accent-primary)' }}>✓</span>
                                    <span>Custom expiration times</span>
                                </li>
                                <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ color: 'var(--accent-primary)' }}>✓</span>
                                    <span>Download limits & IP locking</span>
                                </li>
                                <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ color: 'var(--accent-primary)' }}>✓</span>
                                    <span>Real-time access auditing</span>
                                </li>
                            </ul>
                        </div>

                        <div className="mode-card animate-fade-in stagger-2" style={{ cursor: 'default' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>📴</div>
                            <h3 style={{
                                fontSize: '1.75rem',
                                fontWeight: '700',
                                marginBottom: '1rem',
                                fontFamily: 'var(--font-display)'
                            }}>
                                Offline Air-Gap
                            </h3>
                            <p style={{ fontSize: '1.0625rem', lineHeight: '1.7', marginBottom: '1.5rem' }}>
                                Transfer files between devices that never connect to the internet. Your file is converted
                                into scannable QR codes for truly air-gapped security.
                            </p>
                            <ul style={{
                                listStyle: 'none',
                                padding: 0,
                                margin: 0,
                                fontSize: '0.9375rem',
                                color: 'var(--text-secondary)'
                            }}>
                                <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ color: 'var(--accent-primary)' }}>✓</span>
                                    <span>QR code generation</span>
                                </li>
                                <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ color: 'var(--accent-primary)' }}>✓</span>
                                    <span>No internet required</span>
                                </li>
                                <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ color: 'var(--accent-primary)' }}>✓</span>
                                    <span>Perfect for high-security environments</span>
                                </li>
                                <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ color: 'var(--accent-primary)' }}>✓</span>
                                    <span>Client-side processing only</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Security Features */}
                <section style={{
                    marginTop: '6rem',
                    marginBottom: '6rem',
                    width: '100%',
                    maxWidth: '1200px'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 style={{
                            fontSize: 'clamp(2rem, 4vw, 3rem)',
                            fontWeight: '800',
                            fontFamily: 'var(--font-display)',
                            marginBottom: '1rem',
                            letterSpacing: '-0.03em'
                        }}>
                            Enterprise-grade security<br />for everyone
                        </h2>
                        <p style={{
                            fontSize: '1.125rem',
                            color: 'var(--text-secondary)',
                            maxWidth: '650px',
                            margin: '0 auto',
                            lineHeight: '1.7'
                        }}>
                            Your data is protected with the same encryption standards used by governments
                            and financial institutions worldwide.
                        </p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '2rem'
                    }}>
                        {[
                            {
                                icon: '🔐',
                                title: 'Zero-Knowledge Encryption',
                                desc: 'End-to-end AES-256 encryption happens in your browser. We never see your passwords or unencrypted data.'
                            },
                            {
                                icon: '⏱️',
                                title: 'Self-Destructing Links',
                                desc: 'Set expiration times from 1-24 hours and limit downloads. Files automatically delete after conditions are met.'
                            },
                            {
                                icon: '🎯',
                                title: 'IP Address Locking',
                                desc: 'Restrict file access to specific IP addresses. Links become locked after the first successful download.'
                            },
                            {
                                icon: '📊',
                                title: 'Complete Audit Logs',
                                desc: 'Track every access attempt with detailed logs including IP addresses, timestamps, and success status.'
                            },
                            {
                                icon: '🛡️',
                                title: 'No Cloud Storage',
                                desc: 'Files are encrypted before upload and automatically deleted. Your data never sits unencrypted on our servers.'
                            },
                            {
                                icon: '🚀',
                                title: 'Instant Deployment',
                                desc: 'No setup required. Start sharing files securely in seconds without any configuration or installation.'
                            }
                        ].map((feature, idx) => (
                            <div
                                key={idx}
                                className={`animate-fade-in stagger-${idx + 1}`}
                                style={{
                                    padding: '2rem',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-lg)',
                                    transition: 'all 0.3s var(--transition)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.borderColor = 'var(--border-hover)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = 'var(--border-color)';
                                }}
                            >
                                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{feature.icon}</div>
                                <h4 style={{
                                    fontSize: '1.25rem',
                                    fontWeight: '600',
                                    marginBottom: '0.75rem',
                                    fontFamily: 'var(--font-display)'
                                }}>
                                    {feature.title}
                                </h4>
                                <p style={{ fontSize: '1rem', lineHeight: '1.7', color: 'var(--text-secondary)' }}>
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Use Cases */}
                <section style={{
                    marginTop: '6rem',
                    marginBottom: '6rem',
                    width: '100%',
                    maxWidth: '1200px'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 style={{
                            fontSize: 'clamp(2rem, 4vw, 3rem)',
                            fontWeight: '800',
                            fontFamily: 'var(--font-display)',
                            marginBottom: '1rem',
                            letterSpacing: '-0.03em'
                        }}>
                            Built for professionals who<br />take security seriously
                        </h2>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '2rem'
                    }}>
                        {[
                            { icon: '👔', title: 'Legal Professionals', desc: 'Share case files and sensitive documents with clients while maintaining attorney-client privilege.' },
                            { icon: '💼', title: 'Financial Advisors', desc: 'Transfer financial statements and tax documents with complete confidentiality and audit trails.' },
                            { icon: '🏥', title: 'Healthcare Providers', desc: 'HIPAA-compliant file sharing for medical records and patient information between facilities.' },
                            { icon: '🏢', title: 'Corporate Teams', desc: 'Secure internal document sharing with IP locking and access controls for compliance.' },
                            { icon: '🔬', title: 'Research Institutions', desc: 'Air-gapped transfer for sensitive research data in high-security laboratory environments.' },
                            { icon: '🛡️', title: 'Security Consultants', desc: 'Deliver security audits and penetration test results without exposing client data.' }
                        ].map((useCase, idx) => (
                            <div
                                key={idx}
                                className={`animate-fade-in stagger-${idx + 1}`}
                                style={{
                                    padding: '2rem',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-lg)',
                                    textAlign: 'center',
                                    transition: 'all 0.3s var(--transition)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.borderColor = 'var(--border-hover)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = 'var(--border-color)';
                                }}
                            >
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{useCase.icon}</div>
                                <h4 style={{
                                    fontSize: '1.25rem',
                                    fontWeight: '600',
                                    marginBottom: '0.75rem',
                                    fontFamily: 'var(--font-display)'
                                }}>
                                    {useCase.title}
                                </h4>
                                <p style={{ fontSize: '1rem', lineHeight: '1.7', color: 'var(--text-secondary)' }}>
                                    {useCase.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA Section */}
                <section style={{
                    marginTop: '6rem',
                    marginBottom: '4rem',
                    textAlign: 'center',
                    padding: '4rem 2rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-xl)',
                    maxWidth: '900px',
                    width: '100%'
                }}>
                    <h2 style={{
                        fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                        fontWeight: '800',
                        fontFamily: 'var(--font-display)',
                        marginBottom: '1.5rem',
                        letterSpacing: '-0.03em'
                    }}>
                        Start sharing files securely<br />in less than 30 seconds
                    </h2>
                    <p style={{
                        fontSize: '1.125rem',
                        color: 'var(--text-secondary)',
                        maxWidth: '600px',
                        margin: '0 auto 2.5rem',
                        lineHeight: '1.7'
                    }}>
                        Start sharing files with military-grade encryption today.
                        No credit card required.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                            className="btn-primary"
                            style={{ padding: '1.125rem 2.5rem', fontSize: '1.0625rem' }}
                            onClick={() => navigate(isLoggedIn ? "/app" : "/signup")}
                        >
                            {isLoggedIn ? 'Go to Dashboard →' : 'Create free account →'}
                        </button>
                    </div>
                    <p style={{
                        marginTop: '1.5rem',
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)'
                    }}>
                        Free forever • No credit card • 50MB file limit
                    </p>
                </section>
            </main>

            <Footer />
        </div>
    );
}
