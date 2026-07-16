"""
conftest.py — GymSmart ERP Pytest Configuration & Shared Fixtures
=================================================================
Ye file saare test modules ke liye shared fixtures provide karti hai.
Base URL, auth token, aur helper functions yahan defined hain.

Run karne ke liye:
  pip install pytest requests
  pytest pytest_tests/ -v
"""

import pytest
import requests

# ─── Base Configuration ────────────────────────────────────────────────────────
BASE_URL = "http://localhost:5000/api"

ADMIN_CREDENTIALS = {
    "email": "admin@gymsmart.com",
    "password": "superadmin123",
}


# ─── Session-Scoped Auth Token ────────────────────────────────────────────────
@pytest.fixture(scope="session")
def auth_token():
    """
    Login karke JWT token fetch karta hai.
    Yeh token session bhar reuse hota hai.
    """
    response = requests.post(f"{BASE_URL}/auth/login", json=ADMIN_CREDENTIALS)
    assert response.status_code == 200, (
        f"Login failed: {response.status_code} — {response.text}"
    )
    data = response.json()
    token = data.get("data", {}).get("accessToken") or data.get("accessToken")
    assert token, "Access token not found in login response"
    return token


@pytest.fixture(scope="session")
def auth_headers(auth_token):
    """Authorization header dictionary with Bearer token."""
    return {"Authorization": f"Bearer {auth_token}"}


# ─── Helper: Authenticated GET ────────────────────────────────────────────────
@pytest.fixture(scope="session")
def api_get(auth_headers):
    def _get(path, params=None):
        return requests.get(f"{BASE_URL}{path}", headers=auth_headers, params=params)
    return _get


# ─── Helper: Authenticated POST ───────────────────────────────────────────────
@pytest.fixture(scope="session")
def api_post(auth_headers):
    def _post(path, payload):
        return requests.post(f"{BASE_URL}{path}", json=payload, headers=auth_headers)
    return _post


# ─── Helper: Authenticated PATCH ─────────────────────────────────────────────
@pytest.fixture(scope="session")
def api_patch(auth_headers):
    def _patch(path, payload):
        return requests.patch(f"{BASE_URL}{path}", json=payload, headers=auth_headers)
    return _patch


# ─── Helper: Authenticated DELETE ────────────────────────────────────────────
@pytest.fixture(scope="session")
def api_delete(auth_headers):
    def _delete(path):
        return requests.delete(f"{BASE_URL}{path}", headers=auth_headers)
    return _delete


# ─── Shared Plan ID (created once, reused) ───────────────────────────────────
@pytest.fixture(scope="session")
def created_plan_id(auth_headers):
    """Ek plan create karta hai aur uska ID return karta hai."""
    payload = {
        "name": "Test Gold Plan",
        "tier": "GOLD",
        "price1Month": 1500.0,
        "price3Month": 4000.0,
        "price6Month": 7500.0,
        "price12Month": 14000.0,
        "features": ["Weights", "Cardio", "Locker"],
        "isActive": True,
    }
    r = requests.post(f"{BASE_URL}/api/plans", json=payload, headers=auth_headers)
    if r.status_code in (200, 201):
        return r.json().get("id") or r.json().get("data", {}).get("id")
    # Fallback: fetch existing plans
    r2 = requests.get(f"{BASE_URL}/api/plans", headers=auth_headers)
    plans = r2.json()
    if isinstance(plans, list) and plans:
        return plans[0]["id"]
    if isinstance(plans, dict):
        lst = plans.get("data") or plans.get("plans") or []
        if lst:
            return lst[0]["id"]
    pytest.skip("Could not get a valid plan ID")
