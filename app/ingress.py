"""Enforce API ingress limits before JSON or multipart parsing."""
from urllib.parse import urlsplit

from starlette.datastructures import Headers
from starlette.responses import JSONResponse

IMAGE_ROUTES = {"/api/kiosk/scan", "/api/documents/classify", "/api/documents/extract", "/api/ocr/passbook"}


class KioskIngress:
    def __init__(self, app, audio_limit):
        self.app = app
        self.audio_limit = audio_limit

    async def __call__(self, scope, receive, send):
        websocket = scope["type"] == "websocket"
        if not websocket and (scope["type"] != "http" or scope["method"] != "POST"):
            return await self.app(scope, receive, send)
        headers = Headers(scope=scope)
        origin = headers.get("origin")
        if origin:
            try:
                parsed = urlsplit(origin)
                scheme = {"ws":"http", "wss":"https"}.get(scope["scheme"], scope["scheme"])
                same_origin = parsed.scheme == scheme and parsed.netloc.lower() == headers.get("host", "").lower()
            except ValueError:
                same_origin = False
            if not same_origin:
                if websocket:
                    return await send({"type": "websocket.close", "code": 1008})
                return await JSONResponse({"detail": "Unexpected request origin."}, 403)(scope, receive, send)
        if websocket:
            return await self.app(scope, receive, send)

        path = scope["path"].rstrip("/")
        limit = 64 * 1024
        if path in IMAGE_ROUTES:
            limit = 9 * 1024 * 1024  # 8 MiB image plus multipart framing
        elif path == "/api/voice/transcribe":
            limit = self.audio_limit
        too_large = JSONResponse({"detail": "Request body exceeds the allowed size."}, 413)
        try:
            if int(headers.get("content-length", "0")) > limit:
                return await too_large(scope, receive, send)
        except ValueError:
            return await JSONResponse({"detail": "Invalid content length."}, 400)(scope, receive, send)

        body = bytearray()
        while True:
            message = await receive()
            if message["type"] == "http.disconnect":
                return
            chunk = message.get("body", b"")
            if len(body) + len(chunk) > limit:
                return await too_large(scope, receive, send)
            body.extend(chunk)
            if not message.get("more_body"):
                break

        async def replay():
            nonlocal body
            if body is None:
                return await receive()
            data, body = bytes(body), None
            return {"type": "http.request", "body": data, "more_body": False}

        await self.app(scope, replay, send)
