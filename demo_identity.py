"""DemoIdentityProvider: a clearly simulated identity step. NOT UIDAI authentication; no biometric matching."""
from __future__ import annotations

import demo_database
from app.config.settings import get_settings
from app.integrations.common import FAILED, INVALID_REQUEST, MISCONFIGURED, OK, ProviderResult, VerifiedIdentity
from app.integrations.identity.base import IdentityProvider

METHOD = "demo_synthetic_reference"


class DemoIdentityProvider(IdentityProvider):
    name = "demo"

    def __init__(self, db_path=None):
        self._db_path = db_path

    def verify(self, request):
        if not get_settings().is_demo:
            return ProviderResult(MISCONFIGURED, "The demo identity provider is disabled when APP_MODE=production.", provider=self.name, simulated=True)
        ref = str((request or {}).get("demo_customer_ref") or "").strip()
        if not ref:
            return ProviderResult(INVALID_REQUEST, "demo_customer_ref is required for the simulated identity check.", provider=self.name, simulated=True)
        demo_database.initialize_database(self._db_path)
        with demo_database.connect(self._db_path) as db:
            exists = db.execute("SELECT 1 FROM customers WHERE customer_ref = ?", (ref,)).fetchone() is not None
        if not exists:
            return ProviderResult(FAILED, "Simulated identity check failed.", provider=self.name, simulated=True)
        identity = VerifiedIdentity(subject_ref=ref, method=METHOD, provider=self.name, simulated=True)
        return ProviderResult(OK, "Simulated identity check passed. This is not Aadhaar/UIDAI authentication.", {"identity": identity}, provider=self.name, simulated=True)
