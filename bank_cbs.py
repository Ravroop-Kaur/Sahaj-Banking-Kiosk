"""BankCBSProvider: placeholder for a future core-banking adapter. Every call returns ``not_configured``.
No endpoints or field names (those come from the bank's approved docs); never falls back to demo data."""
from __future__ import annotations

from app.integrations.banking.base import BankProvider
from app.integrations.common import not_configured


class BankCBSProvider(BankProvider):
    name = "bank_cbs"

    def _nc(self):
        return not_configured(self.name, "The bank core-banking (CBS) integration")

    def lookup_account(self, verified_identity, account_reference):
        return self._nc()

    def get_account_details(self, account_reference):
        return self._nc()

    def check_account_status(self, account_reference):
        return self._nc()

    def check_transaction_eligibility(self, account_reference, transaction_type, amount):
        return self._nc()
