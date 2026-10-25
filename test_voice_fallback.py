"""Tests for the server-side voice fallback. Run: python -m pytest test_voice_fallback.py (or python -m unittest)."""
import io
import json
import struct
import unittest
from unittest import mock

import voice_fallback as vf


def make_wav(seconds=0.5, rate=16000):
    n = int(seconds * rate)
    pcm = struct.pack("<" + "h" * n, *([1000] * n))
    header = (b"RIFF" + struct.pack("<I", 36 + len(pcm)) + b"WAVEfmt " + struct.pack("<IHHIIHH", 16, 1, 1, rate, rate * 2, 2, 16)
              + b"data" + struct.pack("<I", len(pcm)))
    return header + pcm


class TranscribeChain(unittest.TestCase):
    def setUp(self):
        self.env = mock.patch.dict("os.environ", {}, clear=True)
        self.env.start()

    def tearDown(self):
        self.env.stop()

    def test_wav_detection(self):
        self.assertTrue(vf.looks_like_wav(make_wav()))
        self.assertFalse(vf.looks_like_wav(b"not audio at all" * 10))

    def test_no_engines_configured(self):
        with mock.patch.object(vf, "local_whisper_available", return_value=False):
            out = vf.transcribe(make_wav())
        self.assertEqual(out["text"], "")
        self.assertIsNone(out["engine"])
        self.assertFalse(vf.status()["server_stt_available"])

    def test_gemini_used_first(self):
        with mock.patch.dict("os.environ", {"GEMINI_API_KEY": "k"}), \
             mock.patch.object(vf, "_post_json", return_value={"candidates": [{"content": {"parts": [{"text": " मुझे पांच हजार निकालने हैं \n"}]}}]}) as post:
            out = vf.transcribe(make_wav(), "hi")
        self.assertEqual(out["engine"], "gemini")
        self.assertEqual(out["text"], "मुझे पांच हजार निकालने हैं")
        sent = post.call_args[0][1]["contents"][0]["parts"]
        self.assertEqual(sent[1]["inlineData"]["mimeType"], "audio/wav")

    def test_falls_through_when_gemini_down(self):
        env = {"GEMINI_API_KEY": "k", "GROQ_API_KEY": "g"}
        with mock.patch.dict("os.environ", env), \
             mock.patch.object(vf, "_post_json", side_effect=OSError("down")), \
             mock.patch.object(vf, "_http", return_value={"text": "withdraw two thousand rupees"}):
            out = vf.transcribe(make_wav(), "en")
        self.assertEqual(out["engine"], "whisper-api")
        self.assertEqual(out["text"], "withdraw two thousand rupees")
        self.assertIn("gemini: OSError", out["errors"])

    def test_deepgram_parses_and_uses_token_auth(self):
        dg = {"results": {"channels": [{"alternatives": [{"transcript": "मुझे पैसे निकालने हैं"}]}]}}
        with mock.patch.dict("os.environ", {"DEEPGRAM_API_KEY": "dg"}), \
             mock.patch.object(vf, "_http", return_value=dg) as http:
            out = vf.transcribe(make_wav(), "hi")
        self.assertEqual(out["engine"], "deepgram")
        self.assertEqual(out["text"], "मुझे पैसे निकालने हैं")
        req = http.call_args[0][0]
        self.assertEqual(req.get_header("Authorization"), "Token dg")
        self.assertIn("language=hi", req.full_url)

    def test_order_can_be_overridden(self):
        with mock.patch.dict("os.environ", {"VOICE_STT_ORDER": "deepgram,bogus"}):
            names = [n for n, _ in vf.stt_engines()]
        self.assertEqual(names[0], "deepgram")
        self.assertEqual(sorted(names), sorted(["gemini", "deepgram", "whisper-api", "whisper-local"]))

    def test_all_engines_fail_without_raising(self):
        env = {"GEMINI_API_KEY": "k", "OPENAI_API_KEY": "o"}
        with mock.patch.dict("os.environ", env), \
             mock.patch.object(vf, "_post_json", side_effect=OSError("down")), \
             mock.patch.object(vf, "_http", side_effect=OSError("down")), \
             mock.patch.object(vf, "local_whisper_available", return_value=False):
            out = vf.transcribe(make_wav())
        self.assertEqual(out["text"], "")
        self.assertIsNone(out["engine"])
        self.assertEqual(len(out["errors"]), 2)

    def test_silence_marker_becomes_empty(self):
        for marker in ["[silence]", "No speech", "(inaudible)", ""]:
            self.assertEqual(vf._clean_transcript(marker), "")

    def test_multipart_contains_audio_and_fields(self):
        body, ctype = vf._multipart({"model": "m"}, "clip.wav", b"AUDIO", "audio/wav")
        self.assertIn("boundary=", ctype)
        self.assertIn(b'name="model"', body)
        self.assertIn(b"AUDIO", body)


class ChatChain(unittest.TestCase):
    def test_second_engine_used_when_first_fails(self):
        env = {"GEMINI_API_KEY": "k", "GROQ_API_KEY": "g"}
        reply = {"choices": [{"message": {"content": json.dumps({"intent": "deposit"})}}]}
        with mock.patch.dict("os.environ", env, clear=True), \
             mock.patch.object(vf, "_post_json", side_effect=[OSError("down"), reply]):
            self.assertEqual(vf.chat_json("sys", "user"), {"intent": "deposit"})

    def test_none_when_nothing_configured(self):
        with mock.patch.dict("os.environ", {}, clear=True):
            self.assertIsNone(vf.chat_json("s", "u"))


try:
    from fastapi.testclient import TestClient
    import main
except Exception:  # fastapi not installed in this environment
    TestClient = None


@unittest.skipIf(TestClient is None, "fastapi not installed")
class Endpoints(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(main.app)

    def test_status(self):
        self.assertIn("server_stt_available", self.client.get("/api/voice/fallback").json())

    def test_rejects_non_wav_and_empty(self):
        self.assertEqual(self.client.post("/api/voice/transcribe", content=b"").status_code, 400)
        self.assertEqual(self.client.post("/api/voice/transcribe", content=b"x" * 100).status_code, 415)

    def test_transcribe_returns_engine_result(self):
        with mock.patch.object(vf, "transcribe", return_value={"text": "hello", "engine": "stub", "errors": []}):
            r = self.client.post("/api/voice/transcribe?language=en", content=make_wav())
        self.assertEqual(r.json()["text"], "hello")

    def test_intent_uses_fallback_llm_when_gemini_down(self):
        model_json = {"intent": "withdrawal", "confidence": "high", "amount": "5000", "transaction": "cash withdrawal", "message": "ok"}
        with mock.patch.object(vf, "chat_json", return_value=model_json):
            r = self.client.post("/api/intent", json={"text": "I need some money", "language": "en"}).json()
        self.assertEqual(r["intent"], "withdrawal")
        self.assertEqual(r["engine"], "llm")

    def test_intent_survives_every_model_being_down(self):
        with mock.patch.object(vf, "chat_json", return_value=None):
            r = self.client.post("/api/intent", json={"text": "mujhe paise nikalne hain 5000 rupaye", "language": "hi"}).json()
        self.assertEqual(r["intent"], "withdrawal")
        self.assertEqual(r["engine"], "fallback")


if __name__ == "__main__":
    unittest.main()
