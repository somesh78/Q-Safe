import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Terms() {
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
            Terms of Service
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
            Please read these terms carefully before using Q-Safe. By using our service, you agree to these terms.
          </p>
        </div>

        {/* Quick Summary */}
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
            📋 In Plain English
          </h2>
          <p style={{ 
            fontSize: '1rem', 
            color: '#f0f0f0', 
            lineHeight: '1.7',
            margin: 0
          }}>
            Q-Safe provides secure file transfer services. You own your data, we protect it. Don't use our service 
            for illegal activities. We're not liable for data loss, so keep backups. You can cancel anytime. 
            Read below for the complete legal terms.
          </p>
        </div>

        {/* 1. Acceptance of Terms */}
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
            1. Acceptance of Terms
          </h2>
          <p style={{ 
            fontSize: '1rem', 
            color: '#ccc', 
            lineHeight: '1.7'
          }}>
            By accessing or using Q-Safe ("the Service"), you agree to be bound by these Terms of Service ("Terms"). 
            If you do not agree to these Terms, do not use the Service. We reserve the right to modify these Terms 
            at any time, and will notify users of material changes via email or prominent notice on our website.
          </p>
        </div>

        {/* 2. Service Description */}
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
            2. Service Description
          </h2>
          <p style={{ 
            fontSize: '1rem', 
            color: '#ccc', 
            lineHeight: '1.7',
            marginBottom: '15px'
          }}>
            Q-Safe provides encrypted file transfer and storage services with features including:
          </p>
          <ul style={{ 
            color: '#ccc', 
            fontSize: '1rem', 
            lineHeight: '1.8',
            paddingLeft: '20px'
          }}>
            <li>AES-256 encryption for files</li>
            <li>Online and offline transfer modes</li>
            <li>Time-limited and download-limited access</li>
            <li>QR code generation for offline transfers</li>
            <li>Password protection and IP locking</li>
            <li>Audit logging and analytics</li>
          </ul>
          <p style={{ 
            fontSize: '1rem', 
            color: '#ccc', 
            lineHeight: '1.7',
            margin: '15px 0 0 0'
          }}>
            We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time with reasonable notice.
          </p>
        </div>

        {/* 3. Account Registration */}
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
            3. Account Registration & Security
          </h2>
          <p style={{ 
            fontSize: '1rem', 
            color: '#ccc', 
            lineHeight: '1.7',
            marginBottom: '15px'
          }}>
            To use Q-Safe, you must create an account by providing a valid email address and password. You agree to:
          </p>
          <ul style={{ 
            color: '#ccc', 
            fontSize: '1rem', 
            lineHeight: '1.8',
            paddingLeft: '20px'
          }}>
            <li>Provide accurate, current, and complete information</li>
            <li>Maintain the security of your password and account</li>
            <li>Notify us immediately of any unauthorized use of your account</li>
            <li>Be responsible for all activities under your account</li>
            <li>Not share your account credentials with others</li>
          </ul>
          <p style={{ 
            fontSize: '1rem', 
            color: '#ccc', 
            lineHeight: '1.7',
            margin: '15px 0 0 0'
          }}>
            You must be at least 13 years old to use Q-Safe. Users under 18 must have parental consent.
          </p>
        </div>

        {/* 4. Acceptable Use */}
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
            4. Acceptable Use Policy
          </h2>
          <p style={{ 
            fontSize: '1rem', 
            color: '#ccc', 
            lineHeight: '1.7',
            marginBottom: '15px'
          }}>
            You agree NOT to use Q-Safe to:
          </p>
          <ul style={{ 
            color: '#ccc', 
            fontSize: '1rem', 
            lineHeight: '1.8',
            paddingLeft: '20px'
          }}>
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe on intellectual property rights of others</li>
            <li>Upload malware, viruses, or malicious code</li>
            <li>Distribute illegal, harmful, or objectionable content</li>
            <li>Harass, threaten, or harm others</li>
            <li>Attempt to breach or circumvent our security measures</li>
            <li>Abuse rate limits or overload our infrastructure</li>
            <li>Share child exploitation material (immediate termination and reporting)</li>
          </ul>
          <p style={{ 
            fontSize: '1rem', 
            color: '#ccc', 
            lineHeight: '1.7',
            margin: '15px 0 0 0'
          }}>
            Violation of this policy may result in immediate account suspension or termination and reporting to authorities.
          </p>
        </div>

        {/* 5. Data Ownership */}
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
            5. Data Ownership & License
          </h2>
          <p style={{ 
            fontSize: '1rem', 
            color: '#ccc', 
            lineHeight: '1.7',
            marginBottom: '15px'
          }}>
            <strong style={{ color: '#fff' }}>You own your data.</strong> All files you upload remain your property. 
            By uploading content to Q-Safe, you grant us a limited license to:
          </p>
          <ul style={{ 
            color: '#ccc', 
            fontSize: '1rem', 
            lineHeight: '1.8',
            paddingLeft: '20px'
          }}>
            <li>Store your encrypted files on our infrastructure</li>
            <li>Transmit files to recipients you designate</li>
            <li>Make necessary technical copies for backup and redundancy</li>
            <li>Provide the services described in these Terms</li>
          </ul>
          <p style={{ 
            fontSize: '1rem', 
            color: '#ccc', 
            lineHeight: '1.7',
            margin: '15px 0 0 0'
          }}>
            This license terminates when your files expire or are deleted. We cannot and do not access your encrypted file content.
          </p>
        </div>

        {/* 6. Limitation of Liability */}
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
            6. Limitation of Liability
          </h2>
          <p style={{ 
            fontSize: '1rem', 
            color: '#ccc', 
            lineHeight: '1.7',
            marginBottom: '15px'
          }}>
            Q-Safe is provided "AS IS" without warranties of any kind. To the maximum extent permitted by law:
          </p>
          <ul style={{ 
            color: '#ccc', 
            fontSize: '1rem', 
            lineHeight: '1.8',
            paddingLeft: '20px',
            marginBottom: '15px'
          }}>
            <li>We are not liable for data loss, corruption, or unauthorized access</li>
            <li>We are not responsible for service interruptions or downtime</li>
            <li>Our total liability to you is limited to the amount you paid in the past 12 months</li>
            <li>We are not liable for indirect, incidental, or consequential damages</li>
          </ul>
          <p style={{ 
            fontSize: '1rem', 
            color: '#ffa500', 
            lineHeight: '1.7',
            background: 'rgba(255, 165, 0, 0.1)',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid #ffa500',
            margin: 0
          }}>
            <strong>⚠️ Important:</strong> Always maintain backup copies of important files. While we take security seriously, 
            no online service can guarantee 100% data protection.
          </p>
        </div>

        {/* 7. Pricing & Payments */}
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
            7. Pricing & Payments
          </h2>
          <p style={{ 
            fontSize: '1rem', 
            color: '#ccc', 
            lineHeight: '1.7'
          }}>
            Pricing is available on our <Link to="/pricing" style={{ color: '#00d4ff', textDecoration: 'none' }}>Pricing page</Link>. 
            For paid plans: (1) Fees are billed in advance on a monthly or annual basis, (2) You may cancel at any time 
            with no refund for partial months, (3) We reserve the right to change pricing with 30 days notice, 
            (4) All payments are non-refundable except as required by law.
          </p>
        </div>

        {/* 8. Termination */}
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
            8. Termination
          </h2>
          <p style={{ 
            fontSize: '1rem', 
            color: '#ccc', 
            lineHeight: '1.7'
          }}>
            You may terminate your account at any time through your account settings. We may suspend or terminate 
            your account immediately if you violate these Terms, engage in fraudulent activity, or for other valid 
            business reasons. Upon termination, all your data will be permanently deleted within 30 days.
          </p>
        </div>

        {/* 9. Governing Law */}
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
            9. Governing Law & Disputes
          </h2>
          <p style={{ 
            fontSize: '1rem', 
            color: '#ccc', 
            lineHeight: '1.7'
          }}>
            These Terms are governed by the laws of [Your Jurisdiction], without regard to conflict of law principles. 
            Any disputes will be resolved through binding arbitration in [Your Location], except for injunctive relief 
            which may be sought in court. You waive the right to participate in class action lawsuits.
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
            Questions About These Terms?
          </h2>
          <p style={{ 
            fontSize: '1.1rem', 
            color: '#f0f0f0',
            marginBottom: '25px'
          }}>
            Contact our legal team at <strong>legal@q-safe.live</strong>
          </p>
          <Link to="/contact" style={{
            display: 'inline-block',
            padding: '12px 30px',
            background: 'var(--bg-primary, #060606)',
            color: '#00d4ff',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            border: '2px solid #060606'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.color = '#060606';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#060606';
            e.currentTarget.style.color = '#00d4ff';
          }}>
            Contact Us
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
