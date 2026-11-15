"""Placeholder for an authorised AePS participant adapter. Invents no endpoints; never simulates a live success."""
from __future__ import annotations

from app.integrations.common import not_configured
from app.integrations.payments.base import PaymentProvider


class AepsPaymentProvider(PaymentProvider):
    name = "authorised_aeps"

    def _nc(self):
        return not_configured(self.name, "The authorised AePS payment channel")

    def initiate_withdrawal(self, request):
        return self._nc()

    def initiate_deposit(self, request):
        return self._nc()

    def get_transaction_status(self, transaction_id):
        return self._nc()

    def handle_reversal(self, transaction_id):
        return self._nc()
