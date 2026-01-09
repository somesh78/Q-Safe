import Home from "./pages/Home.jsx";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import Reconstruct from "./pages/Reconstruct.jsx";
import OnlineDownload from "./pages/OnlineDownload.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/reconstruct" element={<Reconstruct />} />
        <Route path="/download/:token" element={<OnlineDownload />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;