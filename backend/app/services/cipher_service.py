"""Service layer: maps API requests onto a registered cipher algorithm.

This indirection is what lets new algorithms (Caesar, Vigenere, Rail Fence, ...)
be added later without touching the API routes — each just registers an
`encrypt`/`decrypt` pair with the same `(text, key) -> (result, steps, metadata)`
signature used by `app.algorithms.columnar`.
"""

from __future__ import annotations

from typing import Any, Dict, List, Tuple

from app.algorithms import columnar
from app.algorithms.columnar import CipherValidationError

_ALGORITHMS: Dict[str, Dict[str, Any]] = {
    "columnar_transposition": {
        "encrypt": columnar.encrypt,
        "decrypt": columnar.decrypt,
    }
}


def run_cipher(
    algorithm: str, operation: str, text: str, key: str
) -> Tuple[str, List[Dict[str, Any]], Dict[str, Any]]:
    if algorithm not in _ALGORITHMS:
        raise CipherValidationError(f"Unknown algorithm '{algorithm}'.")
    if operation not in _ALGORITHMS[algorithm]:
        raise CipherValidationError(f"Unknown operation '{operation}'.")

    fn = _ALGORITHMS[algorithm][operation]
    return fn(text, key)


__all__ = ["run_cipher", "CipherValidationError"]
