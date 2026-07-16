"""
test_auth.py — Authentication API Tests
========================================
Coverage:
  POST /api/auth/login       — Login with valid / invalid credentials
  GET  /api/auth/me          — Get current user (requires JWT)
"""

import pytest
import requests

BASE_URL = "http://localhost:5000/api"

VALID_CREDENTIALS = {
    "email": "admin@gymsmart.com",
    "password": "superadmin123",
}


# ══════════════════════════════════════════════════════════════════════════════
# POST /api/auth/login
# ══════════════════════════════════════════════════════════════════════════════

class TestLogin:
    """POST /api/auth/login"""

    def test_login_success_returns_200(self):
        """Valid credentials se login hona chahiye aur 200 milna chahiye."""
        r = requests.post(f"{BASE_URL}/auth/login", json=VALID_CREDENTIALS)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"

    def test_login_success_returns_access_token(self):
        """Login response mein accessToken hona chahiye."""
        r = requests.post(f"{BASE_URL}/auth/login", json=VALID_CREDENTIALS)
        assert r.status_code == 200
        body = r.json()
        # Token can be at root level or nested under data
        token = (
            body.get("accessToken")
            or body.get("data", {}).get("accessToken")
        )
        assert token is not None, f"accessToken missing from response: {body}"
        assert isinstance(token, str) and len(token) > 10

    def test_login_success_returns_user_object(self):
        """Login response mein user object hona chahiye."""
        r = requests.post(f"{BASE_URL}/auth/login", json=VALID_CREDENTIALS)
        body = r.json()
        user = body.get("user") or body.get("data", {}).get("user")
        assert user is not None, "User object missing from login response"
        assert "email" in user
        assert "role" in user
        # Password should NOT be exposed
        assert "password" not in user

    def test_login_invalid_email_returns_401(self):
        """Galat email se 401 Unauthorized aana chahiye."""
        r = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": "nonexistent@gym.com", "password": "password123"},
        )
        assert r.status_code == 401, f"Expected 401, got {r.status_code}"

    def test_login_invalid_password_returns_401(self):
        """Sahi email aur galat password se 401 aana chahiye."""
        r = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": VALID_CREDENTIALS["email"], "password": "wrongpassword"},
        )
        assert r.status_code == 401, f"Expected 401, got {r.status_code}"

    def test_login_missing_email_returns_400(self):
        """Email field missing hone par 400 aana chahiye."""
        r = requests.post(
            f"{BASE_URL}/auth/login",
            json={"password": "superadmin123"},
        )
        assert r.status_code in (400, 422), f"Expected 400/422, got {r.status_code}"

    def test_login_missing_password_returns_400(self):
        """Password field missing hone par 400 aana chahiye."""
        r = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": "admin@gymsmart.com"},
        )
        assert r.status_code in (400, 422), f"Expected 400/422, got {r.status_code}"

    def test_login_invalid_email_format_returns_400(self):
        """Invalid email format pe 400 aana chahiye (class-validator)."""
        r = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": "not-an-email", "password": "superadmin123"},
        )
        assert r.status_code in (400, 422), f"Expected 400/422, got {r.status_code}"

    def test_login_short_password_returns_400(self):
        """6 characters se chhota password validation fail karna chahiye."""
        r = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": "admin@gymsmart.com", "password": "abc"},
        )
        assert r.status_code in (400, 422), f"Expected 400/422, got {r.status_code}"

    def test_login_empty_body_returns_400(self):
        """Empty body pe 400 aana chahiye."""
        r = requests.post(f"{BASE_URL}/auth/login", json={})
        assert r.status_code in (400, 422), f"Expected 400/422, got {r.status_code}"

    def test_login_returns_json(self):
        """Response Content-Type JSON hona chahiye."""
        r = requests.post(f"{BASE_URL}/auth/login", json=VALID_CREDENTIALS)
        assert "application/json" in r.headers.get("Content-Type", "")


# ══════════════════════════════════════════════════════════════════════════════
# GET /api/auth/me
# ══════════════════════════════════════════════════════════════════════════════

class TestGetMe:
    """GET /api/auth/me"""

    @pytest.fixture(autouse=True)
    def _get_token(self):
        """Login karke token le lo."""
        r = requests.post(f"{BASE_URL}/auth/login", json=VALID_CREDENTIALS)
        assert r.status_code == 200
        body = r.json()
        token = (
            body.get("accessToken")
            or body.get("data", {}).get("accessToken")
        )
        self.headers = {"Authorization": f"Bearer {token}"}

    def test_get_me_returns_200(self):
        """Valid token se /me call karne par 200 aana chahiye."""
        r = requests.get(f"{BASE_URL}/auth/me", headers=self.headers)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"

    def test_get_me_returns_user_fields(self):
        """Response mein required user fields hone chahiye."""
        r = requests.get(f"{BASE_URL}/auth/me", headers=self.headers)
        body = r.json()
        user = body.get("data") or body
        assert "id" in user or "email" in user, f"User fields missing: {body}"
        assert "password" not in str(body), "Password should not be in response"

    def test_get_me_without_token_returns_401(self):
        """Token ke bina /me call karne par 401 aana chahiye."""
        r = requests.get(f"{BASE_URL}/auth/me")
        assert r.status_code == 401, f"Expected 401, got {r.status_code}"

    def test_get_me_with_invalid_token_returns_401(self):
        """Invalid/fake token se 401 aana chahiye."""
        r = requests.get(
            f"{BASE_URL}/auth/me",
            headers={"Authorization": "Bearer fakejwttokenxyz"},
        )
        assert r.status_code == 401, f"Expected 401, got {r.status_code}"

    def test_get_me_with_malformed_bearer(self):
        """Malformed Authorization header se 401 aana chahiye."""
        r = requests.get(
            f"{BASE_URL}/auth/me",
            headers={"Authorization": "NotBearer tokenvalue"},
        )
        assert r.status_code == 401, f"Expected 401, got {r.status_code}"

    def test_get_me_response_is_json(self):
        """Response JSON format mein hona chahiye."""
        r = requests.get(f"{BASE_URL}/auth/me", headers=self.headers)
        assert "application/json" in r.headers.get("Content-Type", "")
