import app as app_module
from fastapi.testclient import TestClient


client = TestClient(app_module.app)
AUTH_HEADERS = {"Authorization": "Bearer cw_live_demo_only_replace_me"}


def test_health_check():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_scan_demo_shape():
    response = client.post(
        "/v1/scan",
        headers=AUTH_HEADERS,
        json={
            "address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            "chain": "base",
            "risk_mode": "balanced",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["wallet"].startswith("0x")
    assert data["chain"] == "base"
    assert 0 <= data["risk_score"] <= 100
    assert 0 <= data["health"] <= 100


def test_billing_demo_mode(monkeypatch):
    monkeypatch.setattr(app_module, "get_user_from_api_key", lambda _key: None)

    response = client.get("/v1/billing", headers=AUTH_HEADERS)

    assert response.status_code == 200
    assert response.json()["tier"] == "free"


def test_webhook_signature_round_trip():
    payload = {"title": "Test whale movement", "severity": "watch"}
    signature = app_module.sign_payload(payload, "test-secret")

    assert app_module.verify_webhook_signature(payload, signature, "test-secret")
