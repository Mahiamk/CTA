from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_encrypt_endpoint_happy_path():
    response = client.post(
        "/api/cipher/encrypt",
        json={"text": "WEAREDISCOVEREDFLEEATONCE", "key": "ZEBRAS"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["result"] == "EVLNACDTESEAROFODEECWIREE"
    assert body["operation"] == "encrypt"
    assert len(body["steps"]) > 0
    assert body["metadata"]["columns"] == 6


def test_decrypt_endpoint_happy_path():
    response = client.post(
        "/api/cipher/decrypt",
        json={"text": "EVLNACDTESEAROFODEECWIREE", "key": "ZEBRAS"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["result"] == "WEAREDISCOVEREDFLEEATONCE"
    assert body["operation"] == "decrypt"


def test_encrypt_empty_text_returns_422():
    response = client.post("/api/cipher/encrypt", json={"text": "", "key": "KEY"})
    assert response.status_code == 422
    assert "detail" in response.json()


def test_encrypt_empty_key_returns_422():
    response = client.post("/api/cipher/encrypt", json={"text": "HELLO", "key": ""})
    assert response.status_code == 422


def test_encrypt_missing_field_returns_422():
    response = client.post("/api/cipher/encrypt", json={"text": "HELLO"})
    assert response.status_code == 422


def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
