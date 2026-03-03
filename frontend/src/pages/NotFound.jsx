
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="app-container">
            <Header />

            <main className="main-content" style={{ justifyContent: 'center', textAlign: 'center', minHeight: '60vh' }}>
                <div className="animate-fade-in" style={{ maxWidth: '500px' }}>
                    <div style={{ fontSize: '6rem', marginBottom: '1rem', lineHeight: 1 }}>🔍</div>
                    <h1 style={{
                        fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                        fontWeight: '800',
                        fontFamily: 'var(--font-display)',
                        marginBottom: '1rem',
                        letterSpacing: '-0.03em'
                    }}>
                        Page not found
                    </h1>
                    <p style={{
                        fontSize: '1.125rem',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.7',
                        marginBottom: '2.5rem'
                    }}>
                        The page you're looking for doesn't exist or has been moved.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                            className="btn-primary"
                            style={{ padding: '0.875rem 2rem' }}
                            onClick={() => navigate('/')}
                        >
                            Go to Homepage
                        </button>
                        <button
                            className="btn-secondary"
                            style={{ padding: '0.875rem 2rem' }}
                            onClick={() => navigate(-1)}
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
