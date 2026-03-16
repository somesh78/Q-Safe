
import { BrowserRouter, Route, Routes } from "react-router-dom";

import Home from "./pages/Home.jsx";
import Reconstruct from "./pages/Reconstruct.jsx";
import OnlineDownload from "./pages/OnlineDownload.jsx";
import Audit from "./pages/Audit.jsx";
import Login from "./pages/Login.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Landing from "./pages/Landing.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { ThemeProvider } from "./context/ThemeContext";

// Footer pages
import Features from "./pages/Features.jsx";
import Pricing from "./pages/Pricing.jsx";
import Security from "./pages/Security.jsx";
import About from "./pages/About.jsx";
import Blog from "./pages/Blog.jsx";
import Contact from "./pages/Contact.jsx";
import Privacy from "./pages/Privacy.jsx";
import Terms from "./pages/Terms.jsx";
import Compliance from "./pages/Compliance.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import NotFound from "./pages/NotFound.jsx";
import P2PSend from "./pages/P2PSend.jsx";
import P2PReceive from "./pages/P2PReceive.jsx";

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ThemeProvider>
          <Routes>

            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/download/:token" element={<OnlineDownload />} />
            <Route path="/verify-email/:uid/:token" element={<VerifyEmail />} />
            <Route path="/receive/:roomId" element={<P2PReceive />} />

            {/* Footer Pages - Product */}
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/security" element={<Security />} />

            {/* Footer Pages - Company */}
            <Route path="/about" element={<About />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/contact" element={<Contact />} />

            {/* Footer Pages - Legal */}
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/compliance" element={<Compliance />} />

            {/* Protected */}
            <Route element={<PrivateRoute />}>
              <Route path="/app" element={<Home />} />
              <Route path="/audit" element={<Audit />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/reconstruct" element={<Reconstruct />} />
              <Route path="/send" element={<P2PSend />} />
            </Route>

            {/* 404 Catch-all */}
            <Route path="*" element={<NotFound />} />

          </Routes>
        </ThemeProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
