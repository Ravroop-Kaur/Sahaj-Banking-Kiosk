"""Shared result types for every provider interface. Providers return a ``ProviderResult`` whose ``status``
says exactly what happened, so "not configured" or "unavailable" can never be mistaken for success."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

OK = "ok"
NOT_FOUND = "not_found"
ACCESS_DENIED = "access_denied"
IDENTITY_REQUIRED = "identity_required"
ACCOUNT_INACTIVE = "account_inactive"
INSUFFICIENT_FUNDS = "insufficient_funds"
INELIGIBLE = "ineligible"
INVALID_REQUEST = "invalid_request"
FAILED = "failed"
NOT_CONFIGURED = "not_configured"
UNAVAILABLE = "unavailable"
MISCONFIGURED = "misconfigured"


@dataclass(frozen=True)
class ProviderResult:
    status: str
    message: str = ""
    data: dict[str, Any] = field(default_factory=dict)
    provider: str = ""
    simulated: bool = False

    @property
    def ok(self) -> bool:
        return self.status == OK

    def as_dict(self) -> dict:
        return {"status": self.status, "message": self.message, "data": dict(self.data), "provider": self.provider, "simulated": self.simulated}


@dataclass(frozen=True)
class VerifiedIdentity:
    """Outcome of an identity decision. No biometric or Aadhaar data. ``subject_ref`` grants no account access."""
    subject_ref: str
    method: str
    provider: str
    simulated: bool = True
    verified_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat(timespec="seconds"))

    def public(self) -> dict:
        return {"method": self.method, "provider": self.provider, "simulated": self.simulated, "verified_at": self.verified_at}


def not_configured(provider: str, what: str) -> ProviderResult:
    return ProviderResult(NOT_CONFIGURED, f"{what} is not configured. No live integration exists until it is authorised, connected and tested.", provider=provider)
