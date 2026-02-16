import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Features() {
  const features = [
    {
      icon: '🔒',
      title: 'Military-Grade Encryption',
      description: 'AES-256 encryption ensures your files are protected with the same security used by governments and military organizations worldwide.'
    },
    {
      icon: '🌐',
      title: 'Online & Offline Modes',
      description: 'Share encrypted links online or generate QR codes for completely air-gapped, offline transfers without internet connectivity.'
    },
    {
      icon: '⏱️',
      title: 'Time-Limited Access',
      description: 'Set expiration times for your transfers. Files automatically delete after the specified duration, ensuring temporary sharing stays temporary.'
    },
    {
      icon: '🔢',
      title: 'Download Limits',
      description: 'Control how many times a file can be downloaded. Files self-destruct after reaching the limit, preventing unauthorized redistribution.'
    },
    {
      icon: '🛡️',
      title: 'IP Locking',
      description: 'Restrict file access to specific IP addresses. Only authorized users from designated locations can download your encrypted files.'
    },
    {
      icon: '📊',
      title: 'Comprehensive Audit Logs',
      description: 'Track every upload, download, and session with detailed logs including timestamps, IP addresses, and user information.'
    },
    {
      icon: '🔐',
      title: 'Password Protection',
      description: 'Add an extra layer of security with custom passwords. Recipients must enter the correct password to decrypt and access files.'
    },
    {
      icon: '📱',
      title: 'QR Code Generation',
      description: 'Generate QR codes containing encrypted file chunks for secure offline transfers. Perfect for air-gapped environments.'
    },
    {
      icon: '⚡',
      title: 'Chunked Upload/Download',
      description: 'Large files are split into manageable chunks with sequential validation and checksum verification for data integrity.'
    },
    {
      icon: '🚀',
      title: 'Rate Limiting & Security',
      description: 'Built-in rate limiting, JWT authentication, and automated security measures protect against abuse and unauthorized access.'
    },
    {
      icon: '💾',
      title: 'Secure Storage',
      description: 'Files are encrypted before storage and automatically cleaned up after expiration. Your data never sits unencrypted on our servers.'
    },
    {
      icon: '📈',
      title: 'Real-Time Dashboard',
      description: 'Monitor your uploads, downloads, and sessions in real-time with an intuitive dashboard showing all your transfer activity.'
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
            Powerful Features for Secure File Transfer
          </h1>
          <p style={{ 
            fontSize: '1.25rem', 
            color: '#888', 
            maxWidth: '700px', 
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Q-Safe combines military-grade encryption with innovative features to give you complete control over your file transfers.
          </p>
        </div>

        {/* Features Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '30px',
          marginBottom: '60px'
        }}>
          {features.map((feature, index) => (
            <div key={index} style={{
              background: 'linear-gradient(135deg, #0a0a0a, #111)',
              border: '1px solid #222',
              borderRadius: '12px',
              padding: '30px',
              transition: 'all 0.3s ease',
              cursor: 'default'
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
                lineHeight: '1.6' 
              }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div style={{
          textAlign: 'center',
          padding: '60px 30px',
          background: 'linear-gradient(135deg, #00d4ff, #0099cc)',
          borderRadius: '16px',
          marginTop: '60px'
        }}>
          <h2 style={{ 
            fontSize: '2rem', 
            fontWeight: '700', 
            color: '#fff',
            marginBottom: '20px'
          }}>
            Ready to secure your file transfers?
          </h2>
          <p style={{ 
            fontSize: '1.1rem', 
            color: '#f0f0f0',
            marginBottom: '30px'
          }}>
            Sign up now and start protecting your data with military-grade encryption.
          </p>
          <Link to="/signup" style={{
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
            Get Started Free
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
