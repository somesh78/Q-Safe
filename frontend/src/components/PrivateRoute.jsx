import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const token = !!localStorage.getItem("access");
  const location = useLocation();

    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children ? children : <Outlet />;
}