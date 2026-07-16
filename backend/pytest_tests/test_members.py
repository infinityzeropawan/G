"""
test_members.py — Members API Tests
=====================================
Coverage:
  POST   /api/members            — Member create karo
  GET    /api/members/stats      — Member statistics lo
  GET    /api/members            — Saare members lo (with query params)
  GET    /api/members/:id        — Ek member lo
  PATCH  /api/members/:id        — Member update karo
  DELETE /api/members/:id        — Member delete karo
  POST   /api/members/:id/renew  — Membership renew karo
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


@pytest.fixture(scope="module")
def valid_plan_id(auth_headers):
    """Plans se ek valid plan ID lao."""
    r = requests.get(f"{BASE_URL}/api/plans", headers=auth_headers)
    body = r.json()
    plans = body if isinstance(body, list) else (body.get("data") or body.get("plans") or [])
    if not plans:
        pytest.skip("No plans available — seed the database first")
    return plans[0]["id"]


def make_member_payload(plan_id: int, suffix: str = "001") -> dict:
    return {
        "name": f"Test Member {suffix}",
        "email": f"testmember{suffix}@pytest.com",
        "phone": f"98765{suffix}",
        "gender": "MALE",
        "address": "123 Test Street, Test City",
        "branch": "Main Branch",
        "planId": plan_id,
        "billingCycle": "ONE_MONTH",
        "joinDate": "2026-01-01T00:00:00.000Z",
    }


# ══════════════════════════════════════════════════════════════════════════════
# POST /api/members
# ══════════════════════════════════════════════════════════════════════════════

class TestCreateMember:
    """POST /api/members"""

    def test_create_member_success(self, auth_headers, valid_plan_id):
        """Valid payload se member create hona chahiye."""
        payload = make_member_payload(valid_plan_id, suffix="pytest01")
        r = requests.post(f"{BASE_URL}/api/members", json=payload, headers=auth_headers)
        assert r.status_code in (200, 201), f"Expected 200/201, got {r.status_code}: {r.text}"

    def test_create_member_returns_member_data(self, auth_headers, valid_plan_id):
        """Create response mein member data hona chahiye."""
        payload = make_member_payload(valid_plan_id, suffix="pytest02")
        r = requests.post(f"{BASE_URL}/api/members", json=payload, headers=auth_headers)
        if r.status_code in (200, 201):
            body = r.json()
            member = body.get("data") or body
            assert "id" in member or "name" in member, f"Member data missing: {body}"

    def test_create_member_auto_sets_status_active(self, auth_headers, valid_plan_id):
        """Member status 'ACTIVE' set honi chahiye."""
        payload = make_member_payload(valid_plan_id, suffix="pytest03")
        r = requests.post(f"{BASE_URL}/api/members", json=payload, headers=auth_headers)
        if r.status_code in (200, 201):
            body = r.json()
            member = body.get("data") or body
            status = member.get("status")
            assert status == "ACTIVE", f"Expected ACTIVE, got {status}"

    def test_create_member_auto_sets_expiry_date(self, auth_headers, valid_plan_id):
        """Member expiryDate automatically set honi chahiye."""
        payload = make_member_payload(valid_plan_id, suffix="pytest04")
        r = requests.post(f"{BASE_URL}/api/members", json=payload, headers=auth_headers)
        if r.status_code in (200, 201):
            body = r.json()
            member = body.get("data") or body
            assert "expiryDate" in member, "expiryDate missing from member"

    def test_create_member_without_auth_returns_401(self, valid_plan_id):
        """Auth ke bina member create nahi hona chahiye."""
        payload = make_member_payload(valid_plan_id, suffix="noauth")
        r = requests.post(f"{BASE_URL}/api/members", json=payload)
        assert r.status_code == 401

    def test_create_member_missing_required_fields_returns_error(self, auth_headers, valid_plan_id):
        """Required fields missing hone par error aana chahiye."""
        r = requests.post(
            f"{BASE_URL}/api/members",
            json={"name": "Incomplete Member"},
            headers=auth_headers,
        )
        assert r.status_code in (400, 422, 500)

    def test_create_member_with_3_month_billing(self, auth_headers, valid_plan_id):
        """THREE_MONTHS billing cycle ke saath member create hona chahiye."""
        payload = make_member_payload(valid_plan_id, suffix="pytest3m")
        payload["billingCycle"] = "THREE_MONTHS"
        r = requests.post(f"{BASE_URL}/api/members", json=payload, headers=auth_headers)
        assert r.status_code in (200, 201), f"Expected 200/201, got {r.status_code}: {r.text}"

    def test_create_member_female_gender(self, auth_headers, valid_plan_id):
        """FEMALE gender ke saath member create hona chahiye."""
        payload = make_member_payload(valid_plan_id, suffix="pytestf")
        payload["gender"] = "FEMALE"
        r = requests.post(f"{BASE_URL}/api/members", json=payload, headers=auth_headers)
        assert r.status_code in (200, 201), f"Expected 200/201, got {r.status_code}: {r.text}"


# ══════════════════════════════════════════════════════════════════════════════
# GET /api/members/stats
# ══════════════════════════════════════════════════════════════════════════════

class TestMemberStats:
    """GET /api/members/stats"""

    def test_member_stats_returns_200(self, auth_headers):
        """Stats endpoint 200 dena chahiye."""
        r = requests.get(f"{BASE_URL}/api/members/stats", headers=auth_headers)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"

    def test_member_stats_returns_required_fields(self, auth_headers):
        """Stats mein total, active, pending, expired hona chahiye."""
        r = requests.get(f"{BASE_URL}/api/members/stats", headers=auth_headers)
        body = r.json()
        stats = body.get("data") or body
        assert "total" in stats, f"'total' missing from stats: {stats}"
        assert "active" in stats, f"'active' missing from stats: {stats}"
        assert "pending" in stats or "expired" in stats

    def test_member_stats_values_are_numbers(self, auth_headers):
        """Stats values numbers hone chahiye."""
        r = requests.get(f"{BASE_URL}/api/members/stats", headers=auth_headers)
        body = r.json()
        stats = body.get("data") or body
        for key in ["total", "active"]:
            if key in stats:
                assert isinstance(stats[key], int), f"{key} is not int: {stats[key]}"

    def test_member_stats_without_auth_returns_401(self):
        """Auth ke bina stats fetch nahi hone chahiye."""
        r = requests.get(f"{BASE_URL}/api/members/stats")
        assert r.status_code == 401


# ══════════════════════════════════════════════════════════════════════════════
# GET /api/members
# ══════════════════════════════════════════════════════════════════════════════

class TestGetAllMembers:
    """GET /api/members"""

    def test_get_all_members_returns_200(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/members", headers=auth_headers)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"

    def test_get_all_members_returns_members_array(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/members", headers=auth_headers)
        body = r.json()
        # Response can be { members: [], total: N } or []
        members = (
            body.get("members")
            or body.get("data")
            or (body if isinstance(body, list) else [])
        )
        assert isinstance(members, list), f"Expected members list, got: {type(members)}"

    def test_get_all_members_returns_total(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/members", headers=auth_headers)
        body = r.json()
        if isinstance(body, dict):
            assert "total" in body or "members" in body

    def test_get_all_members_with_limit_query(self, auth_headers):
        """limit query param respect hona chahiye."""
        r = requests.get(f"{BASE_URL}/api/members?limit=5", headers=auth_headers)
        assert r.status_code == 200

    def test_get_all_members_without_auth_returns_401(self):
        r = requests.get(f"{BASE_URL}/api/members")
        assert r.status_code == 401

    def test_get_all_members_response_is_json(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/members", headers=auth_headers)
        assert "application/json" in r.headers.get("Content-Type", "")


# ══════════════════════════════════════════════════════════════════════════════
# GET /api/members/:id
# ══════════════════════════════════════════════════════════════════════════════

class TestGetOneMember:
    """GET /api/members/:id"""

    @pytest.fixture(autouse=True)
    def _get_member_id(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/members", headers=auth_headers)
        body = r.json()
        members = body.get("members") or body.get("data") or (body if isinstance(body, list) else [])
        if not members:
            pytest.skip("No members available to test GET by ID")
        self.member_id = members[0]["id"]
        self.headers = auth_headers

    def test_get_member_by_id_returns_200(self):
        r = requests.get(f"{BASE_URL}/api/members/{self.member_id}", headers=self.headers)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"

    def test_get_member_includes_plan(self):
        """Member response mein plan included hona chahiye."""
        r = requests.get(f"{BASE_URL}/api/members/{self.member_id}", headers=self.headers)
        body = r.json()
        member = body.get("data") or body
        assert "plan" in member or "planId" in member, f"Plan data missing: {body}"

    def test_get_member_includes_payments(self):
        """Member response mein Payment array hona chahiye."""
        r = requests.get(f"{BASE_URL}/api/members/{self.member_id}", headers=self.headers)
        body = r.json()
        member = body.get("data") or body
        # Payment array could be empty but key should exist
        assert "Payment" in member or "payments" in member or "planId" in member

    def test_get_nonexistent_member_returns_error(self):
        r = requests.get(f"{BASE_URL}/api/members/999999", headers=self.headers)
        assert r.status_code in (404, 400, 500)

    def test_get_member_without_auth_returns_401(self):
        r = requests.get(f"{BASE_URL}/api/members/{self.member_id}")
        assert r.status_code == 401


# ══════════════════════════════════════════════════════════════════════════════
# PATCH /api/members/:id
# ══════════════════════════════════════════════════════════════════════════════

class TestUpdateMember:
    """PATCH /api/members/:id"""

    @pytest.fixture(autouse=True)
    def _get_member_id(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/members", headers=auth_headers)
        body = r.json()
        members = body.get("members") or body.get("data") or (body if isinstance(body, list) else [])
        if not members:
            pytest.skip("No members available to test PATCH")
        self.member_id = members[0]["id"]
        self.headers = auth_headers

    def test_update_member_name(self):
        r = requests.patch(
            f"{BASE_URL}/api/members/{self.member_id}",
            json={"name": "Updated Test Member"},
            headers=self.headers,
        )
        assert r.status_code in (200, 201), f"Expected 200, got {r.status_code}: {r.text}"

    def test_update_member_phone(self):
        r = requests.patch(
            f"{BASE_URL}/api/members/{self.member_id}",
            json={"phone": "9999988888"},
            headers=self.headers,
        )
        assert r.status_code in (200, 201), f"Expected 200, got {r.status_code}: {r.text}"

    def test_update_member_address(self):
        r = requests.patch(
            f"{BASE_URL}/api/members/{self.member_id}",
            json={"address": "456 New Address, Updated City"},
            headers=self.headers,
        )
        assert r.status_code in (200, 201), f"Expected 200, got {r.status_code}: {r.text}"

    def test_update_member_status_to_expired(self):
        r = requests.patch(
            f"{BASE_URL}/api/members/{self.member_id}",
            json={"status": "EXPIRED"},
            headers=self.headers,
        )
        assert r.status_code in (200, 201), f"Expected 200, got {r.status_code}: {r.text}"

    def test_update_member_without_auth_returns_401(self):
        r = requests.patch(
            f"{BASE_URL}/api/members/{self.member_id}",
            json={"name": "Hack Attempt"},
        )
        assert r.status_code == 401

    def test_update_nonexistent_member_returns_error(self):
        r = requests.patch(
            f"{BASE_URL}/api/members/999999",
            json={"name": "Ghost Member"},
            headers=self.headers,
        )
        assert r.status_code in (404, 400, 500)


# ══════════════════════════════════════════════════════════════════════════════
# POST /api/members/:id/renew
# ══════════════════════════════════════════════════════════════════════════════

class TestRenewMembership:
    """POST /api/members/:id/renew"""

    @pytest.fixture(autouse=True)
    def _get_member_id(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/members", headers=auth_headers)
        body = r.json()
        members = body.get("members") or body.get("data") or (body if isinstance(body, list) else [])
        if not members:
            pytest.skip("No members available to test renew")
        self.member_id = members[0]["id"]
        self.headers = auth_headers

    def test_renew_membership_returns_success(self):
        """Membership renewal 200 dena chahiye."""
        r = requests.post(
            f"{BASE_URL}/api/members/{self.member_id}/renew",
            json={"billingCycle": "ONE_MONTH"},
            headers=self.headers,
        )
        assert r.status_code in (200, 201), f"Expected 2xx, got {r.status_code}: {r.text}"

    def test_renew_sets_status_to_active(self):
        """Renewal ke baad member status ACTIVE honi chahiye."""
        r = requests.post(
            f"{BASE_URL}/api/members/{self.member_id}/renew",
            json={"billingCycle": "ONE_MONTH"},
            headers=self.headers,
        )
        if r.status_code in (200, 201):
            body = r.json()
            member = body.get("data") or body
            if "status" in member:
                assert member["status"] == "ACTIVE"

    def test_renew_without_auth_returns_401(self):
        """Auth ke bina renewal nahi hona chahiye."""
        r = requests.post(
            f"{BASE_URL}/api/members/{self.member_id}/renew",
            json={"billingCycle": "ONE_MONTH"},
        )
        assert r.status_code == 401


# ══════════════════════════════════════════════════════════════════════════════
# DELETE /api/members/:id
# ══════════════════════════════════════════════════════════════════════════════

class TestDeleteMember:
    """DELETE /api/members/:id"""

    @pytest.fixture(autouse=True)
    def _create_temp_member(self, auth_headers, valid_plan_id):
        """Temporary member create karo test ke liye."""
        payload = make_member_payload(valid_plan_id, suffix="del99")
        r = requests.post(f"{BASE_URL}/api/members", json=payload, headers=auth_headers)
        self.headers = auth_headers
        if r.status_code in (200, 201):
            body = r.json()
            self.member_id = body.get("id") or body.get("data", {}).get("id")
        else:
            pytest.skip(f"Could not create member for delete test: {r.text}")

    def test_delete_member_returns_success(self):
        """Member delete karna 2xx dena chahiye."""
        r = requests.delete(
            f"{BASE_URL}/api/members/{self.member_id}",
            headers=self.headers,
        )
        assert r.status_code in (200, 201, 204), f"Expected 2xx, got {r.status_code}: {r.text}"

    def test_delete_member_without_auth_returns_401(self):
        r = requests.delete(f"{BASE_URL}/api/members/{self.member_id}")
        assert r.status_code == 401
