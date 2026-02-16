import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const footerSections = [
    {
      heading: 'PRODUCT',
      links: [
        { label: 'Features', path: '/features' },
        { label: 'Pricing', path: '/pricing' },
        { label: 'Security', path: '/security' }
      ]
    },
    {
      heading: 'COMPANY',
      links: [
        { label: 'About', path: '/about' },
        { label: 'Blog', path: '/blog' },
        { label: 'Contact', path: '/contact' }
      ]
    },
    {
      heading: 'LEGAL',
      links: [
        { label: 'Privacy', path: '/privacy' },
        { label: 'Terms', path: '/terms' },
        { label: 'Compliance', path: '/compliance' }
      ]
    }
  ];

  return (
    <footer style={{
      background: '#060606',
      borderTop: '1px solid #1a1a1a',
      padding: '60px 20px 30px',
      marginTop: 'auto'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '50px',
          marginBottom: '50px'
        }}>
          {/* Brand Section */}
          <div>
            <Link to="/" style={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              marginBottom: '20px'
            }}>
              <span style={{
                fontSize: '2rem',
                marginRight: '10px'
              }}>
                🔒
              </span>
              <span style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#00d4ff',
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}>
                Q-Safe
              </span>
            </Link>
            <p style={{
              color: '#888',
              fontSize: '0.95rem',
              lineHeight: '1.6',
              marginBottom: '20px'
            }}>
              Military-grade file encryption and secure transfer for professionals.
            </p>
            <div style={{
              display: 'flex',
              gap: '15px'
            }}>
              {['T', 'G', 'L'].map((social, index) => (
                <button
                  key={index}
                  onClick={() => {/* Social link handler */}}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#0a0a0a',
                    border: '1px solid #222',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#888',
                    fontSize: '0.8rem',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#00d4ff';
                    e.currentTarget.style.color = '#00d4ff';
                    e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#222';
                    e.currentTarget.style.color = '#888';
                    e.currentTarget.style.background = '#0a0a0a';
                  }}
                  title={index === 0 ? 'Twitter' : index === 1 ? 'GitHub' : 'LinkedIn'}
                >
                  {social}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section, index) => (
            <div key={index}>
              <h3 style={{
                color: '#fff',
                fontSize: '0.85rem',
                fontWeight: '700',
                letterSpacing: '1px',
                marginBottom: '20px'
              }}>
                {section.heading}
              </h3>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}>
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex} style={{ marginBottom: '12px' }}>
                    <Link
                      to={link.path}
                      style={{
                        color: '#888',
                        fontSize: '0.95rem',
                        textDecoration: 'none',
                        transition: 'color 0.3s ease',
                        display: 'inline-block'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#00d4ff';
                        e.currentTarget.style.transform = 'translateX(5px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#888';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div style={{
          paddingTop: '30px',
          borderTop: '1px solid #1a1a1a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <p style={{
            color: '#666',
            fontSize: '0.9rem',
            margin: 0
          }}>
            © 2026 Q-Safe. All rights reserved.
          </p>
          <div style={{
            display: 'flex',
            gap: '20px',
            alignItems: 'center'
          }}>
            <span style={{
              color: '#666',
              fontSize: '0.85rem'
            }}>
              🔐 Secured with AES-256
            </span>
            <span style={{
              color: '#666',
              fontSize: '0.85rem'
            }}>
              🛡️ GDPR Compliant
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
