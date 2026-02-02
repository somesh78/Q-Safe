import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function Audit() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        try{
            const res = await API.get('/audit/');
            setLogs(res.data);
        }
        catch (err){
            console.error("Failed to fetch audit logs:", err);
        } finally {
            setLoading(false);
        }
    };

     return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2>Download Audit Logs</h2>
        <button onClick={() => navigate("/")}>← Back to Home</button>
      </div>

      {loading ? (
        <p>Loading audit logs...</p>
      ) : logs.length === 0 ? (
        <p>No audit logs found.</p>
      ) : (
        <table border="1" cellPadding="8" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>File</th>
              <th>User</th>
              <th>IP</th>
              <th>Status</th>
              <th>Reason</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={i}>
                <td>{log.file_name}</td>
                <td>{log.user || 'Anonymous'}</td>
                <td>{log.ip_address}</td>
                <td style={{ color: log.status === 'SUCCESS' ? 'green' : 'red' }}>
                  {log.status}
                </td>
                <td>{log.reason || '-'}</td>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}