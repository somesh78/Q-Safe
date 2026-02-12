
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api.js';
import '../App.css';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

    const pwdError = validatePassword(password);
    if (pwdError) {
      setError(pwdError);
      return;
    }

    setLoading(true);

    try {
      // Create account
      await API.post(`/signup/`, {
        username,
        password
      });

      // Auto-login after successful signup
      try {
        const tokenRes = await API.post('/token/', {
          username,
          password,
        });

        localStorage.setItem('access', tokenRes.data.access);
        localStorage.setItem('refresh', tokenRes.data.refresh);
        navigate('/');
      } catch (loginError) {
        // If auto-login fails, redirect to login page
        navigate('/login');
      }

    } catch (err) {
      console.error("Signup failed", err);
      setError(err.response?.data?.error || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-in">
        <h2 className="auth-title">Create Account</h2>

        {error && (
          <div style={{ color: 'var(--error)', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSignup}>
          <div style={{ marginBottom: '1.5rem' }}>
            <input
              className="input-field"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <input
              className="input-field"
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Must include 8+ chars, 1 uppercase, 1 number, 1 symbol
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
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
