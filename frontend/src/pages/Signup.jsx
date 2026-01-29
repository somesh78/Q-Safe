import {useState} from 'react';
import API from '../services/api.js';
export default function Signup() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSignup = async (e) => {
        try{
            await API.post(
                `/signup/`,
                {
                    username,
                    password
                }
            );
            window.location.href = '/login';
        } catch (error) {
            console.error("Signup failed", error);
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