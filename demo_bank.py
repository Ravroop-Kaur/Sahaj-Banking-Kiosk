"""DemoBankProvider: the SQLite demo data source behind the BankProvider interface (spec section 8)."""
from __future__ import annotations

import re
from decimal import Decimal, InvalidOperation

import demo_database
from app.config.settings import get_settings
from app.integrations.banking.base import BankProvider
from app.integrations.common import (ACCESS_DENIED, ACCOUNT_INACTIVE, IDENTITY_REQUIRED, INSUFFICIENT_FUNDS, INVALID_REQUEST,
                                     MISCONFIGURED, NOT_FOUND, OK, ProviderResult)

ACCOUNT_RE = re.compile(r"\d{8,18}")
WITHDRAWAL_TYPES = {"cash_withdrawal", "cash withdrawal", "pension withdrawal", "withdrawal"}
DEPOSIT_TYPES = {"cash_deposit", "cash deposit", "deposit"}


def _parse_amount(amount):
    try:
        value = Decimal(str(amount))
    except (InvalidOperation, ValueError):
        return None
    return value if value.is_finite() and value > 0 else None


class DemoBankProvider(BankProvider):
    name = "demo"

    def __init__(self, db_path=None):
        self._db_path = db_path

    def _blocked(self):
        if not get_settings().is_demo:
            return ProviderResult(MISCONFIGURED, "The demo bank provider is disabled when APP_MODE=production.", provider=self.name, simulated=True)
        return None

    def _record(self, ref):
        if not isinstance(ref, str) or not ACCOUNT_RE.fullmatch(ref):
            return None
        return demo_database.find_account(ref, self._db_path)

    def _result(self, status, message="", data=None):
        return ProviderResult(status, message, data or {}, provider=self.name, simulated=True)

    def lookup_account(self, verified_identity, account_reference):
        if (b := self._blocked()):
            return b
        if verified_identity is None:
            return self._result(IDENTITY_REQUIRED, "A verified identity is required before account access is checked.")
        record = self._record(account_reference)
        if record is None:
            return self._result(NOT_FOUND, "No synthetic demo account matches that exact number.")
        if record["customer_ref"] != verified_identity.subject_ref:  # identity alone must not open an unrelated account
            return self._result(ACCESS_DENIED, "This identity has no permitted relationship with that account.")
        return self._result(OK, "Account relationship confirmed (demo).", {"account_reference": record["account_number"]})

    def get_account_details(self, account_reference):
        if (b := self._blocked()):
            return b
        record = self._record(account_reference)
        if record is None:
            return self._result(NOT_FOUND, "No synthetic demo account matches that exact number.")
        return self._result(OK, "", {"account_id": record["account_number"], "name": record["full_name"], "phone": record["phone"],
                                     "branch": record["branch_name"], "balance": record["balance"], "status": record["status"],
                                     "customer_ref": record["customer_ref"]})

    def check_account_status(self, account_reference):
        if (b := self._blocked()):
            return b
        record = self._record(account_reference)
        if record is None:
            return self._result(NOT_FOUND, "No synthetic demo account matches that exact number.")
        if str(record["status"]).upper() != "ACTIVE":
            return self._result(ACCOUNT_INACTIVE, f"Account status is {record['status']}.", {"status": record["status"]})
        return self._result(OK, "", {"status": record["status"]})

    def check_transaction_eligibility(self, account_reference, transaction_type, amount):
        if (b := self._blocked()):
            return b
        value = _parse_amount(amount)
        if value is None:
            return self._result(INVALID_REQUEST, "Amount must be a positive number.")
        kind = str(transaction_type or "").lower()
        if kind not in WITHDRAWAL_TYPES | DEPOSIT_TYPES:
            return self._result(INVALID_REQUEST, "Unsupported transaction type.")
        record = self._record(account_reference)
        if record is None:
            return self._result(NOT_FOUND, "No synthetic demo account matches that exact number.")
        if str(record["status"]).upper() != "ACTIVE":
            return self._result(ACCOUNT_INACTIVE, f"Account status is {record['status']}.", {"status": record["status"]})
        if kind in WITHDRAWAL_TYPES and value > Decimal(record["balance"]):
            return self._result(INSUFFICIENT_FUNDS, "The amount is more than the demo balance.", {"balance": record["balance"]})
        return self._result(OK, "Eligible (demo). No money moves.", {"balance": record["balance"]})
