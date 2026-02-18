import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import API from '../services/api.js';
import ThemeToggle from '../components/ThemeToggle';
import '../App.css';

export default function VerifyEmail() {
    const { uid, token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying | success | error
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        const verify = async () => {
            try {
                const res = await API.get(`/verify-email/${uid}/${token}/`);
                setStatus('success');
                setMessage(res.data.message || 'Email verified successfully!');
            } catch (err) {
                setStatus('error');
                setMessage(
                    err.response?.data?.error || 'Verification failed. The link may have expired.'
                );
            }
        };

        verify();
    }, [uid, token]);

    return (
        <div className="auth-container" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                <ThemeToggle />
            </div>
            <div className="auth-card animate-fade-in" style={{ textAlign: 'center' }}>

                {/* Status Icon */}
                <div style={{
                    fontSize: '4rem',
                    marginBottom: '1.5rem',
                    animation: status === 'verifying' ? 'spin 1.5s linear infinite' : 'none'
                }}>
                    {status === 'verifying' && '⏳'}
                    {status === 'success' && '✅'}
                    {status === 'error' && '❌'}
                </div>

                <h2 className="auth-title" style={{ marginBottom: '1rem' }}>
                    {status === 'verifying' && 'Verifying Email...'}
                    {status === 'success' && 'Email Verified!'}
                    {status === 'error' && 'Verification Failed'}
                </h2>

                <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '1rem',
                    lineHeight: '1.6',
                    marginBottom: '2rem'
                }}>
                    {message}
                </p>

                {status === 'success' && (
                    <button
                        className="btn-primary"
                        style={{ width: '100%' }}
                        onClick={() => navigate('/login')}
                    >
                        Go to Login
                    </button>
                )}

                {status === 'error' && (
                    <div>
                        <button
                            className="btn-primary"
                            style={{ width: '100%', marginBottom: '1rem' }}
                            onClick={() => navigate('/signup')}
                        >
                            Create New Account
                        </button>
                        <button
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: 'transparent',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontSize: '0.95rem'
                            }}
                            onClick={() => navigate('/login')}
                        >
                            Back to Login
                        </button>
                    </div>
                )}
            </div>

            {/* Spinner animation */}
            <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
