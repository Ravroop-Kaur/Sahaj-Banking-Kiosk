"""SQLite schema and strictly account-keyed queries for fictional demo records."""
from __future__ import annotations

import os
import sqlite3
from pathlib import Path

ROOT = Path(__file__).parent
DB_PATH = Path(os.environ.get("BANKING_DEMO_DB", ROOT / "data" / "synthetic_banking.sqlite3"))


def connect(path: Path | str | None = None) -> sqlite3.Connection:
    db_path = Path(path) if path else DB_PATH
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def initialize_database(path: Path | str | None = None) -> None:
    with connect(path) as db:
        db.executescript("""
            CREATE TABLE IF NOT EXISTS customers (
                customer_id INTEGER PRIMARY KEY,
                customer_ref TEXT NOT NULL UNIQUE,
                full_name TEXT NOT NULL,
                phone TEXT NOT NULL UNIQUE,
                address TEXT NOT NULL,
                date_of_birth TEXT NOT NULL,
                occupation TEXT NOT NULL DEFAULT 'Synthetic demo occupation'
            );
            CREATE TABLE IF NOT EXISTS accounts (
                account_number TEXT PRIMARY KEY,
                customer_id INTEGER NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
                account_type TEXT NOT NULL,
                branch_name TEXT NOT NULL,
                ifsc TEXT NOT NULL,
                cif TEXT NOT NULL UNIQUE,
                balance_paise INTEGER NOT NULL CHECK(balance_paise >= 0),
                status TEXT NOT NULL DEFAULT 'ACTIVE'
            );
            CREATE TABLE IF NOT EXISTS synthetic_identifications (
                customer_id INTEGER NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
                id_type TEXT NOT NULL,
                id_value TEXT NOT NULL UNIQUE,
                label TEXT NOT NULL DEFAULT 'SYNTHETIC DEMO VALUE - NOT VALID FOR IDENTIFICATION',
                PRIMARY KEY(customer_id, id_type)
            );
            CREATE TABLE IF NOT EXISTS demo_preferences (
                customer_id INTEGER PRIMARY KEY REFERENCES customers(customer_id) ON DELETE CASCADE,
                preferred_language TEXT NOT NULL DEFAULT 'English',
                demo_bank_card_number TEXT NOT NULL UNIQUE,
                demo_only INTEGER NOT NULL DEFAULT 1 CHECK(demo_only = 1)
            );
            CREATE TABLE IF NOT EXISTS demo_transactions (
                transaction_id TEXT PRIMARY KEY,
                account_number TEXT NOT NULL REFERENCES accounts(account_number),
                transaction_date TEXT NOT NULL,
                transaction_type TEXT NOT NULL CHECK(transaction_type IN ('DEMO_CREDIT','DEMO_DEBIT')),
                amount_paise INTEGER NOT NULL CHECK(amount_paise > 0),
                description TEXT NOT NULL,
                demo_only INTEGER NOT NULL DEFAULT 1 CHECK(demo_only = 1)
            );
            CREATE INDEX IF NOT EXISTS idx_accounts_customer_id ON accounts(customer_id);
        """)
        columns = {row["name"] for row in db.execute("PRAGMA table_info(customers)")}
        if "occupation" not in columns:
            db.execute("ALTER TABLE customers ADD COLUMN occupation TEXT NOT NULL DEFAULT 'Synthetic demo occupation'")


def find_account(account_number: str, path: Path | str | None = None) -> dict | None:
    """Return one joined customer/account record only for this exact account key."""
    initialize_database(path)
    with connect(path) as db:
        row = db.execute("""
            SELECT a.account_number, a.account_type, a.branch_name, a.ifsc, a.cif,
                   a.balance_paise, a.status, c.customer_id, c.customer_ref, c.full_name,
                   c.phone, c.address, c.date_of_birth, c.occupation,
                   p.preferred_language, p.demo_bank_card_number
            FROM accounts AS a JOIN customers AS c USING(customer_id)
            LEFT JOIN demo_preferences AS p USING(customer_id)
            WHERE a.account_number = ?
        """, (account_number,)).fetchone()
        if row is None:
            return None
        identifiers = db.execute("""
            SELECT id_type, id_value, label FROM synthetic_identifications
            WHERE customer_id = (SELECT customer_id FROM accounts WHERE account_number = ?)
            ORDER BY id_type
        """, (account_number,)).fetchall()
    result = dict(row)
    result["balance"] = f"{result.pop('balance_paise') / 100:.2f}"
    result["identifications"] = {item["id_type"]: {"value": item["id_value"], "label": item["label"]} for item in identifiers}
    result["source"] = "synthetic_sqlite"
    return result
