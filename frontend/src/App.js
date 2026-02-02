import { BrowserRouter, Route, Routes } from "react-router-dom";

import Home from "./pages/Home.jsx";
import Reconstruct from "./pages/Reconstruct.jsx";
import OnlineDownload from "./pages/OnlineDownload.jsx";
import Audit from "./pages/Audit.jsx";
import Login from "./pages/Login.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";


function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>

          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/download/:token" element={<OnlineDownload />} />

          {/* Protected */}
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/audit" element={<Audit />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/reconstruct" element={<Reconstruct />} />
          </Route>

        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
