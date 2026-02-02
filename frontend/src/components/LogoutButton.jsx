import { logoutUser } from "../services/api";

export default function LogoutButton() {
  const handleLogout = async () => {
    const refresh = localStorage.getItem("refresh");

    try {
      await logoutUser(refresh);
    } catch {}

    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <button onClick={handleLogout}>
      Logout
    </button>
  );
}
