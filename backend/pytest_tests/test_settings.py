"""
test_settings.py — Settings API Tests
======================================
Coverage:
  GET    /api/settings      — Settings lo
  POST   /api/settings      — Settings update karo
"""

import pytest
import requests

BASE_URL = "http://localhost:5000/api"

VALID_CREDENTIALS = {
    "email": "admin@gymsmart.com",
    "password": "superadmin123",
}


@pytest.fixture(scope="module")
def auth_headers():
    r = requests.post(f"{BASE_URL}/auth/login", json=VALID_CREDENTIALS)
    assert r.status_code == 200
    body = r.json()
    token = body.get("accessToken") or body.get("data", {}).get("accessToken")
    return {"Authorization": f"Bearer {token}"}


# ══════════════════════════════════════════════════════════════════════════════
# GET /api/settings
# ══════════════════════════════════════════════════════════════════════════════

class TestGetSettings:
    """GET /api/settings"""

    def test_get_settings_returns_200(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/settings", headers=auth_headers)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"

    def test_get_settings_returns_data(self, auth_headers):
        """Settings object valid fields ke sath aana chahiye."""
        r = requests.get(f"{BASE_URL}/api/settings", headers=auth_headers)
        body = r.json()
        settings = body.get("data") or body
        assert "gymName" in settings, f"gymName missing: {settings}"

    def test_get_settings_without_auth_returns_401(self):
        r = requests.get(f"{BASE_URL}/api/settings")
        assert r.status_code == 401


# ══════════════════════════════════════════════════════════════════════════════
# POST /api/settings
# ══════════════════════════════════════════════════════════════════════════════

class TestUpdateSettings:
    """POST /api/settings"""

    def test_update_settings_success(self, auth_headers):
        payload = {
            "gymName": "Pytest Gym",
            "ownerName": "Test Owner",
            "phone": "9876543210",
        }
        r = requests.post(f"{BASE_URL}/api/settings", json=payload, headers=auth_headers)
        assert r.status_code in (200, 201), f"Expected 200/201, got {r.status_code}: {r.text}"

    def test_update_settings_without_auth_returns_401(self):
        payload = {"gymName": "Hack Gym"}
        r = requests.post(f"{BASE_URL}/api/settings", json=payload)
        assert r.status_code == 401
