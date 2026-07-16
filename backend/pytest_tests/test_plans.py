"""
test_plans.py — Membership Plans API Tests
===========================================
Coverage:
  POST   /api/plans          — Plan create karo
  GET    /api/plans          — Saare plans lo
  GET    /api/plans/:id      — Ek plan lo
  PATCH  /api/plans/:id      — Plan update karo
  DELETE /api/plans/:id      — Plan delete (soft) karo
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


# ─── Sample Plan Payload ──────────────────────────────────────────────────────
PLAN_PAYLOAD = {
    "name": "Pytest Basic Plan",
    "tier": "BASIC",
    "price1Month": 999.0,
    "price3Month": 2700.0,
    "price6Month": 5000.0,
    "price12Month": 9500.0,
    "features": ["Gym Access", "Locker"],
    "isActive": True,
}


# ══════════════════════════════════════════════════════════════════════════════
# POST /api/plans
# ══════════════════════════════════════════════════════════════════════════════

class TestCreatePlan:
    """POST /api/plans"""

    def test_create_plan_success(self, auth_headers):
        """Plan successfully create hona chahiye."""
        r = requests.post(f"{BASE_URL}/api/plans", json=PLAN_PAYLOAD, headers=auth_headers)
        assert r.status_code in (200, 201), f"Expected 200/201, got {r.status_code}: {r.text}"

    def test_create_plan_returns_id(self, auth_headers):
        """Create response mein plan ID hona chahiye."""
        r = requests.post(f"{BASE_URL}/api/plans", json=PLAN_PAYLOAD, headers=auth_headers)
        if r.status_code in (200, 201):
            body = r.json()
            plan_id = body.get("id") or body.get("data", {}).get("id")
            assert plan_id is not None, f"Plan ID missing: {body}"

    def test_create_plan_without_auth_returns_401(self):
        """Auth token ke bina plan create nahi hona chahiye."""
        r = requests.post(f"{BASE_URL}/api/plans", json=PLAN_PAYLOAD)
        assert r.status_code == 401, f"Expected 401, got {r.status_code}"

    def test_create_plan_response_is_json(self, auth_headers):
        """Response JSON hona chahiye."""
        r = requests.post(f"{BASE_URL}/api/plans", json=PLAN_PAYLOAD, headers=auth_headers)
        assert "application/json" in r.headers.get("Content-Type", "")


# ══════════════════════════════════════════════════════════════════════════════
# GET /api/plans
# ══════════════════════════════════════════════════════════════════════════════

class TestGetAllPlans:
    """GET /api/plans"""

    def test_get_all_plans_returns_200(self, auth_headers):
        """Saare plans successfully fetch hone chahiye."""
        r = requests.get(f"{BASE_URL}/api/plans", headers=auth_headers)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"

    def test_get_all_plans_returns_list(self, auth_headers):
        """Plans response list hona chahiye."""
        r = requests.get(f"{BASE_URL}/api/plans", headers=auth_headers)
        body = r.json()
        # Can be array or object with array inside
        plans = body if isinstance(body, list) else (body.get("data") or body.get("plans") or body)
        assert isinstance(plans, list), f"Expected list, got: {type(plans)}"

    def test_get_all_plans_without_auth_returns_401(self):
        """Auth ke bina plans fetch nahi hone chahiye."""
        r = requests.get(f"{BASE_URL}/api/plans")
        assert r.status_code == 401, f"Expected 401, got {r.status_code}"

    def test_get_all_plans_returns_json(self, auth_headers):
        """Response JSON format mein hona chahiye."""
        r = requests.get(f"{BASE_URL}/api/plans", headers=auth_headers)
        assert "application/json" in r.headers.get("Content-Type", "")


# ══════════════════════════════════════════════════════════════════════════════
# GET /api/plans/:id
# ══════════════════════════════════════════════════════════════════════════════

class TestGetOnePlan:
    """GET /api/plans/:id"""

    @pytest.fixture(autouse=True)
    def _get_plan_id(self, auth_headers):
        """Test ke liye ek valid plan ID lelo."""
        r = requests.get(f"{BASE_URL}/api/plans", headers=auth_headers)
        body = r.json()
        plans = body if isinstance(body, list) else (body.get("data") or body.get("plans") or [])
        if not plans:
            pytest.skip("No plans available to test GET by ID")
        self.plan_id = plans[0]["id"]
        self.headers = auth_headers

    def test_get_plan_by_id_returns_200(self):
        """Valid plan ID se 200 aana chahiye."""
        r = requests.get(f"{BASE_URL}/api/plans/{self.plan_id}", headers=self.headers)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"

    def test_get_plan_by_id_returns_correct_data(self):
        """Response mein sahi plan data hona chahiye."""
        r = requests.get(f"{BASE_URL}/api/plans/{self.plan_id}", headers=self.headers)
        body = r.json()
        plan = body.get("data") or body
        assert "id" in plan or "name" in plan

    def test_get_nonexistent_plan_returns_error(self):
        """Non-existent plan ID se error aana chahiye."""
        r = requests.get(f"{BASE_URL}/api/plans/999999", headers=self.headers)
        assert r.status_code in (404, 400, 500), f"Unexpected status: {r.status_code}"

    def test_get_plan_without_auth_returns_401(self):
        """Auth ke bina plan fetch nahi hona chahiye."""
        r = requests.get(f"{BASE_URL}/api/plans/{self.plan_id}")
        assert r.status_code == 401


# ══════════════════════════════════════════════════════════════════════════════
# PATCH /api/plans/:id
# ══════════════════════════════════════════════════════════════════════════════

class TestUpdatePlan:
    """PATCH /api/plans/:id"""

    @pytest.fixture(autouse=True)
    def _get_plan_id(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/plans", headers=auth_headers)
        body = r.json()
        plans = body if isinstance(body, list) else (body.get("data") or body.get("plans") or [])
        if not plans:
            pytest.skip("No plans available to test PATCH")
        self.plan_id = plans[0]["id"]
        self.headers = auth_headers

    def test_update_plan_returns_200(self):
        """Plan update karna 200 dena chahiye."""
        r = requests.patch(
            f"{BASE_URL}/api/plans/{self.plan_id}",
            json={"name": "Updated Plan Name"},
            headers=self.headers,
        )
        assert r.status_code in (200, 201), f"Expected 200, got {r.status_code}: {r.text}"

    def test_update_plan_price_returns_200(self):
        """Plan ka price update karna chahiye."""
        r = requests.patch(
            f"{BASE_URL}/api/plans/{self.plan_id}",
            json={"price1Month": 1200.0},
            headers=self.headers,
        )
        assert r.status_code in (200, 201), f"Expected 200, got {r.status_code}: {r.text}"

    def test_update_plan_without_auth_returns_401(self):
        """Auth ke bina update nahi hona chahiye."""
        r = requests.patch(
            f"{BASE_URL}/api/plans/{self.plan_id}",
            json={"name": "Hack Attempt"},
        )
        assert r.status_code == 401

    def test_update_nonexistent_plan_returns_error(self):
        """Non-existent plan update karne par error aana chahiye."""
        r = requests.patch(
            f"{BASE_URL}/api/plans/999999",
            json={"name": "Ghost Plan"},
            headers=self.headers,
        )
        assert r.status_code in (404, 400, 500)


# ══════════════════════════════════════════════════════════════════════════════
# DELETE /api/plans/:id (Soft Delete)
# ══════════════════════════════════════════════════════════════════════════════

class TestDeletePlan:
    """DELETE /api/plans/:id"""

    @pytest.fixture(autouse=True)
    def _create_temp_plan(self, auth_headers):
        """Ek temporary plan create karo aur usse delete karo."""
        payload = {
            "name": "Temp Plan To Delete",
            "tier": "PREMIUM",
            "price1Month": 2000.0,
            "price3Month": 5500.0,
            "price6Month": 10000.0,
            "price12Month": 18000.0,
            "features": ["All Access"],
            "isActive": True,
        }
        r = requests.post(f"{BASE_URL}/api/plans", json=payload, headers=auth_headers)
        self.headers = auth_headers
        if r.status_code in (200, 201):
            body = r.json()
            self.plan_id = body.get("id") or body.get("data", {}).get("id")
        else:
            # Use any existing plan
            r2 = requests.get(f"{BASE_URL}/api/plans", headers=auth_headers)
            body2 = r2.json()
            plans = body2 if isinstance(body2, list) else (body2.get("data") or body2.get("plans") or [])
            if plans:
                self.plan_id = plans[0]["id"]
            else:
                pytest.skip("Cannot get plan ID for delete test")

    def test_delete_plan_returns_success(self):
        """Plan delete karna success return karna chahiye."""
        r = requests.delete(
            f"{BASE_URL}/api/plans/{self.plan_id}",
            headers=self.headers,
        )
        assert r.status_code in (200, 201, 204), f"Expected 2xx, got {r.status_code}: {r.text}"

    def test_delete_plan_without_auth_returns_401(self):
        """Auth ke bina delete nahi hona chahiye."""
        r = requests.delete(f"{BASE_URL}/api/plans/{self.plan_id}")
        assert r.status_code == 401
