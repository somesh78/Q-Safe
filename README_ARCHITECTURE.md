# Q-Safe Project Architecture & Context Document

This document serves as a comprehensive reference guide to the Q-Safe platform, cataloguing the technology stack, architectural decisions, recent optimizations, and implemented features as of the current milestone. It is designed to aid incoming developers or AI assistants in understanding the established workflows.

## 1. Project Overview & Core Mission
Q-Safe is a secure, Peer-to-Peer (P2P) file transfer web application that prioritizes zero-knowledge privacy. It allows users to share files over LAN or the internet using WebRTC. It supports both **Online** (cloud-relayed via Supabase) and **Offline P2P** (direct device-to-device via QR and WebRTC) transfer modes.

---

## 2. Technology Stack
### Frontend
*   **Framework**: React.js 
*   **Core Logic**: WebRTC (`RTCPeerConnection`, `RTCDataChannel`)
*   **Security**: Browser-native Crypto API (AES-GCM 256-bit encryption for payloads)
*   **State / Routing**: React hooks, React Router
*   **Dependency Management**: `npm` (run with `--legacy-peer-deps` due to historical version trees)

### Backend
*   **Framework**: Django & Django REST Framework (DRF)
*   **Realtime/Signaling**: Django Channels (AsyncWebsocketConsumer)
*   **Task Queue / Background Jobs**: Celery + Celery Beat + Redis
*   **Database**: PostgreSQL (production via `DATABASE_URL`) / SQLite (local fallback)
*   **Cloud Storage**: Supabase (utilizes the `service_role` key to securely write/delete `ONLINE` mode payloads)

### Infrastructure & Deployment
*   **Target Environment**: AWS EC2 (Mumbai `ap-south-1` region) — heavily optimized for smaller instances (~1GB RAM constraints)
*   **Containerization**: Multi-container Docker (web, redis, celerybeat) orchestrated by `docker-compose.yml`
*   **Reverse Proxy**: Nginx (handling SSL/TLS port 443 mapping securely to internal Docker `web:8000`)
*   **Network Traversal**: Self-hosted `coturn` server located on the Mumbai instance (IP: `3.110.107.233`) handles STUN/TURN ICE candidate negotiation, bypassing external reliance on Metered.ca.

---

## 3. Key Implemented Features

### WebRTC P2P Transfer (Offline Mode)
*   **Signaling Strategy**: WebSockets (`/ws/p2p/{roomId}/`) handled by Django Channels act solely to relay SDP offers/answers and ICE candidates. **The server never touches the actual file data.**
*   **Dynamic TURN Credentials**: Implemented an ephemeral TURN credential API (`/api/turn-credentials/`). The frontend requests these dynamically before connection, which relies on HMAC-SHA1 hashes and the `TURN_SECRET`. This removed highly insecure hardcoded plain-text credentials from the frontend bundle.
*   **Memory Leak Mitigations**: Strict React `useEffect` teardown logic exists in `P2PSend.jsx` to forcefully close all datachannels, clear callbacks, and destroy `RTCPeerConnections` when connections fail, complete, or unmount.
*   **Chunk Profile Tuning (Congestion Control)**: WebRTC data channels chunk large files based on network detection:
    *   **LAN Setup**: 256KB chunks using 4 parallel channels for high-throughput local links.
    *   **Internet/Relay Setup**: 64KB chunks utilizing 1 channel to prevent aggressive data bottlenecks on weaker NAT environments or TURN relays.
*   **Finalization Syncing**: Implemented a 30-second receiver polling safety net during the WebRTC `transfer_complete` phase to prevent race conditions where signaling disconnected before the final byte chunk arrived.

### Online Mode (Cloud Storage)
*   **Resource Guarding**: EC2 out-of-memory (OOM) crashes are prevented by a hard **100MB limit** for Online cloud-relayed files (`ONLINE_MAX_FILE_SIZE_MB`). Validated simultaneously via DRF APIs (`views.py`) and UI notifications.
*   **Background Maintenance**: A Celery Beat scheduled task (`cleanup_expired_files`) executes every 6 hours behind the scenes. It purges expired records from the Django database and directly deletes the encrypted blobs from Supabase via the master service key.

### Security Enhancements
*   **Signaling Authentication**: Django WebSocket consumers demand active JWT tokens supplied within query parameters (`?token=...`) allowing internal handshakes. Unauthenticated spoofers are instantly dropped.
*   **IP-Lock Bypassing Fixed**: Removed flawed logic that tied download caps to IP locks, streamlining secure file downloads.
*   **Env Extraction**: High risk secrets (Supabase Role Keys, TURN Secrets) are strictly isolated in `.env` handled by `python-decouple`. 

### Django / Static Files 
*   **Whitenoise**: `STATIC_URL` and `WHITENOISE_ROOT` are appropriately configured in the Django `settings.py` so the React built static assets act symbiotically alongside native Django Admin dashboards without URL collisions in production.

---

## 4. Pending technical debt / Future areas of interest
*   **File Streaming Logic**: The WebRTC pipeline currently buffers the entire payload into RAM (`fileReader.arrayBuffer()`), which remains a high-risk vector on low-resource machines for multi-gigabyte transfers. This requires an eventual refactor to a disk-based or streaming approach.
*   **Container CI/CD**: You may encounter `DisallowedHost` errors or ESLint plugin crashes during build execution in AWS. We typically resolve these by ensuring adequate EC2 storage overhead, flushing unused docker imagery (`docker system prune`), bypassing git configuration locks when testing deployment, and ensuring internal Nginx traffic targets `http://web:8000` via the Compose network instead of loopbacks.
