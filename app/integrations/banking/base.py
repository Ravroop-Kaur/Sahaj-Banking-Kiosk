"""Application-level bank interface (spec 6.2). Not any bank's real API contract."""
from __future__ import annotations

from abc import ABC, abstractmethod

from app.integrations.common import ProviderResult, VerifiedIdentity


class BankProvider(ABC):
    name = "base"

    @abstractmethod
    def lookup_account(self, verified_identity: VerifiedIdentity | None, account_reference: str) -> ProviderResult:
        """Does this verified person have a permitted relationship with this account?"""

    @abstractmethod
    def get_account_details(self, account_reference: str) -> ProviderResult:
        """Return only approved fields needed by the selected service."""

    @abstractmethod
    def check_account_status(self, account_reference: str) -> ProviderResult:
        """Is the account in a state that allows the service?"""

    @abstractmethod
    def check_transaction_eligibility(self, account_reference: str, transaction_type: str, amount: str) -> ProviderResult:
        """May this specific transaction proceed now?"""
