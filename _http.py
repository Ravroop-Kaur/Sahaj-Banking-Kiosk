"""Tiny stdlib HTTP helper so the voice adapters need no extra dependency and are easy to test."""
from __future__ import annotations

import io
import uuid
from dataclasses import dataclass
from urllib import error as urlerror, request as urlrequest


class NetworkError(Exception):
    """Connection failure or timeout (no usable HTTP response)."""


@dataclass(frozen=True)
class HttpResponse:
    status: int
    body: bytes
    content_type: str = ""


def post(url, data, headers, timeout):
    headers = {"User-Agent": "SahajKiosk/1.0", **headers}  # default Python-urllib UA is rejected (HTTP 403) by the Gnani gateway
    req = urlrequest.Request(url, data=data, headers=headers, method="POST")
    try:
        with urlrequest.urlopen(req, timeout=timeout) as resp:
            return HttpResponse(resp.status, resp.read(16 * 1024 * 1024), resp.headers.get("Content-Type", ""))
    except urlerror.HTTPError as exc:
        try:
            body = exc.read(1024 * 1024)
        except Exception:
            body = b""
        return HttpResponse(exc.code, body, exc.headers.get("Content-Type", "") if exc.headers else "")
    except (urlerror.URLError, TimeoutError, OSError) as exc:
        raise NetworkError(type(exc).__name__) from exc


def multipart(fields, file_field, filename, file_bytes, content_type):
    boundary = uuid.uuid4().hex
    out = io.BytesIO()
    for name, value in fields.items():
        out.write(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode("utf-8"))
    out.write(f'--{boundary}\r\nContent-Disposition: form-data; name="{file_field}"; filename="{filename}"\r\nContent-Type: {content_type}\r\n\r\n'.encode("utf-8"))
    out.write(file_bytes)
    out.write(f"\r\n--{boundary}--\r\n".encode("utf-8"))
    return out.getvalue(), f"multipart/form-data; boundary={boundary}"
