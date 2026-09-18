"""
benchmark_api.py - Performance and round-trip benchmark for the
Columnar Cipher Visualizer backend (CCS2243 project, Section 5.6).

Usage (with the backend running at http://localhost:8000):
    pip install requests
    python benchmark_api.py            # prints a table and writes benchmark_results.csv

Each input size is encrypted and decrypted REPEATS times through the public
REST API; the median wall-clock time, the number of trace steps and the size
of the JSON response are recorded, and the decrypted text is compared with
the normalised plaintext.
"""
import csv
import random
import statistics
import string
import time

import requests

BASE_URL = "http://localhost:8000/api/cipher"
KEYS = ["ZEBRAS", "CRYPTOGRAPHY"]          # 6-column and 12-column keys
SIZES = [100, 1_000, 5_000, 10_000]        # characters of plaintext
REPEATS = 5
random.seed(2243)                           # reproducible inputs


def call(operation: str, text: str, key: str):
    """POST once and return (elapsed_ms, parsed_json, response_bytes)."""
    start = time.perf_counter()
    resp = requests.post(f"{BASE_URL}/{operation}", json={"text": text, "key": key}, timeout=120)
    elapsed_ms = (time.perf_counter() - start) * 1000
    resp.raise_for_status()
    return elapsed_ms, resp.json(), len(resp.content)


def main():
    rows = []
    for key in KEYS:
        for n in SIZES:
            plaintext = "".join(random.choice(string.ascii_uppercase) for _ in range(n))
            enc_times, dec_times = [], []
            for _ in range(REPEATS):
                t_enc, enc_json, enc_bytes = call("encrypt", plaintext, key)
                t_dec, dec_json, _ = call("decrypt", enc_json["result"], key)
                enc_times.append(t_enc)
                dec_times.append(t_dec)
            rows.append({
                "key": key,
                "length": n,
                "encrypt_ms_median": round(statistics.median(enc_times), 2),
                "decrypt_ms_median": round(statistics.median(dec_times), 2),
                "steps": len(enc_json["steps"]),
                "response_kb": round(enc_bytes / 1024, 1),
                "round_trip_ok": dec_json["result"] == plaintext,
            })
            print(rows[-1])

    with open("benchmark_results.csv", "w", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)
    print("Saved benchmark_results.csv")


if __name__ == "__main__":
    main()