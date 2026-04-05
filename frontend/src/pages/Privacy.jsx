import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Privacy() {
  const sections = [
    {
      title: 'Information We Collect',
      content: [
        {
          subtitle: 'Account Information',
          text: 'When you create an account, we collect your email address and create a secure password hash. We never store your password in plain text.'
        },
        {
          subtitle: 'File Metadata',
          text: 'We store metadata about your uploads including filename, size, expiration time, and download limits. The actual file content is encrypted and we cannot access it.'
        },
        {
          subtitle: 'Usage Data',
          text: 'We collect information about how you use Q-Safe, including IP addresses, browser type, and access timestamps for security and audit purposes.'
        },
        {
          subtitle: 'Cookies',
          text: 'We use JWT tokens stored in your browser for authentication. These are essential for the service to function.'
        }
      ]
    },
    {
      title: 'How We Use Your Information',
      content: [
        {
          subtitle: 'Service Delivery',
          text: 'We use your information to provide, maintain, and improve Q-Safe\'s file transfer services.'
        },
        {
          subtitle: 'Security',
          text: 'Your IP address and usage patterns help us detect and prevent unauthorized access, abuse, and security threats.'
        },
        {
          subtitle: 'Communication',
          text: 'We may send you service-related emails such as security alerts, account notifications, and updates (you can opt out of marketing emails).'
        },
        {
          subtitle: 'Compliance',
          text: 'We may use your information to comply with legal obligations and respond to lawful requests from authorities.'
        }
      ]
    },
    {
      title: 'How We Protect Your Data',
      content: [
        {
          subtitle: 'Encryption',
          text: 'All files are encrypted with AES-256 before storage. We use TLS 1.3 for all data transmission. Your encryption keys are never stored on our servers.'
        },
        {
          subtitle: 'Access Controls',
          text: 'Our systems employ strict access controls, multi-factor authentication, and principle of least privilege for all internal access.'
        },
        {
          subtitle: 'Data Minimization', 
          text: 'We only collect the minimum data necessary to provide our services. Files are automatically deleted after expiration.'
        },
        {
          subtitle: 'Security Monitoring',
          text: 'Our infrastructure is monitored 24/7 for security threats, with automated alerting and incident response procedures.'
        }
      ]
    },
    {
      title: 'Data Retention',
      content: [
        {
          subtitle: 'Files',
          text: 'Encrypted files are stored only until their expiration time or download limit is reached, whichever comes first. After deletion, files are immediately purged from our systems.'
        },
        {
          subtitle: 'Account Data',
          text: 'Account information is retained while your account is active. Upon account deletion, all associated data is permanently removed within 30 days.'
        },
        {
          subtitle: 'Audit Logs',
          text: 'Security audit logs are retained for 90 days for security and compliance purposes, then automatically deleted.'
        }
      ]
    },
    {
      title: 'Your Privacy Rights',
      content: [
        {
          subtitle: 'Access & Portability',
          text: 'You can access, export, or download your account information and file metadata at any time through your dashboard.'
        },
        {
          subtitle: 'Deletion',
          text: 'You can delete your files, sessions, or entire account at any time. Deletion is permanent and cannot be undone.'
        },
        {
          subtitle: 'Correction',
          text: 'You can update your account information through your profile settings at any time.'
        },
        {
          subtitle: 'Opt-Out',
          text: 'You can opt out of marketing communications while still receiving essential service notifications.'
        }
      ]
    },
    {
      title: 'Third-Party Services',
      content: [
        {
          subtitle: 'Storage Providers',
          text: 'We use Supabase for encrypted file storage. All files are encrypted before being sent to storage providers.'
        },
        {
          subtitle: 'Analytics', 
          text: 'We use privacy-focused analytics to understand usage patterns. No personally identifiable information is shared with analytics providers.'
        },
        {
          subtitle: 'No Selling',
          text: 'We never sell, rent, or trade your personal information to third parties for marketing purposes.'
        }
      ]
    }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary, #060606)' }}>
      <Header />
      
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 20px' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: '700', 
            color: '#fff',
            marginBottom: '20px',
            fontFamily: "'Plus Jakarta Sans', sans-serif"
          }}>
            Privacy Policy
          </h1>
          <p style={{ 
            fontSize: '1rem', 
            color: '#888',
            marginBottom: '10px'
          }}>
            Last Updated: February 16, 2026
          </p>
          <p style={{ 
            fontSize: '1.1rem', 
            color: '#aaa', 
            maxWidth: '700px', 
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Your privacy is fundamental to Q-Safe. This policy explains how we collect, use, and protect your information.
          </p>
        </div>

        {/* Intro Box */}
        <div style={{
          background: 'linear-gradient(135deg, #00d4ff, #0099cc)',
          borderRadius: '12px',
          padding: '30px',
          marginBottom: '60px'
        }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '600', 
            color: '#fff',
            marginBottom: '15px'
          }}>
            🔒 Privacy by Design
          </h2>
          <p style={{ 
            fontSize: '1rem', 
            color: '#f0f0f0', 
            lineHeight: '1.7',
            margin: 0
          }}>
            Q-Safe is built with privacy as the foundation. We use end-to-end encryption, zero-knowledge architecture, 
            and automatic data deletion to ensure your files remain private. We cannot access your encrypted files—only 
            you and your intended recipients can.
          </p>
        </div>

        {/* Sections */}
        {sections.map((section, index) => (
          <div key={index} style={{
            background: 'var(--bg-card, #0a0a0a)',
            border: '1px solid var(--border-color, #222)',
            borderRadius: '12px',
            padding: '40px',
            marginBottom: '30px'
          }}>
            <h2 style={{ 
              fontSize: '1.8rem', 
              fontWeight: '700', 
              color: '#00d4ff',
              marginBottom: '30px',
              paddingBottom: '15px',
              borderBottom: '2px solid #222'
            }}>
              {section.title}
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              {section.content.map((item, idx) => (
                <div key={idx}>
                  <h3 style={{ 
                    fontSize: '1.2rem', 
                    fontWeight: '600', 
                    color: '#fff',
                    marginBottom: '10px'
                  }}>
                    {item.subtitle}
                  </h3>
                  <p style={{ 
                    fontSize: '1rem', 
                    color: '#ccc', 
                    lineHeight: '1.7',
                    margin: 0
                  }}>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* GDPR Compliance */}
        <div style={{
          background: 'linear-gradient(135deg, #0a0a0a, #111)',
          border: '1px solid var(--border-color, #333)',
          borderRadius: '12px',
          padding: '40px',
          marginBottom: '30px'
        }}>
          <h2 style={{ 
            fontSize: '1.8rem', 
            fontWeight: '700', 
            color: '#00d4ff',
            marginBottom: '20px'
          }}>
            GDPR & International Privacy
          </h2>
          <p style={{ 
            fontSize: '1rem', 
            color: '#ccc', 
            lineHeight: '1.7',
            marginBottom: '20px'
          }}>
            Q-Safe complies with the General Data Protection Regulation (GDPR) and other international privacy laws. 
            If you are located in the European Economic Area (EEA), you have additional rights including:
          </p>
          <ul style={{ 
            color: '#ccc', 
            fontSize: '1rem', 
            lineHeight: '1.8',
            paddingLeft: '20px'
          }}>
            <li>Right to access your personal data</li>
            <li>Right to rectification of inaccurate data</li>
            <li>Right to erasure ("right to be forgotten")</li>
            <li>Right to restrict processing</li>
            <li>Right to data portability</li>
            <li>Right to object to processing</li>
            <li>Right to withdraw consent at any time</li>
          </ul>
        </div>

        {/* Children's Privacy */}
        <div style={{
          background: 'var(--bg-card, #0a0a0a)',
          border: '1px solid var(--border-color, #222)',
          borderRadius: '12px',
          padding: '40px',
          marginBottom: '30px'
        }}>
          <h2 style={{ 
            fontSize: '1.8rem', 
            fontWeight: '700', 
            color: '#00d4ff',
            marginBottom: '20px'
          }}>
            Children's Privacy
          </h2>
          <p style={{ 
            fontSize: '1rem', 
            color: '#ccc', 
            lineHeight: '1.7',
            margin: 0
          }}>
            Q-Safe is not intended for users under 13 years of age. We do not knowingly collect personal information 
            from children under 13. If you become aware that a child has provided us with personal information without 
            parental consent, please contact us immediately at privacy@q-safe.live.
          </p>
        </div>

        {/* Changes to Policy */}
        <div style={{
          background: 'var(--bg-card, #0a0a0a)',
          border: '1px solid var(--border-color, #222)',
          borderRadius: '12px',
          padding: '40px',
          marginBottom: '40px'
        }}>
          <h2 style={{ 
            fontSize: '1.8rem', 
            fontWeight: '700', 
            color: '#00d4ff',
            marginBottom: '20px'
          }}>
            Changes to This Policy
          </h2>
          <p style={{ 
            fontSize: '1rem', 
            color: '#ccc', 
            lineHeight: '1.7',
            margin: 0
          }}>
            We may update this privacy policy from time to time to reflect changes in our practices or legal requirements. 
            We will notify you of any material changes via email or prominent notice on our website at least 30 days before 
            the changes take effect. Continued use of Q-Safe after changes indicates acceptance of the updated policy.
          </p>
        </div>

        {/* Contact */}
        <div style={{
          textAlign: 'center',
          padding: '50px 40px',
          background: 'linear-gradient(135deg, #00d4ff, #0099cc)',
          borderRadius: '12px'
        }}>
          <h2 style={{ 
            fontSize: '1.8rem', 
            fontWeight: '700', 
            color: '#fff',
            marginBottom: '15px'
          }}>
            Questions About Privacy?
          </h2>
          <p style={{ 
            fontSize: '1.1rem', 
            color: '#f0f0f0',
            marginBottom: '25px'
          }}>
            Contact our privacy team at <strong>privacy@q-safe.live</strong>
          </p>
          <p style={{ 
            fontSize: '0.95rem', 
            color: '#f0f0f0',
            margin: 0
          }}>
            For GDPR-related requests, please email <strong>dpo@q-safe.live</strong>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
