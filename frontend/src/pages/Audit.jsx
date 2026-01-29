// import { useEffect, useState } from "react";
// import {getAuditLogs} from "../api/auditApi.jsx";

// export default function Audit() {
//     const [logs, setLogs] = useState([]);

//     useEffect(() => {
//         loadLogs();
//     }, []);

//     const loadLogs = async () => {
//         try{
//             const res = await getAuditLogs();
//             setLogs(res.data);
//         }
//         catch (err){
//             console.error("Failed to fetch audit logs:", err);
//         }
//     };

//      return (
//     <div style={{ padding: 20 }}>
//       <h2>Download Audit Logs</h2>

//       <table border="1" cellPadding="8">
//         <thead>
//           <tr>
//             <th>File</th>
//             <th>IP</th>
//             <th>Status</th>
//             <th>Reason</th>
//             <th>Time</th>
//           </tr>
//         </thead>
//         <tbody>
//           {logs.map((log, i) => (
//             <tr key={i}>
//               <td>{log.file_name}</td>
//               <td>{log.ip_address}</td>
//               <td>{log.status}</td>
//               <td>{log.reason}</td>
//               <td>{log.timestamp}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }