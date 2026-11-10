"""Start locally and open the browser only after Uvicorn is ready."""
import threading
import webbrowser

import uvicorn


def main():
    server = uvicorn.Server(uvicorn.Config("main:app", host="127.0.0.1", port=8766))
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
    main()
