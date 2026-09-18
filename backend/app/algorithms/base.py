"""Shared primitives for algorithm execution traces.

Every cipher algorithm in this codebase produces a plain list of
``AlgorithmStep`` dicts describing *what happened*, not *how to draw it*.
The frontend owns all visualization decisions. Keeping this contract in one
place means a future algorithm (Caesar, Vigenere, Rail Fence, ...) can reuse
the same `StepBuilder` / response shape without the API layer changing.
"""

from __future__ import annotations

from typing import Any, Dict, List


class StepBuilder:

    def __init__(self) -> None:
        self._steps: List[Dict[str, Any]] = []

    def add(self, type: str, title: str, description: str, state: Dict[str, Any] | None = None) -> None:
        self._steps.append(
            {
                "step": len(self._steps) + 1,
                "type": type,
                "title": title,
                "description": description,
                "state": state or {},
            }
        )

    @property
    def steps(self) -> List[Dict[str, Any]]:
        return self._steps
