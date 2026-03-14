from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/p2p/(?P<room_id>[0-9a-f\-]+)/$", consumers.P2PSignalingConsumer.as_asgi()),
]
