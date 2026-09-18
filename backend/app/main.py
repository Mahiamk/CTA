"""FastAPI application entrypoint."""

from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.exception_handlers import http_exception_handler
from fastapi.exceptions import HTTPException, RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import router as cipher_router

logger = logging.getLogger("cipher_lab")

app = FastAPI(
    title="Cryptography Lab API",
    description=(
        "An algorithm execution engine for interactive cipher visualization. "
        "Endpoints return both the final result and a complete, structured "
        "step-by-step trace of how the algorithm arrived at it."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cipher_router)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(status_code=422, content={"detail": "Invalid request payload."})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error while processing %s", request.url)
    return JSONResponse(status_code=500, content={"detail": "An internal error occurred."})


@app.get("/", tags=["health"])
def health() -> dict:
    return {"status": "ok", "service": "cipher-lab-api"}
