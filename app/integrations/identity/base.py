"""Identity interface: answers only "is this person who they claim to be?" (spec section 6)."""
from __future__ import annotations

from abc import ABC, abstractmethod

from app.integrations.common import ProviderResult


class IdentityProvider(ABC):
    name = "base"

    @abstractmethod
    def verify(self, request: dict) -> ProviderResult:
        """On success ``result.data["identity"]`` is a VerifiedIdentity. No raw biometrics or Aadhaar numbers pass through."""
