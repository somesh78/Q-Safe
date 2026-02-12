
import React from 'react';
import '../App.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="auth-container">
          <div className="card" style={{ maxWidth: '600px', textAlign: 'center', borderColor: 'var(--error)' }}>
            <h1 style={{ color: 'var(--error)', marginBottom: '1rem' }}>😕 System Error</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              We encountered an unexpected issue. Your session may have expired or a connection error occurred.
            </p>

            <button
              className="btn-primary"
              onClick={this.handleReset}
            >
              Return to Home
            </button>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{ marginTop: '2rem', textAlign: 'left', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '5px' }}>
                <summary style={{ cursor: 'pointer', color: 'var(--accent-primary)' }}>Debug Details</summary>
                <pre style={{ fontSize: '0.8rem', color: '#ffecbc', overflowX: 'auto', marginTop: '1rem' }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

