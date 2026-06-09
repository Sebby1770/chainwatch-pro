# Simple pytest for billing endpoints (run with mocks)
# pip install pytest pytest-asyncio
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
import sys
sys.path.append('.')
from app import app, SubscribeReq

client = TestClient(app)

def test_billing_demo():
    # Uses demo key
    response = client.get("/v1/billing", headers={"Authorization": "Bearer cw_live_demo_only_replace_me"})
    assert response.status_code == 200
    data = response.json()
    assert "tier" in data

@patch('app.stripe.Subscription.create')
def test_subscribe_mock(mock_sub):
    mock_sub.return_value = type('obj', (object,), {'id': 'sub_123', 'status': 'active', 'current_period_end': 1234567890})()
    response = client.post("/v1/subscribe", 
        json={"plan": "Operator"},
        headers={"Authorization": "Bearer cw_live_demo_only_replace_me"})
    assert response.status_code == 200
    assert "status" in response.json()