
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LogoutButton from "./LogoutButton";
import ThemeToggle from "./ThemeToggle";
import '../App.css';

const NAV_LINKS = [
    { label: 'Features', path: '/features' },
    { label: 'Pricing', path: '/pricing' },
    { label: 'Security', path: '/security' },
    { label: 'About', path: '/about' },
    { label: 'Blog', path: '/blog' },
];

export default function Header({ showLogout, showDashboardBtn = false, showHomeBtn = false }) {
    const navigate = useNavigate();
    const location = useLocation();
    const isLoggedIn = !!localStorage.getItem('access');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Auto-detect: show logout only if user is logged in (unless explicitly overridden)
    const shouldShowLogout = showLogout !== undefined ? showLogout : isLoggedIn;

    // Show nav links on public pages (not in the authenticated app area)
    const isAppPage = ['/app', '/dashboard', '/audit', '/reconstruct'].includes(location.pathname);
    const showNavLinks = !isAppPage;

    const handleNav = (path) => {
        navigate(path);
        window.scrollTo(0, 0);
        setMobileMenuOpen(false);
    };

    return (
        <header className="app-header">
            <div className="brand" onClick={() => navigate(isLoggedIn ? "/app" : "/")} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <img
                    src="/logo.png"
                    alt="Q-Safe Logo"
                    style={{
                        height: '52px',
                        width: 'auto',
                        filter: 'drop-shadow(0 0 8px rgba(0, 212, 255, 0.3))'
                    }}
                />
                <span style={{ fontWeight: '800', fontSize: '1.5rem', fontFamily: 'var(--font-display)' }}>Q-Safe</span>
            </div>

            {/* Desktop nav */}
            <div className="nav-actions nav-desktop">
                {showNavLinks && NAV_LINKS.map((link) => (
                    <button
                        key={link.path}
                        className="nav-link-btn"
                        onClick={() => handleNav(link.path)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: location.pathname === link.path ? 'var(--accent-primary)' : 'var(--text-secondary)',
                            fontWeight: location.pathname === link.path ? '600' : '500',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '8px',
                            transition: 'all 0.2s ease',
                            fontFamily: 'var(--font-display)'
                        }}
                        onMouseEnter={(e) => { if (location.pathname !== link.path) e.currentTarget.style.color = 'var(--text-primary)'; }}
                        onMouseLeave={(e) => { if (location.pathname !== link.path) e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                        {link.label}
                    </button>
                ))}
                {showDashboardBtn && (
                    <button className="btn-secondary" onClick={() => handleNav("/dashboard")}>
                        Dashboard
                    </button>
                )}
                {showHomeBtn && (
                    <button className="btn-secondary" onClick={() => handleNav("/app")}>
                        Home
                    </button>
                )}
                {!isLoggedIn && showNavLinks && (
                    <button
                        className="btn-primary"
                        style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}
                        onClick={() => handleNav("/login")}
                    >
                        Login
                    </button>
                )}
                <ThemeToggle />
                {shouldShowLogout && <LogoutButton />}
            </div>

            {/* Mobile hamburger */}
            <button
                className="hamburger-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
            >
                <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`} />
                <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`} />
                <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`} />
            </button>

            {/* Mobile menu */}
            {mobileMenuOpen && (
                <div className="mobile-menu">
                    {showNavLinks && NAV_LINKS.map((link) => (
                        <button
                            key={link.path}
                            className="mobile-menu-item"
                            onClick={() => handleNav(link.path)}
                            style={{
                                background: location.pathname === link.path ? 'rgba(0, 212, 255, 0.1)' : 'transparent',
                                border: location.pathname === link.path ? '1px solid rgba(0, 212, 255, 0.3)' : '1px solid transparent',
                                color: location.pathname === link.path ? 'var(--accent-primary)' : 'var(--text-primary)',
                                fontWeight: location.pathname === link.path ? '600' : '500',
                                padding: '0.75rem 1rem',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontSize: '0.95rem',
                                textAlign: 'left',
                                width: '100%',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {link.label}
                        </button>
                    ))}
                    {showDashboardBtn && (
                        <button className="btn-secondary mobile-menu-item" onClick={() => handleNav("/dashboard")}>
                            Dashboard
                        </button>
                    )}
                    {showHomeBtn && (
                        <button className="btn-secondary mobile-menu-item" onClick={() => handleNav("/app")}>
                            Home
                        </button>
                    )}
                    {!isLoggedIn && showNavLinks && (
                        <button
                            className="btn-primary mobile-menu-item"
                            style={{ textAlign: 'center', width: '100%' }}
                            onClick={() => handleNav("/login")}
                        >
                            Login
                        </button>
                    )}
                    <div className="mobile-menu-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Theme</span>
                        <ThemeToggle />
                    </div>
                    {shouldShowLogout && (
                        <div className="mobile-menu-item">
                            <LogoutButton />
                        </div>
                    )}
                </div>
            )}
        </header>
    );
}
