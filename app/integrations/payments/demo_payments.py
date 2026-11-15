"""DemoPaymentProvider: a clearly labelled MOCK channel. Moves no money; ids are prefixed SIM-.
Idempotent, and re-checks eligibility like an issuer would."""
from __future__ import annotations

import threading
import uuid
from decimal import Decimal, InvalidOperation

from app.config.settings import get_settings
from app.integrations.banking.demo_bank import DemoBankProvider
from app.integrations.common import FAILED, INVALID_REQUEST, MISCONFIGURED, NOT_FOUND, OK, ProviderResult
from app.integrations.payments.base import PaymentProvider

COMPLETED = "simulated_completed"
REVERSED = "simulated_reversed"
SIMULATION_NOTE = "SIMULATED demo transaction. No money has moved and no bank was contacted."


class DemoPaymentProvider(PaymentProvider):
    name = "demo"

    def __init__(self, bank=None):
        self._bank = bank or DemoBankProvider()
        self._lock = threading.Lock()
        self._transactions = {}
        self._by_key = {}

    def _result(self, status, message="", data=None):
        return ProviderResult(status, message, data or {}, provider=self.name, simulated=True)

    def _blocked(self):
        if not get_settings().is_demo:
            return self._result(MISCONFIGURED, "The demo payment provider is disabled when APP_MODE=production.")
        return None

    def _duplicate(self, key):
        existing = self._by_key.get(key)
        if existing:
            return self._result(OK, "Duplicate request ignored; the original simulated transaction is returned.", dict(self._transactions[existing], duplicate=True))
        return None

    def _initiate(self, kind, request):
        if (b := self._blocked()):
            return b
        request = request or {}
        key = str(request.get("idempotency_key") or "").strip()
        account = str(request.get("account_reference") or "").strip()
        if not key or not account:
            return self._result(INVALID_REQUEST, "idempotency_key and account_reference are required.")
        try:
            amount = Decimal(str(request.get("amount")))
        except (InvalidOperation, ValueError):
            return self._result(INVALID_REQUEST, "Amount must be a positive number.")
        if not amount.is_finite() or amount <= 0:
            return self._result(INVALID_REQUEST, "Amount must be a positive number.")
        with self._lock:
            if (d := self._duplicate(key)):
                return d
        eligibility = self._bank.check_transaction_eligibility(account, kind, str(amount))
        if not eligibility.ok:
            return self._result(FAILED, eligibility.message or "The issuer check did not pass.", {"reason": eligibility.status})
        with self._lock:
            if (d := self._duplicate(key)):
                return d
            txn_id = "SIM-" + uuid.uuid4().hex[:12].upper()
            record = {"transaction_id": txn_id, "type": kind, "amount": str(amount), "account_reference": account, "state": COMPLETED, "note": SIMULATION_NOTE}
            self._transactions[txn_id] = record
            self._by_key[key] = txn_id
        return self._result(OK, SIMULATION_NOTE, dict(record, duplicate=False))

    def initiate_withdrawal(self, request):
        return self._initiate("cash_withdrawal", request)

    def initiate_deposit(self, request):
        return self._initiate("cash_deposit", request)

    def get_transaction_status(self, transaction_id):
        if (b := self._blocked()):
            return b
        with self._lock:
            record = self._transactions.get(str(transaction_id))
            return self._result(OK, "", dict(record)) if record else self._result(NOT_FOUND, "No simulated transaction has that id.")

    def handle_reversal(self, transaction_id):
        if (b := self._blocked()):
            return b
        with self._lock:
            record = self._transactions.get(str(transaction_id))
            if record is None:
                return self._result(NOT_FOUND, "No simulated transaction has that id.")
            if record["state"] == REVERSED:
                return self._result(OK, "Already reversed (simulated).", dict(record))
            record["state"] = REVERSED
            return self._result(OK, "Reversed (simulated). No money moved.", dict(record))
