
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API from '../services/api.js';
import ThemeToggle from "../components/ThemeToggle";
import '../App.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Handle Google OAuth callback — tokens come as query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const access = params.get('access');
    const refresh = params.get('refresh');
    const authError = params.get('error');

    if (authError) {
      setError('Google login failed. Please try again.');
      window.history.replaceState({}, '', '/login');
      return;
    }

    if (access && refresh) {
      localStorage.setItem('access', access);
      localStorage.setItem('refresh', refresh);

      const userEmail = params.get('email');
      const name = params.get('name');
      if (userEmail) localStorage.setItem('user_email', userEmail);
      if (name) localStorage.setItem('user_name', name);

      window.history.replaceState({}, '', '/login');
      navigate('/app', { replace: true });
    }
  }, [location.search, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use raw axios for login — no existing JWT needed
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/token/`,
        { username: email, password }
      );
      localStorage.setItem('access', res.data.access);
      localStorage.setItem('refresh', res.data.refresh);
      localStorage.setItem('user_email', email);

      const from = location.state?.from?.pathname || "/app";
      navigate(from, { replace: true });
    } catch (err) {
      console.error("Login failed:", err);
      // Show specific error from backend (e.g. "Please verify your email")
      const detail = err.response?.data?.detail;
      const nonFieldErrors = err.response?.data?.non_field_errors;
      if (nonFieldErrors && nonFieldErrors.length > 0) {
        setError(nonFieldErrors[0]);
      } else if (detail) {
        setError(detail);
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  const handleGoogleLogin = () => {
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
        <h2 className="auth-title">Welcome Back</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
          Sign in to access your secure file transfers
        </p>

        {error && (
          <div style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
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

        <form onSubmit={handleLogin}>
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

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              Password
            </label>
            <input
              className="input-field"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <span
              style={{ color: 'var(--accent-primary)', cursor: 'pointer' }}
              onClick={() => navigate('/signup')}
            >
              Sign Up
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
