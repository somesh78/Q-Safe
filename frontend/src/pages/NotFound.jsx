
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function NotFound() {
    const navigate = useNavigate();

    const popularPages = [
        { label: 'Features', path: '/features' },
        { label: 'Pricing', path: '/pricing' },
        { label: 'Security', path: '/security' },
        { label: 'Blog', path: '/blog' },
        { label: 'About', path: '/about' },
        { label: 'Contact', path: '/contact' },
    ];

    return (
        <div className="app-container">
            <Header />

            <main className="main-content" style={{ justifyContent: 'center', textAlign: 'center', minHeight: '60vh' }}>
                <div className="animate-fade-in" style={{ maxWidth: '550px' }}>
                    <div style={{ fontSize: '5rem', marginBottom: '0.5rem', lineHeight: 1 }}>🔍</div>
                    <h1 style={{
                        fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                        fontWeight: '800',
                        fontFamily: 'var(--font-display)',
                        marginBottom: '0.75rem',
                        letterSpacing: '-0.03em'
                    }}>
                        Page not found
                    </h1>
                    <p style={{
                        fontSize: '1.125rem',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.7',
                        marginBottom: '2rem'
                    }}>
                        The page you're looking for doesn't exist or has been moved.
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3rem' }}>
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

                    {/* Popular pages */}
                    <div style={{
                        padding: '1.5rem',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-lg)',
                        textAlign: 'left'
                    }}>
                        <p style={{
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            color: 'var(--text-secondary)',
                            marginBottom: '0.75rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            Popular pages
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {popularPages.map((page) => (
                                <button
                                    key={page.path}
                                    className="btn-secondary"
                                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                    onClick={() => { navigate(page.path); window.scrollTo(0, 0); }}
                                >
                                    {page.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
