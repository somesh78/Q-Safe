export default function ModeSelector({ onSelect }) {
    return (
        <div style={{ marginBottom: '20px' }}>
            <button onClick={() => onSelect("ONLINE")}>Online Secure QR</button>
            <button onClick={() => onSelect("OFFLINE")}>Offline Multi-QR</button>
        </div>
    );
}