"""Chooses providers from settings (spec 15 and 18). Unknown id -> ``not_configured`` placeholder, never a demo provider.
A demo provider in production mode refuses to run. Production failures are never turned into demo successes."""
from __future__ import annotations

from app.config.settings import get_settings
from app.integrations.banking.bank_cbs import BankCBSProvider
from app.integrations.banking.demo_bank import DemoBankProvider
from app.integrations.identity.demo_identity import DemoIdentityProvider
from app.integrations.identity.uidai_provider import UidaiIdentityProvider
from app.integrations.payments.aeps_provider import AepsPaymentProvider
from app.integrations.payments.demo_payments import DemoPaymentProvider

_payment_singleton = None  # demo payments keep state across requests (idempotency, status, reversal)


def reset_providers():
    global _payment_singleton
    _payment_singleton = None


class _NC:
    def __init__(self, name):
        self.name = name


class _NotConfiguredBank(_NC, BankCBSProvider):
    pass


class _NotConfiguredIdentity(_NC, UidaiIdentityProvider):
    pass


class _NotConfiguredPayments(_NC, AepsPaymentProvider):
    pass


def get_bank_provider(settings=None):
    s = settings or get_settings()
    if s.bank_provider == "demo":
        return DemoBankProvider()
    return BankCBSProvider() if s.bank_provider == "bank_cbs" else _NotConfiguredBank(s.bank_provider)


def get_identity_provider(settings=None):
    s = settings or get_settings()
    if s.identity_provider == "demo":
        return DemoIdentityProvider()
    return UidaiIdentityProvider() if s.identity_provider == "authorised_uidai" else _NotConfiguredIdentity(s.identity_provider)


def get_payment_provider(settings=None):
    global _payment_singleton
    s = settings or get_settings()
    if s.payment_provider == "demo":
        if _payment_singleton is None:
            _payment_singleton = DemoPaymentProvider(get_bank_provider(s))
        return _payment_singleton
    return AepsPaymentProvider() if s.payment_provider == "authorised_aeps" else _NotConfiguredPayments(s.payment_provider)
