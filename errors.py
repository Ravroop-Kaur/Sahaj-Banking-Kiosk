"""Raised when a workflow gate stops an operation. The API layer maps ``status`` to HTTP."""
from __future__ import annotations


class GateError(Exception):
    def __init__(self, code, message, status=409):
        super().__init__(message)
        self.code, self.message, self.status = code, message, status

    def as_dict(self):
        return {"code": self.code, "message": self.message}
