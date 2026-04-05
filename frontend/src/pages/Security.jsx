import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Security() {
  const securityFeatures = [
    {
      icon: '🔐',
      title: 'AES-256 Encryption',
      description: 'All files are encrypted using AES-256, the same encryption standard used by governments and military organizations. Your data is mathematically impossible to crack with current technology.'
    },
    {
      icon: '🔑',
      title: 'End-to-End Encryption',
      description: 'Files are encrypted on your device before upload and remain encrypted during storage. Only recipients with the correct key can decrypt the data.'
    },
    {
      icon: '🛡️',
      title: 'Zero-Knowledge Architecture',
      description: 'We never have access to your unencrypted data or encryption keys. Even if our servers were compromised, your files remain secure.'
    },
    {
      icon: '🚫',
      title: 'No Permanent Storage',
      description: 'Files are automatically deleted after expiration or download limits are reached. Your data doesn\'t sit on our servers indefinitely.'
    },
    {
      icon: '🔒',
      title: 'Secure Authentication',
      description: 'JWT-based authentication with token rotation and blacklisting. All passwords are hashed using industry-standard bcrypt with salting.'
    },
    {
      icon: '🌐',
      title: 'HTTPS Everywhere',
      description: 'All data transmission uses TLS 1.3 encryption. Man-in-the-middle attacks are prevented through strict certificate validation.'
    }
  ];

  const protectionLayers = [
    {
      layer: 'Transport Security',
      items: ['TLS encryption in transit', 'HTTPS enforced via load balancer', 'Secure API endpoints', 'CORS origin restrictions']
    },
    {
      layer: 'Application Security',
      items: ['Rate limiting', 'CSRF protection', 'SQL injection prevention', 'XSS protection', 'Input validation']
    },
    {
      layer: 'Data Security',
      items: ['AES-256 encryption', 'SHA-256 checksums', 'Encrypted storage', 'Secure key generation', 'Memory-safe operations']
    },
    {
      layer: 'Access Control',
      items: ['JWT authentication', 'IP whitelisting', 'Password protection', 'Download limits', 'Time-based expiration']
    }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary, #060606)' }}>
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
            Security First, Always
          </h1>
          <p style={{
            fontSize: '1.25rem',
            color: '#888',
            maxWidth: '800px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Q-Safe is built from the ground up with security as the foundation. We use military-grade encryption and industry best practices to protect your data.
          </p>
        </div>

        {/* Main Security Features */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '30px',
          marginBottom: '80px'
        }}>
          {securityFeatures.map((feature, index) => (
            <div key={index} style={{
              background: 'linear-gradient(135deg, #0a0a0a, #111)',
              border: '1px solid var(--border-color, #222)',
              borderRadius: '12px',
              padding: '30px',
              transition: 'all 0.3s ease'
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00d4ff';
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 212, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color, #222)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>{feature.icon}</div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#00d4ff',
                marginBottom: '10px'
              }}>
                {feature.title}
              </h3>
              <p style={{
                fontSize: '0.95rem',
                color: '#aaa',
                lineHeight: '1.6',
                margin: 0
              }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Multi-Layer Protection */}
        <div style={{ marginBottom: '80px' }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: '#fff',
            textAlign: 'center',
            marginBottom: '50px'
          }}>
            Multi-Layer Protection
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '25px'
          }}>
            {protectionLayers.map((layer, index) => (
              <div key={index} style={{
                background: 'var(--bg-card, #0a0a0a)',
                border: '1px solid var(--border-color, #222)',
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
                  {layer.layer}
                </h3>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0
                }}>
                  {layer.items.map((item, idx) => (
                    <li key={idx} style={{
                      padding: '10px 0',
                      color: '#ccc',
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      borderBottom: idx < layer.items.length - 1 ? '1px solid #1a1a1a' : 'none'
                    }}>
                      <span style={{ color: '#00d4ff', marginRight: '10px', fontSize: '0.8rem' }}>●</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance Section */}
        <div style={{
          background: 'linear-gradient(135deg, #0a0a0a, #111)',
          border: '1px solid var(--border-color, #222)',
          borderRadius: '16px',
          padding: '50px',
          marginBottom: '60px'
        }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#fff',
            textAlign: 'center',
            marginBottom: '30px'
          }}>
            Compliance & Standards
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '30px',
            textAlign: 'center'
          }}>
            {['GDPR Aligned', 'E2E Encrypted', 'Zero Knowledge', 'Auto-Expiring Files'].map((standard, index) => (
              <div key={index}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  background: 'linear-gradient(135deg, #00d4ff, #0099cc)',
                  borderRadius: '50%',
                  margin: '0 auto 15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem'
                }}>
                  ✓
                </div>
                <h4 style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#00d4ff',
                  margin: 0
                }}>
                  {standard}
                </h4>
              </div>
            ))}
          </div>
        </div>

        {/* Security Practices */}
        <div style={{
          background: 'var(--bg-card, #0a0a0a)',
          border: '1px solid var(--border-color, #222)',
          borderRadius: '16px',
          padding: '50px',
          marginBottom: '60px'
        }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '30px'
          }}>
            Our Security Practices
          </h2>

          <div style={{
            display: 'grid',
            gap: '20px',
            fontSize: '1rem',
            color: '#ccc',
            lineHeight: '1.8'
          }}>
            <p style={{ margin: 0 }}>
              <strong style={{ color: '#00d4ff' }}>Security-First Design:</strong> Our architecture follows OWASP best practices with rate limiting, input validation, and least-privilege access controls.
            </p>
            <p style={{ margin: 0 }}>
              <strong style={{ color: '#00d4ff' }}>Audit Logging:</strong> All file access attempts, including failed downloads and IP mismatches, are recorded in tamper-evident audit logs.
            </p>
            <p style={{ margin: 0 }}>
              <strong style={{ color: '#00d4ff' }}>Automatic Expiry:</strong> Files are automatically deleted after configurable time windows or download limits are reached, minimizing data exposure.
            </p>
            <p style={{ margin: 0 }}>
              <strong style={{ color: '#00d4ff' }}>Zero-Knowledge Storage:</strong> Files are encrypted client-side before upload. We never see your plaintext data or encryption passwords.
            </p>
            <p style={{ margin: 0 }}>
              <strong style={{ color: '#00d4ff' }}>Brute-Force Protection:</strong> Failed password attempts are tracked per file. After 5 failures, the download link is temporarily locked for 10 minutes.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div style={{
          textAlign: 'center',
          padding: '60px 30px',
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
            Our security team is here to answer your questions and provide detailed information about our security architecture.
          </p>
          <Link to="/contact" style={{
            display: 'inline-block',
            padding: '15px 40px',
            background: 'var(--bg-primary, #060606)',
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
            Contact Security Team
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
