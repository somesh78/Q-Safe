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
        `${process.env.REACT_APP_API_URL}/download/${token}/`,
        { password },
        { responseType: "blob" }
      );
      
      let filename = "downloaded_file";

      // read filename from header if available
      const disposition = response.headers["content-disposition"];
      if (disposition && disposition.includes("filename=")) {
        filename = disposition.split("filename=")[1].replace(/"/g, "");
      }
      const blob = new Blob([response.data], { type: response.headers["content-type"] || "application/octet-stream" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
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
