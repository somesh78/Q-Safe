import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Compliance() {
  const standards = [
    {
      icon: '🇪🇺',
      title: 'GDPR Compliance',
      subtitle: 'General Data Protection Regulation',
      description: 'Full compliance with EU data protection requirements including data subject rights, lawful processing, and data minimization.',
      features: ['Right to access', 'Right to erasure', 'Data portability', 'Privacy by design', 'DPO appointed']
    },
    {
      icon: '🏥',
      title: 'HIPAA Ready',
      subtitle: 'Health Insurance Portability and Accountability Act',
      description: 'Enterprise plans support HIPAA compliance for protected health information (PHI) with Business Associate Agreements available.',
      features: ['BAA available', 'Encrypted PHI storage', 'Access logging', 'Administrative safeguards', 'Technical controls']
    },
    {
      icon: '🔐',
      title: 'ISO 27001',
      subtitle: 'Information Security Management',
      description: 'Our security management system follows ISO 27001 standards for information security best practices.',
      features: ['Risk assessment', 'Security policies', 'Incident response', 'Access controls', 'Continuous monitoring']
    },
    {
      icon: '✅',
      title: 'SOC 2 Type II',
      subtitle: 'Service Organization Control',
      description: 'Annual SOC 2 Type II audits verify our security, availability, and confidentiality controls over time.',
      features: ['Security controls', 'Availability monitoring', 'Process integrity', 'Confidentiality', 'Privacy protection']
    }
  ];

  const practices = [
    {
      category: 'Data Protection',
      items: [
        'End-to-end AES-256 encryption',
        'Zero-knowledge architecture',
        'Automatic data deletion',
        'Encrypted backups',
        'Secure key management'
      ]
    },
    {
      category: 'Access Control',
      items: [
        'Multi-factor authentication',
        'Role-based access (RBAC)',
        'IP whitelisting',
        'Session management',
        'Password policies'
      ]
    },
    {
      category: 'Monitoring & Auditing',
      items: [
        'Real-time security monitoring',
        'Comprehensive audit logs',
        'Failed access tracking',
        'Automated alerting',
        'Incident response'
      ]
    },
    {
      category: 'Infrastructure',
      items: [
        'Regular security audits',
        'Penetration testing',
        'Vulnerability scanning',
        'Patch management',
        '24/7 monitoring'
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
            Compliance & Certifications
          </h1>
          <p style={{ 
            fontSize: '1.25rem', 
            color: '#888', 
            maxWidth: '800px', 
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Q-Safe meets the highest standards for security, privacy, and compliance to protect your data and meet regulatory requirements.
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
            🛡️ Trusted by Organizations Worldwide
          </h2>
          <p style={{ 
            fontSize: '1.1rem', 
            color: '#f0f0f0',
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Our commitment to compliance means you can trust Q-Safe with your most sensitive data, 
            from healthcare records to financial documents.
          </p>
        </div>

        {/* Standards Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '30px',
          marginBottom: '80px'
        }}>
          {standards.map((standard, index) => (
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
                {standard.icon}
              </div>
              <h3 style={{ 
                fontSize: '1.4rem', 
                fontWeight: '700', 
                color: '#00d4ff',
                marginBottom: '5px',
                textAlign: 'center'
              }}>
                {standard.title}
              </h3>
              <p style={{ 
                fontSize: '0.85rem', 
                color: '#888',
                marginBottom: '15px',
                textAlign: 'center'
              }}>
                {standard.subtitle}
              </p>
              <p style={{ 
                fontSize: '0.95rem', 
                color: '#ccc', 
                lineHeight: '1.6',
                marginBottom: '20px'
              }}>
                {standard.description}
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
                  Key Features
                </h4>
                <ul style={{ 
                  listStyle: 'none', 
                  padding: 0, 
                  margin: 0 
                }}>
                  {standard.features.map((feature, idx) => (
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

        {/* Security Practices */}
        <div style={{ marginBottom: '80px' }}>
          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            color: '#fff',
            textAlign: 'center',
            marginBottom: '50px'
          }}>
            Security & Compliance Practices
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '25px'
          }}>
            {practices.map((practice, index) => (
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
                  {practice.category}
                </h3>
                <ul style={{ 
                  listStyle: 'none', 
                  padding: 0, 
                  margin: 0 
                }}>
                  {practice.items.map((item, idx) => (
                    <li key={idx} style={{ 
                      padding: '10px 0',
                      color: '#ccc',
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      borderBottom: idx < practice.items.length - 1 ? '1px solid #1a1a1a' : 'none'
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

        {/* Audit & Reports */}
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
            Audit Reports & Documentation
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '30px',
            marginBottom: '30px'
          }}>
            {[
              { title: 'SOC 2 Type II Report', desc: 'Available under NDA to Enterprise customers' },
              { title: 'Penetration Test Results', desc: 'Annual third-party pen testing reports' },
              { title: 'Security Whitepaper', desc: 'Detailed documentation of our security architecture' },
              { title: 'DPA & BAA Templates', desc: 'GDPR Data Processing Agreements and HIPAA BAAs' }
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
            📧 Request compliance documentation at <strong style={{ color: '#00d4ff' }}>compliance@q-safe.live</strong>
          </p>
        </div>

        {/* Data Residency */}
        <div style={{
          background: 'linear-gradient(135deg, #0a0a0a, #111)',
          border: '1px solid #222',
          borderRadius: '16px',
          padding: '50px',
          marginBottom: '60px'
        }}>
          <h2 style={{ 
            fontSize: '2rem', 
            fontWeight: '700', 
            color: '#fff',
            marginBottom: '25px'
          }}>
            🌍 Data Residency & Sovereignty
          </h2>
          <p style={{ 
            fontSize: '1.05rem', 
            color: '#ccc', 
            lineHeight: '1.7',
            marginBottom: '20px'
          }}>
            We understand that data location matters. Q-Safe offers multiple data center regions to meet your 
            compliance and sovereignty requirements:
          </p>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginTop: '30px'
          }}>
            {['🇺🇸 United States', '🇪🇺 European Union', '🇬🇧 United Kingdom', '🇦🇺 Australia', '🇨🇦 Canada', '🇸🇬 Singapore'].map((region, index) => (
              <div key={index} style={{
                padding: '20px',
                background: 'rgba(0, 212, 255, 0.05)',
                border: '1px solid #00d4ff',
                borderRadius: '8px',
                textAlign: 'center',
                color: '#00d4ff',
                fontSize: '1rem',
                fontWeight: '600'
              }}>
                {region}
              </div>
            ))}
          </div>
          <p style={{ 
            fontSize: '0.95rem', 
            color: '#888',
            marginTop: '25px',
            textAlign: 'center',
            margin: '25px 0 0 0'
          }}>
            Enterprise plans allow you to choose your preferred data center region
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
            Need Compliance Documentation?
          </h2>
          <p style={{ 
            fontSize: '1.1rem', 
            color: '#f0f0f0',
            marginBottom: '30px',
            maxWidth: '600px',
            margin: '0 auto 30px'
          }}>
            Our compliance team is here to help you meet your regulatory requirements.
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
            Contact Compliance Team
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
