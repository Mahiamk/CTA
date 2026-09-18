import type { CipherResponse, Operation } from "../types/cipher";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function runCipher(operation: Operation, text: string, key: string): Promise<CipherResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/cipher/${operation}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, key }),
    });
  } catch {
    throw new ApiError(
      "Could not reach the cipher server. Is the backend running?",
      0,
    );
  }

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}.`;
    try {
      const body = await response.json();
      if (typeof body?.detail === "string") detail = body.detail;
    } catch {
      // ignore — fall back to generic message
    }
    throw new ApiError(detail, response.status);
  }

  return (await response.json()) as CipherResponse;
}

export const cipherApi = {
  encrypt: (text: string, key: string) => runCipher("encrypt", text, key),
  decrypt: (text: string, key: string) => runCipher("decrypt", text, key),
};
