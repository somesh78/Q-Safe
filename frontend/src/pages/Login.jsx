import {useState} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../services/api.js';


export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        try{
            const res = await API.post(
                `/token/`,
                {
                    username,
                    password
                }
            );
            localStorage.setItem('access', res.data.access);
            localStorage.setItem('refresh', res.data.refresh);

            const from = location.state?.from?.pathname || "/";
            navigate(from, { replace: true });
        } catch (error) {
            console.error("Login failed:", error);
        }
    }

    return (
    <div style={{ padding: 40 }}>
      <h2>Login</h2>

      <input placeholder="Username"
        onChange={e => setUsername(e.target.value)} /><br/><br/>

      <input type="password" placeholder="Password"
        onChange={e => setPassword(e.target.value)} /><br/><br/>

      <button onClick={handleLogin}>Login</button>
      <button onClick={() => navigate('/signup')} style={{ marginLeft: 10 }}>Signup</button>
    </div>
  );
}