"""Tests for the hosted-server passbook OCR chain. Run: python -m unittest test_passbook_ocr -v"""
import io
import json
import unittest
from unittest import mock
from urllib import error as urlerror

import passbook_ocr as po


def gemini_reply(text):
    body = json.dumps({"candidates": [{"content": {"parts": [{"text": text}]}}]}).encode()
    resp = mock.MagicMock()
    resp.read.return_value = body
    resp.__enter__.return_value = resp
    return resp


def http_error(code):
    return urlerror.HTTPError("http://x", code, "err", {}, io.BytesIO(b'{"error": {"message": "busy"}}'))


class Base(unittest.TestCase):
    def setUp(self):
        self.env = mock.patch.dict("os.environ", {"GEMINI_API_KEY": "k"}, clear=True)
        self.env.start()
        po._CACHE.clear()
        self.sleep = mock.patch.object(po.time, "sleep")
        self.sleep.start()

    def tearDown(self):
        self.env.stop()
        self.sleep.stop()


class GeminiChain(Base):
    def test_retries_transient_503_then_succeeds(self):
        with mock.patch.object(po.urlrequest, "urlopen", side_effect=[http_error(503), gemini_reply("Account Number: 123456789012")]) as op:
            text, engine = po.recognize(b"img1")
        self.assertIn("123456789012", text)
        self.assertEqual(engine, "Gemini vision")
        self.assertEqual(op.call_count, 2)

    def test_falls_to_second_model_after_two_failures(self):
        calls = [http_error(429), http_error(429), gemini_reply("Account Number: 123456789012")]
        with mock.patch.object(po.urlrequest, "urlopen", side_effect=calls) as op:
            text, _ = po.recognize(b"img2")
        self.assertIn("123456789012", text)
        self.assertEqual(op.call_count, 3)

    def test_bad_key_stops_immediately(self):
        with mock.patch.object(po.urlrequest, "urlopen", side_effect=[http_error(403)]) as op:
            with self.assertRaises(RuntimeError):
                po.recognize(b"img3")
        self.assertEqual(op.call_count, 1)

    def test_uncertain_answer_is_not_a_success(self):
        with mock.patch.object(po.urlrequest, "urlopen", side_effect=[gemini_reply("Account Number: UNCERTAIN")] * 5):
            with self.assertRaises(RuntimeError) as ctx:
                po.recognize(b"img4")
        self.assertIn("no account number", str(ctx.exception))

    def test_same_photo_is_served_from_cache(self):
        with mock.patch.object(po.urlrequest, "urlopen", side_effect=[gemini_reply("Account Number: 123456789012")]) as op:
            po.recognize(b"img5")
            text, engine = po.recognize(b"img5")
        self.assertEqual(op.call_count, 1)
        self.assertEqual(engine, "Gemini vision")

    def test_failures_are_not_cached(self):
        with mock.patch.object(po.urlrequest, "urlopen", side_effect=[http_error(403)]):
            with self.assertRaises(RuntimeError):
                po.recognize(b"img6")
        with mock.patch.object(po.urlrequest, "urlopen", side_effect=[gemini_reply("Account Number: 123456789012")]):
            self.assertIn("123456789012", po.recognize(b"img6")[0])


class Orchestration(Base):
    def test_tesseract_used_when_gemini_fails(self):
        with mock.patch.object(po.urlrequest, "urlopen", side_effect=[http_error(403)]), \
             mock.patch.object(po, "tesseract_available", return_value=True), \
             mock.patch.dict(po.ENGINES, {"tesseract": (lambda img, dl: "Account No: 123456789012", "Local Tesseract OCR")}):
            text, engine = po.recognize(b"img7")
        self.assertEqual(engine, "Local Tesseract OCR")

    def test_order_override(self):
        with mock.patch.dict("os.environ", {"OCR_ORDER": "tesseract,gemini"}):
            self.assertEqual(po.engine_order()[:2], ["tesseract", "gemini"])

    def test_not_configured_message(self):
        with mock.patch.dict("os.environ", {}, clear=True), mock.patch.object(po, "tesseract_available", return_value=False):
            with self.assertRaises(RuntimeError) as ctx:
                po.recognize(b"img8")
        self.assertIn("GEMINI_API_KEY", str(ctx.exception))

    def test_deadline_stops_work(self):
        with mock.patch.dict("os.environ", {"GEMINI_API_KEY": "k", "OCR_DEADLINE_SECONDS": "0"}), \
             mock.patch.object(po.urlrequest, "urlopen") as op:
            with self.assertRaises(RuntimeError):
                po.recognize(b"img9")
        op.assert_not_called()

    def test_account_number_detection(self):
        self.assertTrue(po.has_account_number("Account Number: 123456789012"))
        self.assertTrue(po.has_account_number("A/C No: 1234 5678 9012"))
        self.assertFalse(po.has_account_number("Account Number: UNCERTAIN"))
        self.assertFalse(po.has_account_number("phone 98765"))


class Prepare(unittest.TestCase):
    def test_prepare_image_shrinks_and_returns_jpeg(self):
        try:
            from PIL import Image
        except ImportError:
            self.skipTest("Pillow not installed")
        buf = io.BytesIO()
        Image.new("RGB", (4000, 3000), "white").save(buf, format="PNG")
        out = po.prepare_image(buf.getvalue())
        img = Image.open(io.BytesIO(out))
        self.assertEqual(img.format, "JPEG")
        self.assertLessEqual(max(img.size), 1800)


if __name__ == "__main__":
    unittest.main()
