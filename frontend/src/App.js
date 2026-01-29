import { useState } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";

import Home from "./pages/Home.jsx";
import Reconstruct from "./pages/Reconstruct.jsx";
import OnlineDownload from "./pages/OnlineDownload.jsx";
import Audit from "./pages/Audit.jsx";
import Login from "./pages/Login.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import Signup from "./pages/Signup.jsx";

function App() {
  const [logged, setLogged] = useState(!!localStorage.getItem("access"));

  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/login"
          element={<Login onLogin={() => setLogged(true)} />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

        {logged ? (
          <>
            <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
            <Route path="/reconstruct" element={<PrivateRoute><Reconstruct /></PrivateRoute>} />
            <Route path="/download/:token" element={<OnlineDownload />} />
            <Route path="/audit" element={<PrivateRoute><Audit /></PrivateRoute>} />

          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}

      </Routes>
    </BrowserRouter>
  );
}

export default App;
