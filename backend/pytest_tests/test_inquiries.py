"""
test_inquiries.py — Inquiries API Tests
========================================
Coverage:
  GET    /api/inquiries          — Saari inquiries lo
  POST   /api/inquiries          — Inquiry create karo
  GET    /api/inquiries/stats    — Inquiries stats lo
  GET    /api/inquiries/:id      — Ek inquiry lo
  PATCH  /api/inquiries/:id      — Inquiry update karo
  DELETE /api/inquiries/:id      — Inquiry delete karo
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


def make_inquiry_payload(suffix: str = "001") -> dict:
    return {
        "name": f"Test Inquiry {suffix}",
        "phone": f"88888{suffix}",
        "email": f"inquiry{suffix}@pytest.com",
        "interest": "Gold Membership",
        "status": "NEW",
        "source": "Website",
        "notes": "Called for pricing details",
    }


# ══════════════════════════════════════════════════════════════════════════════
# POST /api/inquiries
# ══════════════════════════════════════════════════════════════════════════════

class TestCreateInquiry:
    """POST /api/inquiries"""

    def test_create_inquiry_success(self, auth_headers):
        r = requests.post(
            f"{BASE_URL}/api/inquiries",
            json=make_inquiry_payload("py01"),
            headers=auth_headers,
        )
        assert r.status_code in (200, 201), f"Expected 200/201, got {r.status_code}: {r.text}"

    def test_create_inquiry_returns_id(self, auth_headers):
        r = requests.post(
            f"{BASE_URL}/api/inquiries",
            json=make_inquiry_payload("py02"),
            headers=auth_headers,
        )
        if r.status_code in (200, 201):
            body = r.json()
            inquiry = body.get("data") or body
            assert "id" in inquiry, f"Inquiry ID missing: {body}"

    def test_create_inquiry_without_auth_returns_401(self):
        r = requests.post(f"{BASE_URL}/api/inquiries", json=make_inquiry_payload("noauth"))
        assert r.status_code == 401


# ══════════════════════════════════════════════════════════════════════════════
# GET /api/inquiries
# ══════════════════════════════════════════════════════════════════════════════

class TestGetAllInquiries:
    """GET /api/inquiries"""

    def test_get_all_inquiries_returns_200(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/inquiries", headers=auth_headers)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"

    def test_get_all_inquiries_returns_list(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/inquiries", headers=auth_headers)
        body = r.json()
        inquiries = body.get("inquiries") or body.get("data") or (body if isinstance(body, list) else None)
        assert inquiries is not None, f"Inquiries list missing: {body}"

    def test_get_all_inquiries_without_auth_returns_401(self):
        r = requests.get(f"{BASE_URL}/api/inquiries")
        assert r.status_code == 401


# ══════════════════════════════════════════════════════════════════════════════
# GET /api/inquiries/stats
# ══════════════════════════════════════════════════════════════════════════════

class TestInquiriesStats:
    """GET /api/inquiries/stats"""

    def test_inquiries_stats_returns_200(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/inquiries/stats", headers=auth_headers)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"

    def test_inquiries_stats_returns_required_fields(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/inquiries/stats", headers=auth_headers)
        body = r.json()
        stats = body.get("data") or body
        assert "total" in stats, f"total missing: {stats}"
        assert "new" in stats, f"new missing: {stats}"
        assert "converted" in stats, f"converted missing: {stats}"

    def test_inquiries_stats_without_auth_returns_401(self):
        r = requests.get(f"{BASE_URL}/api/inquiries/stats")
        assert r.status_code == 401


# ══════════════════════════════════════════════════════════════════════════════
# GET /api/inquiries/:id
# ══════════════════════════════════════════════════════════════════════════════

class TestGetOneInquiry:
    """GET /api/inquiries/:id"""

    @pytest.fixture(autouse=True)
    def _get_inquiry_id(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/inquiries", headers=auth_headers)
        body = r.json()
        inquiries = body.get("inquiries") or body.get("data") or (body if isinstance(body, list) else [])
        if not inquiries:
            pytest.skip("No inquiries available to test GET by ID")
        self.inquiry_id = inquiries[0]["id"]
        self.headers = auth_headers

    def test_get_inquiry_by_id_returns_200(self):
        r = requests.get(f"{BASE_URL}/api/inquiries/{self.inquiry_id}", headers=self.headers)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"

    def test_get_inquiry_by_id_returns_data(self):
        r = requests.get(f"{BASE_URL}/api/inquiries/{self.inquiry_id}", headers=self.headers)
        body = r.json()
        inquiry = body.get("data") or body
        assert "id" in inquiry or "name" in inquiry

    def test_get_inquiry_without_auth_returns_401(self):
        r = requests.get(f"{BASE_URL}/api/inquiries/{self.inquiry_id}")
        assert r.status_code == 401


# ══════════════════════════════════════════════════════════════════════════════
# PATCH /api/inquiries/:id
# ══════════════════════════════════════════════════════════════════════════════

class TestUpdateInquiry:
    """PATCH /api/inquiries/:id"""

    @pytest.fixture(autouse=True)
    def _get_inquiry_id(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/inquiries", headers=auth_headers)
        body = r.json()
        inquiries = body.get("inquiries") or body.get("data") or (body if isinstance(body, list) else [])
        if not inquiries:
            pytest.skip("No inquiries available to test PATCH")
        self.inquiry_id = inquiries[0]["id"]
        self.headers = auth_headers

    def test_update_inquiry_status_to_converted(self):
        r = requests.patch(
            f"{BASE_URL}/api/inquiries/{self.inquiry_id}",
            json={"status": "CONVERTED"},
            headers=self.headers,
        )
        assert r.status_code in (200, 201), f"Expected 200, got {r.status_code}: {r.text}"

    def test_update_inquiry_without_auth_returns_401(self):
        r = requests.patch(
            f"{BASE_URL}/api/inquiries/{self.inquiry_id}",
            json={"status": "LOST"},
        )
        assert r.status_code == 401


# ══════════════════════════════════════════════════════════════════════════════
# DELETE /api/inquiries/:id
# ══════════════════════════════════════════════════════════════════════════════

class TestDeleteInquiry:
    """DELETE /api/inquiries/:id"""

    @pytest.fixture(autouse=True)
    def _create_temp_inquiry(self, auth_headers):
        payload = make_inquiry_payload("del99")
        r = requests.post(f"{BASE_URL}/api/inquiries", json=payload, headers=auth_headers)
        self.headers = auth_headers
        if r.status_code in (200, 201):
            body = r.json()
            self.inquiry_id = body.get("id") or body.get("data", {}).get("id")
        else:
            pytest.skip(f"Could not create inquiry for delete test: {r.text}")

    def test_delete_inquiry_returns_success(self):
        r = requests.delete(
            f"{BASE_URL}/api/inquiries/{self.inquiry_id}",
            headers=self.headers,
        )
        assert r.status_code in (200, 201, 204), f"Expected 2xx, got {r.status_code}: {r.text}"

    def test_delete_inquiry_without_auth_returns_401(self):
        r = requests.delete(f"{BASE_URL}/api/inquiries/{self.inquiry_id}")
        assert r.status_code == 401
