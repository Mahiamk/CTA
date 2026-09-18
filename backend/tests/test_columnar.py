import pytest

from app.algorithms.columnar import (
    CipherValidationError,
    decrypt,
    encrypt,
    normalize_text,
    rank_key,
)


# ---------------------------------------------------------------------------
# Known-answer test (classic textbook example)
# ---------------------------------------------------------------------------

def test_encrypt_known_answer():
    ciphertext, steps, metadata = encrypt("WEAREDISCOVEREDFLEEATONCE", "ZEBRAS")
    assert ciphertext == "EVLNACDTESEAROFODEECWIREE"
    assert metadata["rows"] == 5
    assert metadata["columns"] == 6
    assert metadata["ranks"] == [6, 3, 2, 4, 1, 5]
    assert metadata["readingOrder"] == [4, 2, 1, 3, 5, 0]
    assert steps[0]["type"] == "input"
    assert steps[-1]["type"] == "complete"
    assert steps[-1]["state"]["ciphertext"] == ciphertext


def test_decrypt_known_answer():
    plaintext, steps, metadata = decrypt("EVLNACDTESEAROFODEECWIREE", "ZEBRAS")
    assert plaintext == "WEAREDISCOVEREDFLEEATONCE"
    assert steps[0]["type"] == "input"
    assert steps[-1]["type"] == "complete"
    assert steps[-1]["state"]["plaintext"] == plaintext


# ---------------------------------------------------------------------------
# Round trip
# ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    "text,key",
    [
        ("WEAREDISCOVEREDFLEEATONCE", "ZEBRAS"),
        ("ATTACKATDAWN", "KEY"),
        ("THEQUICKBROWNFOXJUMPSOVERTHELAZYDOG", "CRYPTOGRAPHY"),
        ("A", "Z"),
        ("HELLOWORLD", "BALLOON"),  # duplicate key letters
        ("X", "ABCDEFGHIJ"),  # key longer than text
    ],
)
def test_round_trip(text, key):
    ciphertext, _, _ = encrypt(text, key)
    recovered, _, _ = decrypt(ciphertext, key)
    normalized_text, _ = normalize_text(text)
    assert recovered == normalized_text


# ---------------------------------------------------------------------------
# Normalization
# ---------------------------------------------------------------------------

def test_normalize_strips_spaces_and_punctuation():
    normalized, removed = normalize_text("We are, discovered! Flee at once.")
    assert normalized == "WEAREDISCOVEREDFLEEATONCE"
    assert all(not (c["char"].isalnum()) for c in removed)


def test_normalize_uppercases():
    normalized, _ = normalize_text("hello")
    assert normalized == "HELLO"


# ---------------------------------------------------------------------------
# Key ranking / duplicate handling
# ---------------------------------------------------------------------------

def test_rank_key_matches_known_example():
    ranks, reading_order, letters = rank_key("ZEBRAS")
    assert ranks == [6, 3, 2, 4, 1, 5]
    assert reading_order == [4, 2, 1, 3, 5, 0]
    assert [l["char"] for l in letters] == list("ZEBRAS")


def test_rank_key_duplicate_letters_preserve_original_order():
    # BALLOON -> B A L L O O N
    ranks, reading_order, _ = rank_key("BALLOON")
    # Alphabetical: A(1) B(0) L(2) L(3) N(6) O(4) O(5)
    assert ranks[1] == 1  # A
    assert ranks[0] == 2  # B
    assert ranks[2] == 3  # first L keeps priority over second L
    assert ranks[3] == 4  # second L
    assert ranks[6] == 5  # N
    assert ranks[4] == 6  # first O keeps priority over second O
    assert ranks[5] == 7  # second O
    assert reading_order == [1, 0, 2, 3, 6, 4, 5]


# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------

def test_empty_text_raises():
    with pytest.raises(CipherValidationError):
        encrypt("", "KEY")


def test_empty_key_raises():
    with pytest.raises(CipherValidationError):
        encrypt("HELLO", "")


def test_text_with_only_punctuation_raises():
    with pytest.raises(CipherValidationError):
        encrypt("....,,,!!!", "KEY")


def test_key_with_only_punctuation_raises():
    with pytest.raises(CipherValidationError):
        encrypt("HELLO", "!!!")


def test_single_character_key():
    ciphertext, _, metadata = encrypt("HELLOWORLD", "K")
    assert metadata["columns"] == 1
    assert ciphertext == "HELLOWORLD"


def test_key_longer_than_plaintext_does_not_crash():
    ciphertext, steps, metadata = encrypt("HI", "ABCDEFGH")
    assert metadata["rows"] == 1
    assert metadata["columns"] == 8
    assert len(ciphertext) == 2


def test_plaintext_exactly_divisible_by_key_length():
    _, _, metadata = encrypt("ABCDEFGHIJKL", "KEY")  # 12 chars / 3 cols
    assert metadata["rows"] == 4
    assert metadata["columns"] == 3


def test_plaintext_not_divisible_by_key_length():
    _, _, metadata = encrypt("ABCDEFGHIJK", "KEY")  # 11 chars / 3 cols
    assert metadata["rows"] == 4
    assert metadata["columns"] == 3


def test_single_character_plaintext():
    ciphertext, _, metadata = encrypt("A", "KEY")
    assert ciphertext == "A"
    assert metadata["rows"] == 1


def test_key_with_numbers_is_allowed():
    ciphertext, _, metadata = encrypt("HELLOWORLD", "K3Y2")
    assert metadata["columns"] == 4
    assert len(ciphertext) == 10


# ---------------------------------------------------------------------------
# Step trace internal consistency
# ---------------------------------------------------------------------------

def test_step_numbers_are_sequential():
    _, steps, _ = encrypt("WEAREDISCOVEREDFLEEATONCE", "ZEBRAS")
    for i, step in enumerate(steps, start=1):
        assert step["step"] == i


def test_place_character_steps_cover_every_character():
    text = "WEAREDISCOVEREDFLEEATONCE"
    _, steps, _ = encrypt(text, "ZEBRAS")
    place_steps = [s for s in steps if s["type"] == "place_character"]
    assert len(place_steps) == len(text)
    assert "".join(s["state"]["character"] for s in place_steps) == text


def test_read_column_steps_reconstruct_ciphertext():
    ciphertext, steps, _ = encrypt("WEAREDISCOVEREDFLEEATONCE", "ZEBRAS")
    read_steps = [s for s in steps if s["type"] == "read_column"]
    assert "".join(s["state"]["columnText"] for s in read_steps) == ciphertext
    # Reading order must match the ranks (ascending)
    ranks_in_order = [s["state"]["rank"] for s in read_steps]
    assert ranks_in_order == sorted(ranks_in_order)


def test_distribute_column_steps_reconstruct_plaintext_via_rows():
    plaintext, steps, metadata = decrypt("EVLNACDTESEAROFODEECWIREE", "ZEBRAS")
    row_steps = [s for s in steps if s["type"] == "read_row"]
    assert "".join(s["state"]["rowText"] for s in row_steps) == plaintext
    assert len(row_steps) == metadata["rows"]


def test_final_step_matches_metadata_counts():
    text = "WEAREDISCOVEREDFLEEATONCE"
    _, steps, metadata = encrypt(text, "ZEBRAS")
    final = steps[-1]
    assert final["state"]["charactersProcessed"] == len(text)
    assert final["state"]["columnsRead"] == metadata["columns"]
    assert final["state"]["rowsProcessed"] == metadata["rows"]
