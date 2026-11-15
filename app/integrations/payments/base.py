"""Payment channel interface (spec section 7). Show success only when result.status == "ok"."""
from __future__ import annotations

from abc import ABC, abstractmethod

from app.integrations.common import ProviderResult


class PaymentProvider(ABC):
    name = "base"

    @abstractmethod
    def initiate_withdrawal(self, request: dict) -> ProviderResult: ...

    @abstractmethod
    def initiate_deposit(self, request: dict) -> ProviderResult: ...

    @abstractmethod
    def get_transaction_status(self, transaction_id: str) -> ProviderResult: ...

    @abstractmethod
    def handle_reversal(self, transaction_id: str) -> ProviderResult: ...
