"""A publicly hosted kiosk may only clear the caller's unguessable session."""
from fastapi.testclient import TestClient

import main


def test_clear_requires_exact_session_id_and_does_not_wipe_others():
    client = TestClient(main.app)
    one = client.post("/api/session/start", json={"language": "hi"}).json()["session_id"]
    two = client.post("/api/session/start", json={"language": "pa"}).json()["session_id"]
    assert client.post("/api/session/clear").status_code == 422
    assert client.post("/api/session/clear", json={"session_id": ""}).status_code == 422
    assert client.post("/api/session/clear", json={"session_id": one}).status_code == 200
    assert client.post("/api/session/clear", json={"session_id": one}).status_code == 404
    assert client.post("/api/consent", json={"session_id": two, "purpose": "data_collection", "granted": True}).status_code == 200
    assert client.post("/api/session/clear", json={"session_id": two}).status_code == 200
