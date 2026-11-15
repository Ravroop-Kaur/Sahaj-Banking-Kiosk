"""Language selection should not narrow first-turn voice recognition to English."""

import json

from app.config.settings import load_settings
from app.integrations.voice import _http
from app.integrations.voice.gnani_stt import GnaniSTT
from app.integrations.voice.language_manager import stt_language_code
from app.services import voice_service
from tests.helpers import wav


def test_unselected_prisma_language_is_detected_automatically():
    assert stt_language_code('', 'prisma-v3.0') == 'indic-auto'
    assert 'pa-IN' in stt_language_code('pa', 'prisma-v3.0')
    assert 'bn-IN' in stt_language_code('bn', 'prisma-v3.0')
    assert 'ta-IN' in stt_language_code('ta', 'prisma-v3.0')
    assert 'kn-IN' in stt_language_code('kn', 'prisma-v3.0')


def test_gnani_receives_auto_detection_and_reports_punjabi():
    recorded = {}

    def transport(url, body, headers, timeout):
        recorded['body'] = body
        return _http.HttpResponse(200, json.dumps({
            'success': True,
            'transcript': 'ਮੈਨੂੰ ਪੈਸੇ ਕੱਢਣੇ ਨੇ',
            'detected_language_code': 'pa-IN',
        }).encode())

    settings = load_settings({'GNANI_API_KEY': 'TEST-VOICE-KEY'})
    result = GnaniSTT(settings, transport).transcribe(wav(), '')
    assert result.ok and result.detected_language == 'pa'
    assert b'indic-auto' in recorded['body']


def test_voice_service_forwards_detected_language_to_browser(monkeypatch):
    settings = load_settings({'GNANI_API_KEY': 'TEST-VOICE-KEY'})
    monkeypatch.setattr(voice_service, 'get_settings', lambda: settings)
    from app.integrations.voice.base import VoiceResult, OK

    class FakeGnani:
        def __init__(self, settings):
            pass

        def transcribe(self, data, language, request_id=''):
            return VoiceResult(status=OK, provider='gnani',
                               text='আমাকে টাকা তুলতে হবে', detected_language='bn')

    monkeypatch.setattr(voice_service, 'GnaniSTT', FakeGnani)
    result = voice_service.transcribe(wav(), '')
    assert result['text'] == 'আমাকে টাকা তুলতে হবে'
    assert result['detected_language'] == 'bn'
    assert result['engine'] == 'gnani'
