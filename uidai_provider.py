"""Placeholder for an authorised UIDAI authentication route (needs AUA/Sub-AUA arrangement, compliant devices, approval).
Returns ``not_configured``. No endpoints, no biometric capture, never an in-house face matcher labelled official (spec 18)."""
from __future__ import annotations

from app.integrations.common import not_configured
from app.integrations.identity.base import IdentityProvider


class UidaiIdentityProvider(IdentityProvider):
    name = "authorised_uidai"

    def verify(self, request):
        return not_configured(self.name, "The authorised UIDAI identity route")
