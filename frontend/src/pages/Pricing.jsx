import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Pricing() {
    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #060606, #0a0a0a)' }}>
            <Header />

            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '80px 20px' }}>
                {/* Hero */}
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <h1 style={{
                        fontSize: '3rem',
                        fontWeight: '700',
                        color: '#fff',
                        marginBottom: '20px',
                        fontFamily: "'Plus Jakarta Sans', sans-serif"
                    }}>
                        Simple & Free
                    </h1>
                    <p style={{
                        fontSize: '1.25rem',
                        color: '#888',
                        maxWidth: '700px',
                        margin: '0 auto',
                        lineHeight: '1.6'
                    }}>
                        Q-Safe is currently free for all users. Secure file sharing shouldn't have a paywall.
                    </p>
                </div>

                {/* Single Plan Card */}
                <div style={{
                    maxWidth: '500px',
                    margin: '0 auto 60px',
                    background: 'linear-gradient(135deg, #0a0a0a, #111)',
                    border: '2px solid #00d4ff',
                    borderRadius: '16px',
                    padding: '50px 40px',
                    textAlign: 'center',
                    boxShadow: '0 0 40px rgba(0, 212, 255, 0.15)'
                }}>
                    <div style={{
                        display: 'inline-block',
                        padding: '6px 16px',
                        background: 'rgba(0, 212, 255, 0.15)',
                        borderRadius: '20px',
                        color: '#00d4ff',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        marginBottom: '20px',
                        letterSpacing: '1px'
                    }}>
                        CURRENT PLAN
                    </div>

                    <h2 style={{
                        fontSize: '2.5rem',
                        fontWeight: '700',
                        color: '#fff',
                        marginBottom: '5px'
                    }}>
                        Free
                    </h2>
                    <p style={{
                        fontSize: '3rem',
                        fontWeight: '700',
                        color: '#00d4ff',
                        marginBottom: '30px'
                    }}>
                        $0<span style={{ fontSize: '1rem', color: '#888', fontWeight: '400' }}> / forever</span>
                    </p>

                    <div style={{ textAlign: 'left', marginBottom: '30px' }}>
                        {[
                            'Up to 500 MB per file (online mode)',
                            'Up to 20 MB per file (offline QR mode)',
                            'AES-256 encryption',
                            'QR code generation',
                            'IP address locking',
                            'Configurable download limits (1-10)',
                            'Configurable expiry (1-24 hours)',
                            'Offline air-gapped mode',
                            'File reconstruction from QR codes',
                            'Audit logs for all downloads',
                            'Dashboard to manage files'
                        ].map((feature, index) => (
                            <div key={index} style={{
                                padding: '12px 0',
                                borderBottom: index < 10 ? '1px solid #1a1a1a' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}>
                                <span style={{ color: '#00d4ff', fontSize: '1.1rem' }}>✓</span>
                                <span style={{ color: '#ccc', fontSize: '0.95rem' }}>{feature}</span>
                            </div>
                        ))}
                    </div>

                    <Link to="/signup" style={{
                        display: 'block',
                        padding: '15px 30px',
                        background: 'linear-gradient(135deg, #00d4ff, #0099cc)',
                        color: '#fff',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '1.1rem',
                        transition: 'all 0.3s ease',
                        border: 'none'
                    }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 5px 20px rgba(0, 212, 255, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}>
                        Get Started — It's Free
                    </Link>
                </div>

                {/* FAQ-style info */}
                <div style={{
                    background: '#0a0a0a',
                    border: '1px solid #222',
                    borderRadius: '16px',
                    padding: '40px',
                    marginBottom: '60px'
                }}>
                    <h3 style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: '#fff',
                        marginBottom: '25px',
                        textAlign: 'center'
                    }}>
                        Frequently Asked Questions
                    </h3>

                    {[
                        { q: 'Will Q-Safe always be free?', a: 'The core file encryption and sharing features will remain free. We may introduce optional premium features in the future, but secure file sharing will always have a free tier.' },
                        { q: 'Are there any usage limits?', a: 'Files are limited to 500 MB for online mode and 20 MB for offline QR mode. You can upload up to 20 files per hour. Links expire after a maximum of 24 hours.' },
                        { q: 'Do you sell my data?', a: 'No. We use a zero-knowledge architecture — we never see your unencrypted files or passwords. We have no data to sell.' },
                        { q: 'Need higher limits or custom features?', a: 'Contact us at support@q-safe.live and we\'ll work with you on a solution.' }
                    ].map((faq, index) => (
                        <div key={index} style={{
                            padding: '20px 0',
                            borderBottom: index < 3 ? '1px solid #1a1a1a' : 'none'
                        }}>
                            <h4 style={{
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                color: '#00d4ff',
                                marginBottom: '8px'
                            }}>
                                {faq.q}
                            </h4>
                            <p style={{
                                fontSize: '0.95rem',
                                color: '#aaa',
                                lineHeight: '1.6',
                                margin: 0
                            }}>
                                {faq.a}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
            <Footer />
        </div>
    );
}
