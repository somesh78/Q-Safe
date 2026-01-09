import { useParams } from "react-router-dom";
import { useState } from "react";
import axios from "axios";

export default function OnlineDownload() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (!password) {
      alert("Enter password");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `http://localhost:8000/api/download/${token}/`,
        { password },
        { responseType: "blob" }
      );

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "file";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      window.URL.revokeObjectURL(url);
    } catch {
      alert("Wrong password or link expired");
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 30 }}>
      <h2>Secure File Download</h2>
      <input
        type="password"
        placeholder="Enter password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <br /><br />
      <button onClick={handleDownload}>
        {loading ? "Decrypting..." : "Download File"}
      </button>
    </div>
  );
}
