
import { useNavigate } from "react-router-dom";
import LogoutButton from "./LogoutButton";
import ThemeToggle from "./ThemeToggle";
import '../App.css';

export default function Header({ showLogout = true, showDashboardBtn = false, showHomeBtn = false }) {
    const navigate = useNavigate();

    return (
        <header className="app-header">
            <div className="brand" onClick={() => navigate(localStorage.getItem('access') ? "/app" : "/")} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <img 
                    src="/logo.png" 
                    alt="Q-Safe Logo" 
                    style={{ 
                        height: '36px', 
                        width: 'auto',
                        filter: 'drop-shadow(0 0 8px rgba(0, 212, 255, 0.3))'
                    }}
                />
                <span style={{ fontWeight: '800', fontSize: '1.5rem', fontFamily: 'var(--font-display)' }}>Q-Safe</span>
            </div>
            <div className="nav-actions">
                {showDashboardBtn && (
                    <button className="btn-secondary" onClick={() => navigate("/dashboard")}>
                        Dashboard
                    </button>
                )}
                {showHomeBtn && (
                    <button className="btn-secondary" onClick={() => navigate("/app")}>
                        Home
                    </button>
                )}
                <ThemeToggle />
                {showLogout && <LogoutButton />}
            </div>
        </header>
    );
}
