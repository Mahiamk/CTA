"""HTTP routes for the cipher API."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.schemas import CipherRequest, CipherResponse
from app.services.cipher_service import CipherValidationError, run_cipher

router = APIRouter(prefix="/api/cipher", tags=["cipher"])


@router.post(
    "/encrypt",
    response_model=CipherResponse,
    summary="Encrypt text with the Columnar Transposition Cipher",
    description=(
        "Runs the columnar transposition encryption algorithm and returns both the "
        "final ciphertext and the complete step-by-step execution trace used to "
        "drive the frontend visualization."
    ),
)
def encrypt(payload: CipherRequest) -> CipherResponse:
    try:
        result, steps, metadata = run_cipher(
            "columnar_transposition", "encrypt", payload.text, payload.key
        )
    except CipherValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return CipherResponse(
        operation="encrypt",
        input={"text": payload.text, "key": payload.key},
        result=result,
        steps=steps,
        metadata=metadata,
    )


@router.post(
    "/decrypt",
    response_model=CipherResponse,
    summary="Decrypt text with the Columnar Transposition Cipher",
    description=(
        "Runs the columnar transposition decryption algorithm and returns both the "
        "recovered plaintext and the complete step-by-step execution trace used to "
        "drive the frontend visualization."
    ),
)
def decrypt(payload: CipherRequest) -> CipherResponse:
    try:
        result, steps, metadata = run_cipher(
            "columnar_transposition", "decrypt", payload.text, payload.key
        )
    except CipherValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return CipherResponse(
        operation="decrypt",
        input={"text": payload.text, "key": payload.key},
        result=result,
        steps=steps,
        metadata=metadata,
    )
