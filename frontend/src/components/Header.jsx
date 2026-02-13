
import { useNavigate } from "react-router-dom";
import LogoutButton from "./LogoutButton";
import ThemeToggle from "./ThemeToggle";
import '../App.css';

export default function Header({ showLogout = true, showDashboardBtn = false, showHomeBtn = false }) {
    const navigate = useNavigate();

    return (
        <header className="app-header">
            <div className="brand" onClick={() => navigate(localStorage.getItem('access') ? "/app" : "/")}>
                Q-Safe
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
