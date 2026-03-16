import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger(__name__)


class P2PSignalingConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for WebRTC P2P signaling.
    Relays SDP offers/answers and ICE candidates between sender and receiver.
    The server never sees file data — only signaling metadata.
    """

    async def connect(self):
        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.room_group = f"p2p_{self.room_id}"
        try:
            await self.channel_layer.group_add(self.room_group, self.channel_name)
            await self.accept()
            logger.info(f"[P2P] Peer connected to room {self.room_id}")
        except Exception:
            logger.exception(f"[P2P] Failed to accept websocket for room {self.room_id}")
            await self.close(code=1011)

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group, self.channel_name)
        # Notify the other peer so it can update UI
        await self.channel_layer.group_send(
            self.room_group,
            {
                "type": "relay_message",
                "data": {"type": "peer_disconnected"},
                "sender": self.channel_name,
            },
        )
        logger.info(f"[P2P] Peer disconnected from room {self.room_id}")

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
                "sender": self.channel_name,
            },
        )

    async def relay_message(self, event):
        # Only relay to the other peer, not back to sender
        if event["sender"] != self.channel_name:
            await self.send(text_data=json.dumps(event["data"]))
