import {useState} from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api.js';

function validatePassword(pwd) {
  return (
    pwd.length >= 8 &&
    /[A-Z]/.test(pwd) &&
    /[0-9]/.test(pwd) &&
    /[^A-Za-z0-9]/.test(pwd)
  );
}

export default function Signup() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        if (!validatePassword(password)) {
            alert("Password must be 8+ chars with uppercase, number & symbol");
            return;
        }

        try{
            // Create account
            await API.post(
                `/signup/`,
                {
                    username,
                    password
                }
            );

            // Auto-login after successful signup
            const tokenRes = await API.post('/token/', {
                username,
                password,
            });

            localStorage.setItem('access', tokenRes.data.access);
            localStorage.setItem('refresh', tokenRes.data.refresh);

            navigate('/');
        } catch (error) {
            console.error("Signup failed", error);
            alert(error.response?.data?.error || "Signup failed. Please try again.");
        }
    }

     return (
    <div style={{ padding: 40 }}>
      <h2>Signup</h2>
      <input placeholder="Username" onChange={e=>setUsername(e.target.value)} />
      <input type="password" placeholder="Password" onChange={e=>setPassword(e.target.value)} />
      <button onClick={handleSignup}>Signup</button>
    </div>
  );
}