"""Start locally and open the browser only after Uvicorn is ready."""
import json
import socket
import sys
import threading
import urllib.request
import webbrowser

URL = "http://127.0.0.1:8766"


def open_existing():
    try:
        with socket.create_connection(("127.0.0.1", 8766), timeout=1):
            pass
    except ConnectionRefusedError:
        return 1
    except OSError:
        return 2
    try:
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        with opener.open(URL + "/openapi.json", timeout=3) as response:
            schema = json.load(response)
        if schema.get("info", {}).get("title") == "Banking Assistance Kiosk MVP" and "/api/kiosk/start" in schema.get("paths", {}):
            print("Sahaj is already running. Opening " + URL)
            webbrowser.open(URL)
            return 0
    except (OSError, ValueError):
        pass
    print("Port 8766 is occupied. Could not verify a running Sahaj server.")
    return 2


def main():
    existing = open_existing()
    if existing != 1:
        return existing
    import uvicorn
    server = uvicorn.Server(uvicorn.Config("main:app", host="127.0.0.1", port=8766, use_colors=False))
    done = threading.Event()

    def open_when_ready():
        while not done.wait(0.2):
            if server.started:
                webbrowser.open("http://127.0.0.1:8766")
                return

    opener = threading.Thread(target=open_when_ready, daemon=True)
    opener.start()
    try:
        server.run()
    finally:
        done.set()


if __name__ == "__main__":
    sys.exit(open_existing() if "--open-existing" in sys.argv else main())
