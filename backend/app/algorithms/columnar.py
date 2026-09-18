"""Columnar Transposition Cipher: implementation + execution trace.

This module has exactly two responsibilities:

1. Compute a cryptographically correct result for encrypt/decrypt.
2. Emit a granular, structured trace of every step the algorithm took.

It knows nothing about HTTP, Pydantic, or the UI. See ``app/algorithms/base.py``
for the step-trace contract.
"""

from __future__ import annotations

import math
from typing import Any, Dict, List, Tuple

from app.algorithms.base import StepBuilder


class CipherValidationError(ValueError):
    """Raised for input that cannot be processed. Maps to HTTP 422."""


EMPTY = None  # sentinel for an empty grid cell


def normalize_text(raw: str) -> Tuple[str, List[Dict[str, Any]]]:
    """Uppercase and strip anything that isn't a letter or digit.

    Returns the normalized text plus a record of every removed character
    (and its original index) so the UI can show exactly what changed.
    """
    normalized_chars: List[str] = []
    removed: List[Dict[str, Any]] = []
    for index, ch in enumerate(raw):
        if ch.isalpha() or ch.isdigit():
            normalized_chars.append(ch.upper())
        else:
            removed.append({"char": ch, "index": index})
    return "".join(normalized_chars), removed


def normalize_key(raw: str) -> Tuple[str, List[Dict[str, Any]]]:
    """Same normalization policy as plaintext, applied to the key."""
    return normalize_text(raw)


def rank_key(key: str) -> Tuple[List[int], List[int], List[Dict[str, Any]]]:
    """Rank each column of the key alphabetically (stable for duplicates).

    Returns:
        ranks: rank (1-indexed) for each original column position.
        reading_order: original column indices ordered by ascending rank.
        letters: per-letter detail (char, originalIndex, rank) for the UI.
    """
    indexed = list(enumerate(key))  # [(originalIndex, char), ...]
    # Python's sort is stable, so ties (duplicate letters) keep their
    # original relative order automatically.
    sorted_indexed = sorted(indexed, key=lambda pair: pair[1])

    ranks = [0] * len(key)
    for rank, (original_index, _char) in enumerate(sorted_indexed, start=1):
        ranks[original_index] = rank

    reading_order = [original_index for original_index, _char in sorted_indexed]

    letters = [
        {"char": ch, "originalIndex": i, "rank": ranks[i]}
        for i, ch in enumerate(key)
    ]

    return ranks, reading_order, letters


def _validate_inputs(text: str, key: str) -> Tuple[str, str, List[Dict[str, Any]], List[Dict[str, Any]]]:
    if text is None or text.strip() == "":
        raise CipherValidationError("Plaintext/ciphertext is required.")
    if key is None or key.strip() == "":
        raise CipherValidationError("Key is required.")

    normalized_text, removed_text_chars = normalize_text(text)
    normalized_key, removed_key_chars = normalize_key(key)

    if normalized_text == "":
        raise CipherValidationError(
            "Text contains no letters or digits after normalization."
        )
    if normalized_key == "":
        raise CipherValidationError(
            "Key contains no letters or digits after normalization."
        )

    return normalized_text, normalized_key, removed_text_chars, removed_key_chars


def _empty_grid(rows: int, columns: int) -> List[List[Any]]:
    return [[EMPTY for _ in range(columns)] for _ in range(rows)]


def _clone_grid(grid: List[List[Any]]) -> List[List[Any]]:
    return [row[:] for row in grid]


def _column_lengths(total_chars: int, rows: int, columns: int) -> List[int]:
    """How many characters land in each *original* column position.

    The last row is filled left-to-right and may be incomplete, so the
    left-most `remainder` columns get `rows` characters and the rest get
    `rows - 1`.
    """
    remainder = total_chars - (rows - 1) * columns
    return [rows if col < remainder else rows - 1 for col in range(columns)]


def encrypt(text: str, key: str) -> Tuple[str, List[Dict[str, Any]], Dict[str, Any]]:
    normalized_text, normalized_key, removed_text_chars, removed_key_chars = _validate_inputs(text, key)

    columns = len(normalized_key)
    total_chars = len(normalized_text)
    rows = max(1, math.ceil(total_chars / columns))

    builder = StepBuilder()

    # Step 1 — Input
    builder.add(
        "input",
        "Input",
        "The plaintext and key are provided as inputs to the Columnar Transposition Cipher.",
        {"text": text, "key": key},
    )

    # Step 2 — Normalize
    builder.add(
        "normalize",
        "Normalize plaintext",
        "The plaintext is uppercased and stripped of anything that isn't a letter or digit "
        "so it can be placed cleanly into a grid."
        if not removed_text_chars
        else "The plaintext is uppercased; spaces and punctuation are removed so it can be "
        "placed cleanly into a grid.",
        {
            "rawText": text,
            "normalizedText": normalized_text,
            "removed": removed_text_chars,
        },
    )

    # Step 3 — Create grid
    cells_required = rows * columns
    builder.add(
        "grid_created",
        "Create the transposition grid",
        f"A grid is created with {columns} columns (one per key letter) and {rows} rows "
        f"(enough to hold all {total_chars} characters).",
        {
            "rows": rows,
            "columns": columns,
            "cellsRequired": cells_required,
            "characterCount": total_chars,
            "key": normalized_key,
        },
    )

    # Step 4 — Place plaintext row-by-row
    grid = _empty_grid(rows, columns)
    for i, ch in enumerate(normalized_text):
        row, col = divmod(i, columns)
        grid[row][col] = ch
        builder.add(
            "place_character",
            "Place plaintext row-by-row",
            f"Place '{ch}' at row {row + 1}, column {col + 1}.",
            {
                "row": row,
                "column": col,
                "character": ch,
                "charIndex": i,
                "grid": _clone_grid(grid),
            },
        )

    # Step 5 — Rank the key
    ranks, reading_order, letters = rank_key(normalized_key)
    builder.add(
        "key_ranking",
        "Rank the key alphabetically",
        "Each key letter is assigned a rank based on its alphabetical position. "
        "Duplicate letters keep their original left-to-right order. The physical "
        "columns do not move — the ranks only determine the order they will be read in.",
        {
            "key": normalized_key,
            "letters": letters,
            "ranks": ranks,
            "readingOrder": reading_order,
        },
    )

    # Step 6 — Read columns in ranked order
    ciphertext_parts: List[str] = []
    for order_index, col in enumerate(reading_order, start=1):
        chars_read = []
        for row in range(rows):
            ch = grid[row][col]
            if ch is not EMPTY:
                chars_read.append({"row": row, "column": col, "character": ch})
        column_text = "".join(c["character"] for c in chars_read)
        ciphertext_parts.append(column_text)
        builder.add(
            "read_column",
            "Read columns in ranked order",
            f"Column {col + 1} (key letter '{normalized_key[col]}', rank {ranks[col]}) is read "
            f"top-to-bottom, contributing \"{column_text}\" to the ciphertext.",
            {
                "orderIndex": order_index,
                "column": col,
                "rank": ranks[col],
                "keyLetter": normalized_key[col],
                "charactersRead": chars_read,
                "columnText": column_text,
                "ciphertextSoFar": "".join(ciphertext_parts),
            },
        )

    ciphertext = "".join(ciphertext_parts)

    # Step 7 — Final result
    builder.add(
        "complete",
        "Final ciphertext",
        f"All {columns} columns have been read in ranked order, producing the final "
        f"ciphertext of {len(ciphertext)} characters.",
        {
            "ciphertext": ciphertext,
            "charactersProcessed": total_chars,
            "columnsRead": columns,
            "rowsProcessed": rows,
        },
    )

    metadata = {
        "rows": rows,
        "columns": columns,
        "ranks": ranks,
        "readingOrder": reading_order,
        "normalizedText": normalized_text,
        "normalizedKey": normalized_key,
        "removedTextChars": removed_text_chars,
        "removedKeyChars": removed_key_chars,
    }

    return ciphertext, builder.steps, metadata


def decrypt(text: str, key: str) -> Tuple[str, List[Dict[str, Any]], Dict[str, Any]]:
    normalized_text, normalized_key, removed_text_chars, removed_key_chars = _validate_inputs(text, key)

    columns = len(normalized_key)
    total_chars = len(normalized_text)
    rows = max(1, math.ceil(total_chars / columns))

    builder = StepBuilder()

    # Step 1 — Input
    builder.add(
        "input",
        "Input",
        "The ciphertext and key are provided as inputs. Decryption must reverse the exact "
        "column order the key produced during encryption.",
        {"text": text, "key": key},
    )

    # Step 2 — Rank the key
    ranks, reading_order, letters = rank_key(normalized_key)
    builder.add(
        "key_ranking",
        "Rank the key alphabetically",
        "The key is ranked exactly as it was during encryption. This tells us which "
        "original column each slice of ciphertext belongs to.",
        {
            "key": normalized_key,
            "letters": letters,
            "ranks": ranks,
            "readingOrder": reading_order,
        },
    )

    # Step 3 — Grid dimensions
    lengths = _column_lengths(total_chars, rows, columns)
    builder.add(
        "grid_dimensions",
        "Calculate grid dimensions",
        f"With a key of length {columns} and {total_chars} ciphertext characters, the grid "
        f"needs {rows} rows. The first {total_chars - (rows - 1) * columns} column(s) "
        "(left to right) hold a full row, the rest are one shorter.",
        {"rows": rows, "columns": columns, "characterCount": total_chars},
    )

    # Step 4 — Column lengths (in reading order, since that's how the
    # ciphertext is sliced)
    column_length_by_original = {col: lengths[col] for col in range(columns)}
    builder.add(
        "column_lengths",
        "Determine column lengths",
        "Each column's length is derived from its position: columns are filled left-to-right "
        "in the final (possibly incomplete) row, so left-most columns may be one character longer.",
        {
            "columns": [
                {"column": col, "rank": ranks[col], "length": column_length_by_original[col]}
                for col in range(columns)
            ]
        },
    )

    # Step 5 — Distribute ciphertext into columns, in ranked (reading) order
    grid = _empty_grid(rows, columns)
    cursor = 0
    for order_index, col in enumerate(reading_order, start=1):
        length = column_length_by_original[col]
        slice_text = normalized_text[cursor: cursor + length]
        placed = []
        for row, ch in enumerate(slice_text):
            grid[row][col] = ch
            placed.append({"row": row, "column": col, "character": ch})
        cursor += length
        builder.add(
            "distribute_column",
            "Place ciphertext into columns",
            f"Column {col + 1} (key letter '{normalized_key[col]}', rank {ranks[col]}) receives "
            f"the next {length} character(s): \"{slice_text}\".",
            {
                "orderIndex": order_index,
                "column": col,
                "rank": ranks[col],
                "keyLetter": normalized_key[col],
                "length": length,
                "charactersPlaced": placed,
                "grid": _clone_grid(grid),
            },
        )

    # Step 6 — Read grid row-by-row
    plaintext_parts: List[str] = []
    for row in range(rows):
        row_chars = [grid[row][col] for col in range(columns) if grid[row][col] is not EMPTY]
        row_text = "".join(row_chars)
        plaintext_parts.append(row_text)
        builder.add(
            "read_row",
            "Read grid row-by-row",
            f"Row {row + 1} is read left-to-right, contributing \"{row_text}\" to the recovered plaintext.",
            {
                "row": row,
                "rowText": row_text,
                "plaintextSoFar": "".join(plaintext_parts),
            },
        )

    plaintext = "".join(plaintext_parts)

    # Step 7 — Final result
    builder.add(
        "complete",
        "Recovered plaintext",
        f"All {rows} rows have been read, recovering the original {len(plaintext)}-character plaintext.",
        {
            "plaintext": plaintext,
            "charactersProcessed": total_chars,
            "columnsRead": columns,
            "rowsProcessed": rows,
        },
    )

    metadata = {
        "rows": rows,
        "columns": columns,
        "ranks": ranks,
        "readingOrder": reading_order,
        "normalizedText": normalized_text,
        "normalizedKey": normalized_key,
        "removedTextChars": removed_text_chars,
        "removedKeyChars": removed_key_chars,
    }

    return plaintext, builder.steps, metadata
