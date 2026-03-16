
import { logoutUser } from "../services/api";
import '../App.css';

export default function LogoutButton() {
  const handleLogout = async () => {
    const refresh = localStorage.getItem("refresh");

    // Only call the API if we actually have a token to blacklist
    if (refresh) {
      try {
        await logoutUser(refresh);
      } catch { }
    }

    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <button className="btn-secondary" onClick={handleLogout} style={{ borderColor: 'var(--error)', color: 'var(--error)' }}>
      Logout
    </button>
  );
}

