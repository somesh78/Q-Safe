import json
import logging
import uuid
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

logger = logging.getLogger(__name__)


class P2PSignalingConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for WebRTC P2P signaling.
    Relays SDP offers/answers and ICE candidates between sender and receiver.
    The server never sees file data — only signaling metadata.
    """

    async def connect(self):
        token = self._get_token_from_scope()
        # We perform authentication but DO NOT close on failure.
        # Anonymous receivers connecting via external links/QR codes will not have
        # an auth token. The room_id (UUID) and E2E encryption hash provide security.
        self.is_authenticated = await self.authenticate(token)
        if not self.is_authenticated:
            logger.info(f"[P2P] Anonymous connection to room")

        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.room_group = f"p2p_{self.room_id}"
        # Stable per-connection id used by clients for directed signaling.
        self.peer_id = uuid.uuid4().hex
        try:
            await self.channel_layer.group_add(self.room_group, self.channel_name)
            await self.accept()
            
            # Send initial peer ID to the newly connected peer.
            await self.send(text_data=json.dumps({
                "type": "peer_id",
                "peer_id": self.peer_id,
            }))
            
            # Broadcast join event to the room group so sender begins handshake.
            await self.channel_layer.group_send(
                self.room_group,
                {
                    "type": "relay_message",
                    "data": {
                        "type": "receiver_joined",
                    },
                    "sender": self.peer_id,
                },
            )
            
            logger.info(f"[P2P] Peer {self.peer_id} connected to room {self.room_id}")
        except Exception:
            logger.exception(f"[P2P] Failed to accept websocket for room {self.room_id}")
            await self.close(code=1011)

    async def disconnect(self, close_code):
        # Guard: room_group is only set if connect() authenticated and succeeded.
        # If auth failed, connect() called self.close() early and room_group was
        # never assigned — accessing it here would raise AttributeError.
        if not hasattr(self, "room_group"):
            return
        try:
            await self.channel_layer.group_discard(self.room_group, self.channel_name)
            # Notify the other peer so it can update UI
            await self.channel_layer.group_send(
                self.room_group,
                {
                    "type": "relay_message",
                    "data": {"type": "peer_disconnected"},
                    "sender": self.peer_id,
                },
            )
        except Exception:
            pass  # channel layer may already be gone
        logger.info(f"[P2P] Peer disconnected from room {getattr(self, 'room_id', '?')}")

    async def receive(self, text_data=None, bytes_data=None):
        if text_data is None:
            return
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            logger.warning(f"[P2P] Invalid JSON in room {self.room_id}")
            return

        await self.channel_layer.group_send(
            self.room_group,
            {
                "type": "relay_message",
                "data": data,
                "sender": self.peer_id,
                "to": data.get("to"),
            },
        )

    async def relay_message(self, event):
        # Never relay back to sender.
        if event["sender"] == self.peer_id:
            return

        # Directed signaling: only forward to target peer when provided.
        target_peer = event.get("to")
        if target_peer and target_peer != self.peer_id:
            return

        payload = dict(event["data"])
        payload["from"] = event["sender"]
        await self.send(text_data=json.dumps(payload))

    def _get_token_from_scope(self):
        query = dict(
            x.split('=') for x in 
            self.scope['query_string'].decode().split('&') 
            if '=' in x
        )
        return query.get('token', '')

    @database_sync_to_async
    def authenticate(self, token):
        from rest_framework_simplejwt.tokens import AccessToken
        try:
            AccessToken(token)
            return True
        except Exception:
            return False
