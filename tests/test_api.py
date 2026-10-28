import pytest
from fastapi.testclient import TestClient

from src.api.main import app
from src.api.policy import DecisionThresholds, decide

SAMPLE = {"LIMIT_BAL": 50000, "EDUCATION": 2, "MARRIAGE": 1, "PAY_0": 0, "PAY_2": 0, "PAY_3": 0, "PAY_4": 0, "PAY_5": 0, "PAY_6": 0,
          "BILL_AMT1": 20000, "BILL_AMT2": 19000, "BILL_AMT3": 18000, "BILL_AMT4": 17000, "BILL_AMT5": 16000, "BILL_AMT6": 15000,
          "PAY_AMT1": 1500, "PAY_AMT2": 1500, "PAY_AMT3": 1500, "PAY_AMT4": 1500, "PAY_AMT5": 1500, "PAY_AMT6": 1500, "age_band": "25-34"}


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_valid_request(client):
    r = client.post("/score", json=SAMPLE)
    assert r.status_code == 200
    body = r.json()
    assert 0 <= body["default_probability"] <= 1
    assert body["decision"] in {"approve", "refer", "decline"}
    assert len(body["top5_shap"]) == 5


def test_invalid_request_422(client):
    assert client.post("/score", json={**SAMPLE, "LIMIT_BAL": -5}).status_code == 422
    assert client.post("/score", json={k: v for k, v in SAMPLE.items() if k != "PAY_0"}).status_code == 422


def test_refer_requires_human_review(client):
    risky = {**SAMPLE, "PAY_0": 2, "PAY_2": 2}
    for payload in (SAMPLE, risky):
        body = client.post("/score", json=payload).json()
        assert body["requires_human_review"] == (body["decision"] == "refer")
    assert decide(0.45, 0, DecisionThresholds(0.3, 0.6)) == ("medium", "refer", True)
    assert decide(0.45, 1, DecisionThresholds(0.3, 0.6)) == ("medium", "refer", True)
    assert decide(0.1, 0, DecisionThresholds(0.3, 0.6))[1] == "approve"
    assert decide(0.8, 1, DecisionThresholds(0.3, 0.6))[1] == "decline"


def test_deterministic(client):
    results = [client.post("/score", json=SAMPLE).json() for _ in range(5)]
    assert all(r == results[0] for r in results)


def test_model_info(client):
    info = client.get("/model-info").json()
    for key in ("model_version", "policy_version", "training_data_checksum", "metrics", "notice"):
        assert key in info
    assert "not for real lending" in info["notice"]


def test_health(client):
    assert client.get("/health").json()["status"] == "ok"


def test_gui_and_decisions(client):
    r = client.get("/")
    assert r.status_code == 200 and "Fair Credit Scorer" in r.text
    client.post("/score", json=SAMPLE)
    rows = client.get("/decisions?limit=5").json()
    assert 1 <= len(rows) <= 5 and "decision" in rows[0]


def test_static_font_served(client):
    r = client.get("/static/fonts/manrope-latin-wght-normal.woff2")
    assert r.status_code == 200 and r.content[:4] == b"wOF2"
