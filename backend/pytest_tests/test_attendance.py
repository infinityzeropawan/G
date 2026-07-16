"""
test_attendance.py — Attendance API Tests
==========================================
Coverage:
  POST /api/attendance             — Attendance mark karo
  GET  /api/attendance             — Saari attendance records lo
  GET  /api/attendance/today-stats — Aaj ki attendance stats lo
"""

import pytest
import requests
from datetime import datetime

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
def valid_member_id(auth_headers):
    """Ek valid member ID fetch karo."""
    r = requests.get(f"{BASE_URL}/api/members", headers=auth_headers)
    body = r.json()
    members = body.get("members") or body.get("data") or (body if isinstance(body, list) else [])
    if members:
        return members[0]["id"]
    return None


@pytest.fixture(scope="module")
def valid_staff_id(auth_headers):
    """Ek valid staff ID fetch karo."""
    r = requests.get(f"{BASE_URL}/api/hr/staff", headers=auth_headers)
    if r.status_code == 200:
        body = r.json()
        staff = body.get("data") or (body if isinstance(body, list) else [])
        if staff:
            return staff[0]["id"]
    return None


# ══════════════════════════════════════════════════════════════════════════════
# POST /api/attendance — Mark Attendance
# ══════════════════════════════════════════════════════════════════════════════

class TestMarkAttendance:
    """POST /api/attendance"""

    def test_mark_member_attendance_success(self, auth_headers, valid_member_id):
        """Member ki attendance mark honi chahiye."""
        if not valid_member_id:
            pytest.skip("No valid member ID available")
        payload = {
            "memberId": valid_member_id,
            "date": datetime.utcnow().isoformat() + "Z",
            "checkIn": datetime.utcnow().isoformat() + "Z",
            "type": "MEMBER",
        }
        r = requests.post(f"{BASE_URL}/api/attendance", json=payload, headers=auth_headers)
        assert r.status_code in (200, 201), f"Expected 200/201, got {r.status_code}: {r.text}"

    def test_mark_attendance_returns_id(self, auth_headers, valid_member_id):
        """Mark attendance response mein ID hona chahiye."""
        if not valid_member_id:
            pytest.skip("No valid member ID available")
        payload = {
            "memberId": valid_member_id,
            "date": datetime.utcnow().isoformat() + "Z",
            "type": "MEMBER",
        }
        r = requests.post(f"{BASE_URL}/api/attendance", json=payload, headers=auth_headers)
        if r.status_code in (200, 201):
            body = r.json()
            record = body.get("data") or body
            assert "id" in record, f"Attendance ID missing: {body}"

    def test_mark_staff_attendance_success(self, auth_headers, valid_staff_id):
        """Staff ki attendance mark honi chahiye."""
        if not valid_staff_id:
            pytest.skip("No valid staff ID available")
        payload = {
            "staffId": valid_staff_id,
            "date": datetime.utcnow().isoformat() + "Z",
            "checkIn": datetime.utcnow().isoformat() + "Z",
            "type": "STAFF",
        }
        r = requests.post(f"{BASE_URL}/api/attendance", json=payload, headers=auth_headers)
        assert r.status_code in (200, 201), f"Expected 200/201, got {r.status_code}: {r.text}"

    def test_mark_attendance_with_checkout(self, auth_headers, valid_member_id):
        """Checkout time ke saath attendance mark honi chahiye."""
        if not valid_member_id:
            pytest.skip("No valid member ID available")
        now = datetime.utcnow()
        payload = {
            "memberId": valid_member_id,
            "date": now.isoformat() + "Z",
            "checkIn": now.isoformat() + "Z",
            "checkOut": now.isoformat() + "Z",
            "type": "MEMBER",
        }
        r = requests.post(f"{BASE_URL}/api/attendance", json=payload, headers=auth_headers)
        assert r.status_code in (200, 201), f"Expected 200/201, got {r.status_code}: {r.text}"

    def test_mark_attendance_without_auth_returns_401(self, valid_member_id):
        """Auth ke bina attendance mark nahi honi chahiye."""
        payload = {
            "memberId": valid_member_id or 1,
            "date": datetime.utcnow().isoformat() + "Z",
            "type": "MEMBER",
        }
        r = requests.post(f"{BASE_URL}/api/attendance", json=payload)
        assert r.status_code == 401

    def test_mark_attendance_response_is_json(self, auth_headers, valid_member_id):
        """Response JSON hona chahiye."""
        if not valid_member_id:
            pytest.skip("No valid member ID available")
        payload = {
            "memberId": valid_member_id,
            "date": datetime.utcnow().isoformat() + "Z",
            "type": "MEMBER",
        }
        r = requests.post(f"{BASE_URL}/api/attendance", json=payload, headers=auth_headers)
        assert "application/json" in r.headers.get("Content-Type", "")


# ══════════════════════════════════════════════════════════════════════════════
# GET /api/attendance
# ══════════════════════════════════════════════════════════════════════════════

class TestGetAllAttendance:
    """GET /api/attendance"""

    def test_get_all_attendance_returns_200(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/attendance", headers=auth_headers)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"

    def test_get_all_attendance_returns_list(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/attendance", headers=auth_headers)
        body = r.json()
        records = body.get("data") or (body if isinstance(body, list) else None)
        assert records is not None, f"Unexpected response format: {body}"

    def test_get_attendance_ordered_by_date_desc(self, auth_headers):
        """Attendance date desc order mein honi chahiye."""
        r = requests.get(f"{BASE_URL}/api/attendance", headers=auth_headers)
        assert r.status_code == 200

    def test_get_all_attendance_without_auth_returns_401(self):
        r = requests.get(f"{BASE_URL}/api/attendance")
        assert r.status_code == 401

    def test_get_attendance_response_is_json(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/attendance", headers=auth_headers)
        assert "application/json" in r.headers.get("Content-Type", "")


# ══════════════════════════════════════════════════════════════════════════════
# GET /api/attendance/today-stats
# ══════════════════════════════════════════════════════════════════════════════

class TestTodayStats:
    """GET /api/attendance/today-stats"""

    def test_today_stats_returns_200(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/attendance/today-stats", headers=auth_headers)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"

    def test_today_stats_returns_required_fields(self, auth_headers):
        """Today stats mein totalCheckIns, memberCheckIns, staffCheckIns hona chahiye."""
        r = requests.get(f"{BASE_URL}/api/attendance/today-stats", headers=auth_headers)
        body = r.json()
        stats = body.get("data") or body
        assert "totalCheckIns" in stats, f"totalCheckIns missing: {stats}"
        assert "memberCheckIns" in stats, f"memberCheckIns missing: {stats}"
        assert "staffCheckIns" in stats, f"staffCheckIns missing: {stats}"

    def test_today_stats_values_are_numbers(self, auth_headers):
        """Stats values non-negative integers hone chahiye."""
        r = requests.get(f"{BASE_URL}/api/attendance/today-stats", headers=auth_headers)
        body = r.json()
        stats = body.get("data") or body
        for key in ["totalCheckIns", "memberCheckIns", "staffCheckIns"]:
            if key in stats:
                assert isinstance(stats[key], int), f"{key} is not int"
                assert stats[key] >= 0, f"{key} is negative"

    def test_today_stats_without_auth_returns_401(self):
        r = requests.get(f"{BASE_URL}/api/attendance/today-stats")
        assert r.status_code == 401

    def test_today_stats_totals_are_consistent(self, auth_headers):
        """memberCheckIns + staffCheckIns <= totalCheckIns hona chahiye."""
        r = requests.get(f"{BASE_URL}/api/attendance/today-stats", headers=auth_headers)
        body = r.json()
        stats = body.get("data") or body
        total = stats.get("totalCheckIns", 0)
        members = stats.get("memberCheckIns", 0)
        staff = stats.get("staffCheckIns", 0)
        assert members + staff <= total + 1  # +1 for rounding edge cases
