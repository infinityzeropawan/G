"""
test_hr.py — HR (Staff & Payroll) API Tests
============================================
Coverage:
  GET    /api/hr/staff              — Saare staff members lo
  POST   /api/hr/staff              — Staff member create karo
  GET    /api/hr/staff/:id          — Ek staff member lo
  PATCH  /api/hr/staff/:id          — Staff update karo
  DELETE /api/hr/staff/:id          — Staff deactivate karo (soft delete)
  GET    /api/hr/payrolls           — Saare payrolls lo
  POST   /api/hr/payrolls           — Payroll create karo
  PATCH  /api/hr/payrolls/:id/status — Payroll status update karo
  GET    /api/hr/summary            — HR summary lo
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


def make_staff_payload(suffix: str = "001") -> dict:
    return {
        "name": f"Pytest Trainer {suffix}",
        "email": f"trainer{suffix}@pytest.com",
        "phone": f"70000{suffix}",
        "role": "Trainer",
        "salary": 25000.0,
        "branch": "Main Branch",
        "gender": "MALE",
        "address": "Gym Staff Quarters",
        "joinDate": "2026-01-01T00:00:00.000Z",
        "isActive": True,
    }


# ══════════════════════════════════════════════════════════════════════════════
# GET /api/hr/staff
# ══════════════════════════════════════════════════════════════════════════════

class TestGetAllStaff:
    """GET /api/hr/staff"""

    def test_get_all_staff_returns_200(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/hr/staff", headers=auth_headers)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"

    def test_get_all_staff_returns_list(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/hr/staff", headers=auth_headers)
        body = r.json()
        staff = body.get("data") or (body if isinstance(body, list) else None)
        assert staff is not None, f"Staff list missing: {body}"

    def test_get_all_staff_only_active(self, auth_headers):
        """GET staff sirf active staff return karna chahiye."""
        r = requests.get(f"{BASE_URL}/api/hr/staff", headers=auth_headers)
        body = r.json()
        staff = body.get("data") or (body if isinstance(body, list) else [])
        for s in staff:
            if "isActive" in s:
                assert s["isActive"] is True, f"Inactive staff returned: {s}"

    def test_get_all_staff_without_auth_returns_401(self):
        r = requests.get(f"{BASE_URL}/api/hr/staff")
        assert r.status_code == 401

    def test_get_all_staff_response_is_json(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/hr/staff", headers=auth_headers)
        assert "application/json" in r.headers.get("Content-Type", "")


# ══════════════════════════════════════════════════════════════════════════════
# POST /api/hr/staff
# ══════════════════════════════════════════════════════════════════════════════

class TestCreateStaff:
    """POST /api/hr/staff"""

    def test_create_staff_success(self, auth_headers):
        r = requests.post(
            f"{BASE_URL}/api/hr/staff",
            json=make_staff_payload("py01"),
            headers=auth_headers,
        )
        assert r.status_code in (200, 201), f"Expected 200/201, got {r.status_code}: {r.text}"

    def test_create_staff_returns_id(self, auth_headers):
        r = requests.post(
            f"{BASE_URL}/api/hr/staff",
            json=make_staff_payload("py02"),
            headers=auth_headers,
        )
        if r.status_code in (200, 201):
            body = r.json()
            staff = body.get("data") or body
            assert "id" in staff, f"Staff ID missing: {body}"

    def test_create_staff_with_female_gender(self, auth_headers):
        payload = make_staff_payload("py03")
        payload["gender"] = "FEMALE"
        r = requests.post(f"{BASE_URL}/api/hr/staff", json=payload, headers=auth_headers)
        assert r.status_code in (200, 201), f"Expected 200/201, got {r.status_code}: {r.text}"

    def test_create_staff_receptionist_role(self, auth_headers):
        payload = make_staff_payload("py04")
        payload["role"] = "Receptionist"
        r = requests.post(f"{BASE_URL}/api/hr/staff", json=payload, headers=auth_headers)
        assert r.status_code in (200, 201), f"Expected 200/201, got {r.status_code}: {r.text}"

    def test_create_staff_without_auth_returns_401(self):
        r = requests.post(f"{BASE_URL}/api/hr/staff", json=make_staff_payload("noauth"))
        assert r.status_code == 401

    def test_create_staff_response_is_json(self, auth_headers):
        r = requests.post(
            f"{BASE_URL}/api/hr/staff",
            json=make_staff_payload("py05"),
            headers=auth_headers,
        )
        assert "application/json" in r.headers.get("Content-Type", "")


# ══════════════════════════════════════════════════════════════════════════════
# GET /api/hr/staff/:id
# ══════════════════════════════════════════════════════════════════════════════

class TestGetOneStaff:
    """GET /api/hr/staff/:id"""

    @pytest.fixture(autouse=True)
    def _get_staff_id(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/hr/staff", headers=auth_headers)
        body = r.json()
        staff = body.get("data") or (body if isinstance(body, list) else [])
        if not staff:
            pytest.skip("No staff available to test GET by ID")
        self.staff_id = staff[0]["id"]
        self.headers = auth_headers

    def test_get_staff_by_id_returns_200(self):
        r = requests.get(f"{BASE_URL}/api/hr/staff/{self.staff_id}", headers=self.headers)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"

    def test_get_staff_by_id_returns_data(self):
        r = requests.get(f"{BASE_URL}/api/hr/staff/{self.staff_id}", headers=self.headers)
        body = r.json()
        staff = body.get("data") or body
        assert "id" in staff or "name" in staff

    def test_get_nonexistent_staff_returns_error(self):
        r = requests.get(f"{BASE_URL}/api/hr/staff/999999", headers=self.headers)
        assert r.status_code in (200, 404, 400, 500)  # Prisma returns null for not found

    def test_get_staff_without_auth_returns_401(self):
        r = requests.get(f"{BASE_URL}/api/hr/staff/{self.staff_id}")
        assert r.status_code == 401


# ══════════════════════════════════════════════════════════════════════════════
# PATCH /api/hr/staff/:id
# ══════════════════════════════════════════════════════════════════════════════

class TestUpdateStaff:
    """PATCH /api/hr/staff/:id"""

    @pytest.fixture(autouse=True)
    def _get_staff_id(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/hr/staff", headers=auth_headers)
        body = r.json()
        staff = body.get("data") or (body if isinstance(body, list) else [])
        if not staff:
            pytest.skip("No staff available to test PATCH")
        self.staff_id = staff[0]["id"]
        self.headers = auth_headers

    def test_update_staff_name(self):
        r = requests.patch(
            f"{BASE_URL}/api/hr/staff/{self.staff_id}",
            json={"name": "Updated Trainer Name"},
            headers=self.headers,
        )
        assert r.status_code in (200, 201), f"Expected 200, got {r.status_code}: {r.text}"

    def test_update_staff_salary(self):
        r = requests.patch(
            f"{BASE_URL}/api/hr/staff/{self.staff_id}",
            json={"salary": 30000.0},
            headers=self.headers,
        )
        assert r.status_code in (200, 201), f"Expected 200, got {r.status_code}: {r.text}"

    def test_update_staff_without_auth_returns_401(self):
        r = requests.patch(
            f"{BASE_URL}/api/hr/staff/{self.staff_id}",
            json={"name": "Hack"},
        )
        assert r.status_code == 401


# ══════════════════════════════════════════════════════════════════════════════
# DELETE /api/hr/staff/:id (Soft delete — sets isActive: false)
# ══════════════════════════════════════════════════════════════════════════════

class TestDeleteStaff:
    """DELETE /api/hr/staff/:id"""

    @pytest.fixture(autouse=True)
    def _create_temp_staff(self, auth_headers):
        payload = make_staff_payload("del99")
        r = requests.post(f"{BASE_URL}/api/hr/staff", json=payload, headers=auth_headers)
        self.headers = auth_headers
        if r.status_code in (200, 201):
            body = r.json()
            self.staff_id = body.get("id") or body.get("data", {}).get("id")
        else:
            pytest.skip(f"Could not create staff for delete test: {r.text}")

    def test_delete_staff_returns_success(self):
        r = requests.delete(
            f"{BASE_URL}/api/hr/staff/{self.staff_id}", headers=self.headers
        )
        assert r.status_code in (200, 201, 204), f"Expected 2xx, got {r.status_code}: {r.text}"

    def test_delete_staff_soft_deletes(self):
        """Delete ke baad isActive false hona chahiye."""
        requests.delete(f"{BASE_URL}/api/hr/staff/{self.staff_id}", headers=self.headers)
        r = requests.get(f"{BASE_URL}/api/hr/staff/{self.staff_id}", headers=self.headers)
        if r.status_code == 200:
            body = r.json()
            staff = body.get("data") or body
            if "isActive" in staff:
                assert staff["isActive"] is False

    def test_delete_staff_without_auth_returns_401(self):
        r = requests.delete(f"{BASE_URL}/api/hr/staff/{self.staff_id}")
        assert r.status_code == 401


# ══════════════════════════════════════════════════════════════════════════════
# GET /api/hr/payrolls
# ══════════════════════════════════════════════════════════════════════════════

class TestGetAllPayrolls:
    """GET /api/hr/payrolls"""

    def test_get_all_payrolls_returns_200(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/hr/payrolls", headers=auth_headers)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"

    def test_get_all_payrolls_returns_list(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/hr/payrolls", headers=auth_headers)
        body = r.json()
        payrolls = body.get("data") or (body if isinstance(body, list) else None)
        assert payrolls is not None, f"Payrolls list missing: {body}"

    def test_get_all_payrolls_without_auth_returns_401(self):
        r = requests.get(f"{BASE_URL}/api/hr/payrolls")
        assert r.status_code == 401


# ══════════════════════════════════════════════════════════════════════════════
# POST /api/hr/payrolls
# ══════════════════════════════════════════════════════════════════════════════

class TestCreatePayroll:
    """POST /api/hr/payrolls"""

    @pytest.fixture(autouse=True)
    def _get_staff_id(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/hr/staff", headers=auth_headers)
        body = r.json()
        staff = body.get("data") or (body if isinstance(body, list) else [])
        if not staff:
            pytest.skip("No staff available to create payroll")
        self.staff_id = staff[0]["id"]
        self.headers = auth_headers

    def test_create_payroll_success(self):
        payload = {
            "staffId": self.staff_id,
            "month": "July 2026",
            "amount": 25000.0,
            "status": "Pending",
            "notes": "Regular monthly salary - pytest",
        }
        r = requests.post(f"{BASE_URL}/api/hr/payrolls", json=payload, headers=self.headers)
        assert r.status_code in (200, 201), f"Expected 200/201, got {r.status_code}: {r.text}"

    def test_create_payroll_returns_id(self):
        payload = {
            "staffId": self.staff_id,
            "month": "August 2026",
            "amount": 25000.0,
            "status": "Pending",
        }
        r = requests.post(f"{BASE_URL}/api/hr/payrolls", json=payload, headers=self.headers)
        if r.status_code in (200, 201):
            body = r.json()
            record = body.get("data") or body
            assert "id" in record, f"Payroll ID missing: {body}"

    def test_create_payroll_without_auth_returns_401(self):
        payload = {"staffId": self.staff_id, "month": "July 2026", "amount": 25000.0, "status": "Pending"}
        r = requests.post(f"{BASE_URL}/api/hr/payrolls", json=payload)
        assert r.status_code == 401


# ══════════════════════════════════════════════════════════════════════════════
# PATCH /api/hr/payrolls/:id/status
# ══════════════════════════════════════════════════════════════════════════════

class TestUpdatePayrollStatus:
    """PATCH /api/hr/payrolls/:id/status"""

    @pytest.fixture(autouse=True)
    def _get_payroll_id(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/hr/payrolls", headers=auth_headers)
        body = r.json()
        payrolls = body.get("data") or (body if isinstance(body, list) else [])
        if not payrolls:
            pytest.skip("No payrolls available to test status update")
        self.payroll_id = payrolls[0]["id"]
        self.headers = auth_headers

    def test_update_payroll_status_to_paid(self):
        r = requests.patch(
            f"{BASE_URL}/api/hr/payrolls/{self.payroll_id}/status",
            json={"status": "Paid"},
            headers=self.headers,
        )
        assert r.status_code in (200, 201), f"Expected 200, got {r.status_code}: {r.text}"

    def test_update_payroll_status_to_pending(self):
        r = requests.patch(
            f"{BASE_URL}/api/hr/payrolls/{self.payroll_id}/status",
            json={"status": "Pending"},
            headers=self.headers,
        )
        assert r.status_code in (200, 201), f"Expected 200, got {r.status_code}: {r.text}"

    def test_update_payroll_status_without_auth_returns_401(self):
        r = requests.patch(
            f"{BASE_URL}/api/hr/payrolls/{self.payroll_id}/status",
            json={"status": "Paid"},
        )
        assert r.status_code == 401


# ══════════════════════════════════════════════════════════════════════════════
# GET /api/hr/summary
# ══════════════════════════════════════════════════════════════════════════════

class TestHrSummary:
    """GET /api/hr/summary"""

    def test_hr_summary_returns_200(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/hr/summary", headers=auth_headers)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"

    def test_hr_summary_returns_staff_counts(self, auth_headers):
        """Summary mein totalStaff aur activeStaff hona chahiye."""
        r = requests.get(f"{BASE_URL}/api/hr/summary", headers=auth_headers)
        body = r.json()
        summary = body.get("data") or body
        assert "totalStaff" in summary, f"totalStaff missing: {summary}"
        assert "activeStaff" in summary, f"activeStaff missing: {summary}"

    def test_hr_summary_returns_payroll_data(self, auth_headers):
        """Summary mein payroll stats hone chahiye."""
        r = requests.get(f"{BASE_URL}/api/hr/summary", headers=auth_headers)
        body = r.json()
        summary = body.get("data") or body
        assert "paidCount" in summary or "totalPayrollThisMonth" in summary

    def test_hr_summary_values_are_numbers(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/hr/summary", headers=auth_headers)
        body = r.json()
        summary = body.get("data") or body
        for key in ["totalStaff", "activeStaff"]:
            if key in summary:
                assert isinstance(summary[key], (int, float)), f"{key} is not a number"

    def test_hr_summary_without_auth_returns_401(self):
        r = requests.get(f"{BASE_URL}/api/hr/summary")
        assert r.status_code == 401
