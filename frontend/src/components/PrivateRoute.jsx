import { Navigate, Outlet, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function isTokenValid() {
  const token = localStorage.getItem("access");
  
  if (!token) return false;

  try {
    const { exp } = jwtDecode(token);
    
    // Check if token is expired (exp is in seconds, Date.now() is in milliseconds)
    if (Date.now() >= exp * 1000) {
      localStorage.clear(); // Clear expired tokens
      return false;
    }
    
    return true;
  } catch (error) {
    // Invalid token format
    localStorage.clear();
    return false;
  }
}

export default function PrivateRoute({ children }) {
  const location = useLocation();

    if (!isTokenValid()) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children ? children : <Outlet />;
}