"""Pydantic request/response schemas for the cipher API."""

from __future__ import annotations

from typing import Any, Dict, List, Literal

from pydantic import BaseModel, Field


class CipherRequest(BaseModel):
    text: str = Field(
        ...,
        description="Plaintext to encrypt, or ciphertext to decrypt.",
        json_schema_extra={"example": "WEAREDISCOVEREDFLEEATONCE"},
    )
    key: str = Field(
        ...,
        description="Transposition key. Letters and digits only; case-insensitive.",
        json_schema_extra={"example": "ZEBRAS"},
    )


class InputEcho(BaseModel):
    text: str
    key: str


class AlgorithmStep(BaseModel):
    step: int = Field(..., description="1-indexed position of this step in the trace.")
    type: str = Field(..., description="Machine-readable step type, e.g. 'read_column'.")
    title: str = Field(..., description="Short human-readable step name.")
    description: str = Field(..., description="Beginner-friendly explanation of what happened.")
    state: Dict[str, Any] = Field(
        default_factory=dict,
        description="Structured data for this step. Shape depends on `type`; the frontend "
        "interprets it to drive visualization — the backend never encodes how to render it.",
    )


class CipherMetadata(BaseModel):
    rows: int
    columns: int
    ranks: List[int]
    readingOrder: List[int]
    normalizedText: str
    normalizedKey: str
    removedTextChars: List[Dict[str, Any]]
    removedKeyChars: List[Dict[str, Any]]


class CipherResponse(BaseModel):
    algorithm: Literal["columnar_transposition"] = "columnar_transposition"
    operation: Literal["encrypt", "decrypt"]
    input: InputEcho
    result: str
    steps: List[AlgorithmStep]
    metadata: CipherMetadata


class ErrorResponse(BaseModel):
    detail: str
