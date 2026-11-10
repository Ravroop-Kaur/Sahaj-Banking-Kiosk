"""Tests for the Gemini Live message adapter. Run: python -m pytest test_live_protocol.py (or python -m unittest)."""
import json
import unittest

import live_protocol as lp

AUDIO = json.dumps({"realtimeInput": {"audio": {"mimeType": "audio/pcm;rate=16000", "data": "AAAA"}}}, separators=(",", ":"))
GREETING = json.dumps({"clientContent": {"turns": [{"role": "user", "parts": [{"text": "Greet the customer."}]}], "turnComplete": True}})
APP_EVENT = json.dumps({"clientContent": {"turns": [{"role": "user", "parts": [{"text": "APP EVENT: Say this exactly once. Sentence: How much would you like to withdraw?"}]}], "turnComplete": True}})


class ModelFamilies(unittest.TestCase):
    def test_native_audio_family_allows_mid_session_client_content(self):
        self.assertTrue(lp.accepts_mid_session_client_content("gemini-2.5-flash-native-audio-preview-12-2025"))
        self.assertTrue(lp.accepts_mid_session_client_content("models/gemini-2.5-flash-native-audio-preview-12-2025"))

    def test_gemini_3_live_models_do_not(self):
        for name in ("gemini-3.8-live", "gemini-3.1-flash-live-preview", "models/gemini-3.8-live"):
            self.assertFalse(lp.accepts_mid_session_client_content(name), name)


class Adapt(unittest.TestCase):
    def test_greeting_is_forwarded_unchanged(self):
        frame, kind = lp.adapt_client_frame(GREETING, "gemini-3.8-live", is_first_after_setup=True)
        self.assertEqual(frame, GREETING)
        self.assertEqual(kind, "clientContent")

    def test_mid_session_text_turn_becomes_realtime_text_on_gemini_3(self):
        frame, kind = lp.adapt_client_frame(APP_EVENT, "gemini-3.8-live", is_first_after_setup=False)
        payload = json.loads(frame)
        self.assertEqual(set(payload), {"realtimeInput"})
        self.assertEqual(set(payload["realtimeInput"]), {"text"})
        self.assertIn("How much would you like to withdraw?", payload["realtimeInput"]["text"])
        self.assertEqual(kind, "clientContent->realtimeInput.text")

    def test_unicode_survives_conversion(self):
        hindi = json.dumps({"clientContent": {"turns": [{"role": "user", "parts": [{"text": "कितनी राशि निकालनी है?"}]}], "turnComplete": True}}, ensure_ascii=False)
        frame, _ = lp.adapt_client_frame(hindi, "gemini-3.1-flash-live-preview", False)
        self.assertEqual(json.loads(frame)["realtimeInput"]["text"], "कितनी राशि निकालनी है?")

    def test_legacy_model_keeps_client_content(self):
        frame, kind = lp.adapt_client_frame(APP_EVENT, "gemini-2.5-flash-native-audio-preview-12-2025", False)
        self.assertEqual(frame, APP_EVENT)
        self.assertEqual(kind, "clientContent")

    def test_audio_is_never_touched(self):
        frame, kind = lp.adapt_client_frame(AUDIO, "gemini-3.8-live", False)
        self.assertEqual(frame, AUDIO)
        self.assertEqual(kind, "audio")

    def test_audio_without_compact_json_is_still_audio(self):
        spaced = json.dumps({"realtimeInput": {"audio": {"mimeType": "audio/pcm;rate=16000", "data": "AA"}}})
        self.assertEqual(lp.adapt_client_frame(spaced, "gemini-3.8-live", False), (spaced, "audio"))

    def test_realtime_text_already_in_the_right_shape_is_untouched(self):
        raw = json.dumps({"realtimeInput": {"text": "hi"}})
        self.assertEqual(lp.adapt_client_frame(raw, "gemini-3.8-live", False), (raw, "realtimeInput.text"))

    def test_client_content_without_text_is_not_dropped(self):
        raw = json.dumps({"clientContent": {"turns": [{"role": "user", "parts": []}], "turnComplete": True}})
        self.assertEqual(lp.adapt_client_frame(raw, "gemini-3.8-live", False)[0], raw)

    def test_garbage_does_not_raise(self):
        for raw in ("not json", "[]", "null", "", '{"clientContent": 5}'):
            frame, _ = lp.adapt_client_frame(raw, "gemini-3.8-live", False)
            self.assertIsInstance(frame, str)

    def test_multi_part_turns_are_joined(self):
        raw = json.dumps({"clientContent": {"turns": [{"role": "user", "parts": [{"text": "one"}, {"text": "two"}]}], "turnComplete": True}})
        frame, _ = lp.adapt_client_frame(raw, "gemini-3.8-live", False)
        self.assertEqual(json.loads(frame)["realtimeInput"]["text"], "one\ntwo")


class Diagnostics(unittest.TestCase):
    def test_describe_close_lists_recent_kinds(self):
        line = lp.describe_close(1007, "invalid argument", ["clientContent", "realtimeInput.text"])
        self.assertIn("1007", line)
        self.assertIn("clientContent, realtimeInput.text", line)

    def test_describe_close_with_nothing_sent(self):
        self.assertIn("nothing", lp.describe_close(1011, "", []))


if __name__ == "__main__":
    unittest.main()
