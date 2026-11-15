"""Shared helpers for the Sahaj tests. Plain functions: no pytest fixtures needed."""
import os
import shutil
import sqlite3
import struct
import tempfile
from contextlib import contextmanager
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


@contextmanager
def env(**values):
    old = {k: os.environ.get(k) for k in values}
    try:
        for k, v in values.items():
            os.environ.pop(k, None) if v is None else os.environ.__setitem__(k, v)
        yield
    finally:
        for k, v in old.items():
            os.environ.pop(k, None) if v is None else os.environ.__setitem__(k, v)


def wav(seconds=1.0):
    data = b"\x00\x00" * int(16000 * seconds)
    return (b"RIFF" + struct.pack("<I", 36 + len(data)) + b"WAVEfmt " + struct.pack("<IHHIIHH", 16, 1, 1, 16000, 32000, 2, 16)
            + b"data" + struct.pack("<I", len(data)) + data)


@contextmanager
def temp_db(status_by_account=None):
    """A throw-away copy of the demo database, optionally with some accounts set to a non-ACTIVE status."""
    folder = tempfile.mkdtemp(prefix="sahaj-test-")
    path = Path(folder) / "demo.sqlite3"
    try:
        shutil.copy(ROOT / "data" / "synthetic_banking.sqlite3", path)
        if status_by_account:
            db = sqlite3.connect(path)
            for account, status in status_by_account.items():
                db.execute("UPDATE accounts SET status = ? WHERE account_number = ?", (status, account))
            db.commit()
            db.close()
        yield path
    finally:
        shutil.rmtree(folder, ignore_errors=True)


def ready_session(consents=("data_collection", "identity_verification", "transaction"), customer="SYN-CUST-001",
                  account="990000000001", validate_account=True):
    from app.integrations.registry import get_bank_provider, get_identity_provider, reset_providers
    from app.services import authentication, authorization, consent_manager
    from app.services.session_manager import get_session_manager
    reset_providers()
    session = get_session_manager().create("en")
    for purpose in consents:
        consent_manager.record_consent(session, purpose, True)
    authentication.verify_identity(session, get_identity_provider(), {"demo_customer_ref": customer})
    if validate_account:
        authorization.validate_account_access(session, get_bank_provider(), account, True)
    return session
