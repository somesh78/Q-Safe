
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ThemeToggle from "../components/ThemeToggle";
import '../App.css';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(pwd)) return "Password must contain an uppercase letter";
    if (!/[0-9]/.test(pwd)) return "Password must contain a number";
    if (!/[^A-Za-z0-9]/.test(pwd)) return "Password must contain a special character";
    return null;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const pwdError = validatePassword(password);
    if (pwdError) {
      setError(pwdError);
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/signup/`, {
        email,
        password,
        username: username || undefined,
      });

      setSuccess(res.data.message || 'Account created! Check your email to verify.');
      // Don't auto-login — user must verify email first

    } catch (err) {
      console.error("Signup failed", err);
      setError(err.response?.data?.error || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleGoogleSignup = () => {
    const backendUrl = process.env.REACT_APP_API_URL || '';
    const baseUrl = backendUrl.replace(/\/api\/?$/, '');
    window.location.href = `${baseUrl}/api/auth/login/google-oauth2/`;
  };

  return (
    <div className="auth-container" style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
        <ThemeToggle />
      </div>
      <div className="auth-card animate-fade-in">
        <h2 className="auth-title">Create Account</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
          Join Q-Safe to start sharing files securely
        </p>

        {error && (
          <div style={{ color: 'var(--error)', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            color: '#10b981',
            marginBottom: '1rem',
            textAlign: 'center',
            fontSize: '0.9rem',
            padding: '0.75rem',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: 'var(--radius-sm)'
          }}>
            ✓ {success}
            <div style={{ marginTop: '0.75rem' }}>
              <button
                className="btn-primary"
                style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem' }}
                onClick={() => navigate('/login')}
              >
                Go to Login →
              </button>
            </div>
          </div>
        )}

        {/* Google Signup Button */}
        <button
          onClick={handleGoogleSignup}
          type="button"
          style={{
            width: '100%',
            padding: '0.75rem',
            marginBottom: '1.5rem',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
            e.currentTarget.style.background = 'var(--bg-secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.background = 'var(--bg-primary)';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 256 262" xmlns="http://www.w3.org/2000/svg">
            <path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4" />
            <path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853" />
            <path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05" />
            <path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '1.5rem',
          gap: '12px'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
        </div>

        <form onSubmit={handleSignup}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              Email
            </label>
            <input
              className="input-field"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              Username <span style={{ color: 'var(--text-secondary)', fontWeight: '400', fontSize: '0.8rem' }}>(optional — defaults to email)</span>
            </label>
            <input
              className="input-field"
              placeholder="Choose a display name"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              Password
            </label>
            <input
              className="input-field"
              type="password"
              placeholder="Create a strong password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <div style={{
              marginTop: '0.75rem',
              padding: '0.75rem',
              background: 'rgba(255, 167, 38, 0.1)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              border: '1px solid rgba(255, 167, 38, 0.2)',
              lineHeight: '1.5'
            }}>
              <strong style={{ color: 'var(--text-primary)' }}>Requirements:</strong><br />
              • At least 8 characters<br />
              • 1 uppercase letter<br />
              • 1 number<br />
              • 1 special character
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%' }}
            disabled={loading || !!success}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <span
              style={{ color: 'var(--accent-primary)', cursor: 'pointer' }}
              onClick={() => navigate('/login')}
            >
              Log In
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
