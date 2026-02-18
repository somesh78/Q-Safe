import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Compliance() {
    const practices = [
        {
            icon: '🔐',
            title: 'End-to-End Encryption',
            subtitle: 'AES-256 File Protection',
            description: 'All files are encrypted with AES-256 before leaving your device. We use strong key derivation (PBKDF2+HMAC) to protect user-supplied passwords.',
            features: ['AES-256 encryption', 'Client-side key derivation', 'SHA-256 file checksums', 'Secure random IV generation', 'Zero plaintext storage']
        },
        {
            icon: '🗑️',
            title: 'Automatic Data Deletion',
            subtitle: 'Minimal Data Retention',
            description: 'Files are automatically deleted after expiration or when download limits are reached. Maximum retention is 24 hours, configurable down to 1 hour.',
            features: ['Configurable expiry (1-24h)', 'Download-count limits', 'Auto-deletion on limit', 'No permanent file storage', 'Storage cleanup']
        },
        {
            icon: '🛡️',
            title: 'Access Controls',
            subtitle: 'Multi-Layer File Protection',
            description: 'Each file transfer is protected by password, optional IP locking, download limits, and time-based expiration. Failed attempts trigger lockouts.',
            features: ['Password-protected files', 'IP address locking', 'Brute-force lockout', 'Rate-limited endpoints', 'JWT authentication']
        },
        {
            icon: '📋',
            title: 'Audit Logging',
            subtitle: 'Full Download Traceability',
            description: 'Every file access attempt is logged with IP address, timestamp, and outcome. Users can review audit trails for their files in the dashboard.',
            features: ['Per-file access logs', 'IP address tracking', 'Success/failure recording', 'User-accessible audit view', 'Tamper-evident records']
        }
    ];

    const categories = [
        {
            category: 'Data Protection',
            items: [
                'AES-256 file encryption',
                'Zero-knowledge architecture',
                'Automatic data deletion',
                'SHA-256 integrity checksums',
                'Secure key derivation'
            ]
        },
        {
            category: 'Access Control',
            items: [
                'JWT token authentication',
                'Per-file password protection',
                'IP address whitelisting',
                'Session-based uploads',
                'Signup rate limiting'
            ]
        },
        {
            category: 'Monitoring & Auditing',
            items: [
                'Per-file download audit logs',
                'Failed access tracking',
                'IP-based rate limiting',
                'Brute-force lockout (5 attempts)',
                'User-accessible audit dashboard'
            ]
        },
        {
            category: 'Infrastructure',
            items: [
                'Docker-based deployment',
                'HTTPS via load balancer',
                'PostgreSQL database',
                'Encrypted cloud storage',
                'CORS origin restrictions'
            ]
        }
    ];

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #060606, #0a0a0a)' }}>
            <Header />

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 20px' }}>
                {/* Hero Section */}
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <h1 style={{
                        fontSize: '3rem',
                        fontWeight: '700',
                        color: '#fff',
                        marginBottom: '20px',
                        fontFamily: "'Plus Jakarta Sans', sans-serif"
                    }}>
                        Security & Data Practices
                    </h1>
                    <p style={{
                        fontSize: '1.25rem',
                        color: '#888',
                        maxWidth: '800px',
                        margin: '0 auto',
                        lineHeight: '1.6'
                    }}>
                        Q-Safe is built with security at every layer. Here's exactly how we protect your data — no vague claims, just real implementation details.
                    </p>
                </div>

                {/* Trust Badge */}
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    background: 'linear-gradient(135deg, #00d4ff, #0099cc)',
                    borderRadius: '16px',
                    marginBottom: '80px'
                }}>
                    <h2 style={{
                        fontSize: '2rem',
                        fontWeight: '700',
                        color: '#fff',
                        marginBottom: '15px'
                    }}>
                        🛡️ Built for Security & Privacy
                    </h2>
                    <p style={{
                        fontSize: '1.1rem',
                        color: '#f0f0f0',
                        maxWidth: '700px',
                        margin: '0 auto'
                    }}>
                        Q-Safe is designed from the ground up to protect your files with encryption,
                        access controls, and automatic data deletion.
                    </p>
                </div>

                {/* Practices Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '30px',
                    marginBottom: '80px'
                }}>
                    {practices.map((item, index) => (
                        <div key={index} style={{
                            background: 'linear-gradient(135deg, #0a0a0a, #111)',
                            border: '1px solid #222',
                            borderRadius: '12px',
                            padding: '35px',
                            transition: 'all 0.3s ease'
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#00d4ff';
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 212, 255, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#222';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}>
                            <div style={{ fontSize: '3rem', marginBottom: '20px', textAlign: 'center' }}>
                                {item.icon}
                            </div>
                            <h3 style={{
                                fontSize: '1.4rem',
                                fontWeight: '700',
                                color: '#00d4ff',
                                marginBottom: '5px',
                                textAlign: 'center'
                            }}>
                                {item.title}
                            </h3>
                            <p style={{
                                fontSize: '0.85rem',
                                color: '#888',
                                marginBottom: '15px',
                                textAlign: 'center'
                            }}>
                                {item.subtitle}
                            </p>
                            <p style={{
                                fontSize: '0.95rem',
                                color: '#ccc',
                                lineHeight: '1.6',
                                marginBottom: '20px'
                            }}>
                                {item.description}
                            </p>
                            <div style={{
                                borderTop: '1px solid #222',
                                paddingTop: '20px'
                            }}>
                                <h4 style={{
                                    fontSize: '0.9rem',
                                    color: '#888',
                                    fontWeight: '600',
                                    marginBottom: '12px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    Implementation Details
                                </h4>
                                <ul style={{
                                    listStyle: 'none',
                                    padding: 0,
                                    margin: 0
                                }}>
                                    {item.features.map((feature, idx) => (
                                        <li key={idx} style={{
                                            padding: '8px 0',
                                            color: '#aaa',
                                            fontSize: '0.9rem',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}>
                                            <span style={{ color: '#00d4ff', marginRight: '8px', fontSize: '0.7rem' }}>●</span>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Categories */}
                <div style={{ marginBottom: '80px' }}>
                    <h2 style={{
                        fontSize: '2.5rem',
                        fontWeight: '700',
                        color: '#fff',
                        textAlign: 'center',
                        marginBottom: '50px'
                    }}>
                        Security Controls in Detail
                    </h2>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                        gap: '25px'
                    }}>
                        {categories.map((cat, index) => (
                            <div key={index} style={{
                                background: '#0a0a0a',
                                border: '1px solid #222',
                                borderRadius: '12px',
                                padding: '30px',
                                borderTop: '3px solid #00d4ff'
                            }}>
                                <h3 style={{
                                    fontSize: '1.3rem',
                                    fontWeight: '600',
                                    color: '#00d4ff',
                                    marginBottom: '20px'
                                }}>
                                    {cat.category}
                                </h3>
                                <ul style={{
                                    listStyle: 'none',
                                    padding: 0,
                                    margin: 0
                                }}>
                                    {cat.items.map((item, idx) => (
                                        <li key={idx} style={{
                                            padding: '10px 0',
                                            color: '#ccc',
                                            fontSize: '0.95rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            borderBottom: idx < cat.items.length - 1 ? '1px solid #1a1a1a' : 'none'
                                        }}>
                                            <span style={{ color: '#00d4ff', marginRight: '10px' }}>✓</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* How We Protect Your Data */}
                <div style={{
                    background: '#0a0a0a',
                    border: '1px solid #222',
                    borderRadius: '16px',
                    padding: '50px',
                    marginBottom: '60px'
                }}>
                    <h2 style={{
                        fontSize: '2rem',
                        fontWeight: '700',
                        color: '#fff',
                        marginBottom: '30px',
                        textAlign: 'center'
                    }}>
                        How We Protect Your Data
                    </h2>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '30px',
                        marginBottom: '30px'
                    }}>
                        {[
                            { title: 'Encrypted in Transit', desc: 'All API communication is encrypted via HTTPS / TLS' },
                            { title: 'Encrypted at Rest', desc: 'Files stored AES-256 encrypted in cloud storage' },
                            { title: 'Short-Lived Links', desc: 'Download links expire after configurable time (1-24h)' },
                            { title: 'Privacy Policy', desc: 'Clear documentation of what data we collect and why' }
                        ].map((doc, index) => (
                            <div key={index} style={{
                                padding: '25px',
                                background: 'linear-gradient(135deg, #0a0a0a, #111)',
                                border: '1px solid #333',
                                borderRadius: '8px',
                                textAlign: 'center'
                            }}>
                                <h4 style={{
                                    fontSize: '1.1rem',
                                    fontWeight: '600',
                                    color: '#00d4ff',
                                    marginBottom: '10px'
                                }}>
                                    {doc.title}
                                </h4>
                                <p style={{
                                    fontSize: '0.9rem',
                                    color: '#aaa',
                                    margin: 0
                                }}>
                                    {doc.desc}
                                </p>
                            </div>
                        ))}
                    </div>

                    <p style={{
                        textAlign: 'center',
                        color: '#888',
                        fontSize: '0.95rem',
                        margin: 0
                    }}>
                        📧 Security questions? Email us at <strong style={{ color: '#00d4ff' }}>security@q-safe.live</strong>
                    </p>
                </div>

                {/* Transparency */}
                <div style={{
                    background: 'linear-gradient(135deg, #0a0a0a, #111)',
                    border: '1px solid #222',
                    borderRadius: '16px',
                    padding: '50px',
                    marginBottom: '60px',
                    textAlign: 'center'
                }}>
                    <h2 style={{
                        fontSize: '2rem',
                        fontWeight: '700',
                        color: '#fff',
                        marginBottom: '25px'
                    }}>
                        🔍 Transparency
                    </h2>
                    <p style={{
                        fontSize: '1.05rem',
                        color: '#ccc',
                        lineHeight: '1.7',
                        maxWidth: '700px',
                        margin: '0 auto'
                    }}>
                        We believe security should be verifiable, not just promised. Q-Safe's encryption runs client-side
                        so you can inspect exactly what happens to your data before it ever leaves your device.
                    </p>
                </div>

                {/* CTA */}
                <div style={{
                    textAlign: 'center',
                    padding: '60px 40px',
                    background: 'linear-gradient(135deg, #00d4ff, #0099cc)',
                    borderRadius: '16px'
                }}>
                    <h2 style={{
                        fontSize: '2rem',
                        fontWeight: '700',
                        color: '#fff',
                        marginBottom: '20px'
                    }}>
                        Have Security Questions?
                    </h2>
                    <p style={{
                        fontSize: '1.1rem',
                        color: '#f0f0f0',
                        marginBottom: '30px',
                        maxWidth: '600px',
                        margin: '0 auto 30px'
                    }}>
                        We're happy to answer questions about how Q-Safe protects your data.
                    </p>
                    <Link to="/contact" style={{
                        display: 'inline-block',
                        padding: '15px 40px',
                        background: '#060606',
                        color: '#00d4ff',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '1.1rem',
                        transition: 'all 0.3s ease',
                        border: '2px solid #060606'
                    }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#fff';
                            e.currentTarget.style.color = '#060606';
                            e.currentTarget.style.transform = 'translateY(-3px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#060606';
                            e.currentTarget.style.color = '#00d4ff';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}>
                        Contact Us
                    </Link>
                </div>
            </div>
            <Footer />
        </div>
    );
}
