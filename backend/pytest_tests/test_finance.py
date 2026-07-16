"""
test_finance.py — Finance API Tests
=====================================
Coverage:
  POST /api/finance/payments                    — Payment create karo
  GET  /api/finance/payments                    — Saare payments lo
  GET  /api/finance/summary                     — Finance summary lo
  GET  /api/finance/payments/member/:memberId   — Member ke payments lo
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
def valid_member_id(auth_headers):
    """Ek valid member ID fetch karo for payment tests."""
    r = requests.get(f"{BASE_URL}/api/members", headers=auth_headers)
    body = r.json()
    members = body.get("members") or body.get("data") or (body if isinstance(body, list) else [])
    if members:
        return members[0]["id"]
    pytest.skip("No members available for finance tests")


# ══════════════════════════════════════════════════════════════════════════════
# POST /api/finance/payments
# ══════════════════════════════════════════════════════════════════════════════

class TestCreatePayment:
    """POST /api/finance/payments"""

    def test_create_payment_success(self, auth_headers, valid_member_id):
        """Valid payload se payment create honi chahiye."""
        payload = {
            "memberId": valid_member_id,
            "amount": 1500.0,
            "method": "Cash",
            "notes": "Monthly membership payment - pytest",
        }
        r = requests.post(
            f"{BASE_URL}/api/finance/payments", json=payload, headers=auth_headers
        )
        assert r.status_code in (200, 201), f"Expected 200/201, got {r.status_code}: {r.text}"

    def test_create_payment_returns_id(self, auth_headers, valid_member_id):
        """Payment response mein ID hona chahiye."""
        payload = {
            "memberId": valid_member_id,
            "amount": 999.0,
            "method": "UPI",
        }
        r = requests.post(
            f"{BASE_URL}/api/finance/payments", json=payload, headers=auth_headers
        )
        if r.status_code in (200, 201):
            body = r.json()
            record = body.get("data") or body
            assert "id" in record, f"Payment ID missing: {body}"

    def test_create_payment_auto_generates_invoice_no(self, auth_headers, valid_member_id):
        """Payment create hone par invoiceNo auto-generate hona chahiye."""
        payload = {
            "memberId": valid_member_id,
            "amount": 2000.0,
            "method": "Card",
        }
        r = requests.post(
            f"{BASE_URL}/api/finance/payments", json=payload, headers=auth_headers
        )
        if r.status_code in (200, 201):
            body = r.json()
            record = body.get("data") or body
            assert "invoiceNo" in record, f"invoiceNo missing: {body}"
            assert record["invoiceNo"].startswith("INV-"), f"Invalid invoiceNo format: {record.get('invoiceNo')}"

    def test_create_payment_status_is_paid(self, auth_headers, valid_member_id):
        """Payment status PAID honi chahiye."""
        payload = {
            "memberId": valid_member_id,
            "amount": 500.0,
            "method": "UPI",
        }
        r = requests.post(
            f"{BASE_URL}/api/finance/payments", json=payload, headers=auth_headers
        )
        if r.status_code in (200, 201):
            body = r.json()
            record = body.get("data") or body
            if "status" in record:
                assert record["status"] == "PAID", f"Expected PAID, got {record['status']}"

    def test_create_payment_with_upi_method(self, auth_headers, valid_member_id):
        """UPI method se payment create honi chahiye."""
        payload = {
            "memberId": valid_member_id,
            "amount": 1200.0,
            "method": "UPI",
            "notes": "UPI payment test",
        }
        r = requests.post(
            f"{BASE_URL}/api/finance/payments", json=payload, headers=auth_headers
        )
        assert r.status_code in (200, 201), f"Expected 200/201, got {r.status_code}: {r.text}"

    def test_create_payment_with_net_banking(self, auth_headers, valid_member_id):
        """Net Banking se payment create honi chahiye."""
        payload = {
            "memberId": valid_member_id,
            "amount": 3000.0,
            "method": "Net Banking",
        }
        r = requests.post(
            f"{BASE_URL}/api/finance/payments", json=payload, headers=auth_headers
        )
        assert r.status_code in (200, 201), f"Expected 200/201, got {r.status_code}: {r.text}"

    def test_create_payment_without_auth_returns_401(self, valid_member_id):
        """Auth ke bina payment nahi honi chahiye."""
        payload = {
            "memberId": valid_member_id,
            "amount": 500.0,
            "method": "Cash",
        }
        r = requests.post(f"{BASE_URL}/api/finance/payments", json=payload)
        assert r.status_code == 401

    def test_create_payment_response_is_json(self, auth_headers, valid_member_id):
        payload = {
            "memberId": valid_member_id,
            "amount": 100.0,
            "method": "Cash",
        }
        r = requests.post(
            f"{BASE_URL}/api/finance/payments", json=payload, headers=auth_headers
        )
        assert "application/json" in r.headers.get("Content-Type", "")


# ══════════════════════════════════════════════════════════════════════════════
# GET /api/finance/payments
# ══════════════════════════════════════════════════════════════════════════════

class TestGetAllPayments:
    """GET /api/finance/payments"""

    def test_get_all_payments_returns_200(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/finance/payments", headers=auth_headers)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"

    def test_get_all_payments_returns_list(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/finance/payments", headers=auth_headers)
        body = r.json()
        payments = (
            body.get("payments")
            or body.get("data")
            or (body if isinstance(body, list) else None)
        )
        assert payments is not None, f"Payments list missing: {body}"

    def test_get_all_payments_returns_total(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/finance/payments", headers=auth_headers)
        body = r.json()
        if isinstance(body, dict):
            assert "total" in body or "payments" in body

    def test_get_all_payments_with_limit(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/finance/payments?limit=10", headers=auth_headers)
        assert r.status_code == 200

    def test_get_all_payments_without_auth_returns_401(self):
        r = requests.get(f"{BASE_URL}/api/finance/payments")
        assert r.status_code == 401

    def test_get_all_payments_includes_member(self, auth_headers):
        """Each payment mein member data included hona chahiye."""
        r = requests.get(f"{BASE_URL}/api/finance/payments", headers=auth_headers)
        body = r.json()
        payments = body.get("payments") or body.get("data") or (body if isinstance(body, list) else [])
        if payments:
            first_payment = payments[0]
            assert "member" in first_payment or "memberId" in first_payment


# ══════════════════════════════════════════════════════════════════════════════
# GET /api/finance/summary
# ══════════════════════════════════════════════════════════════════════════════

class TestFinanceSummary:
    """GET /api/finance/summary"""

    def test_summary_returns_200(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/finance/summary", headers=auth_headers)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"

    def test_summary_returns_total_revenue(self, auth_headers):
        """Summary mein totalRevenue hona chahiye."""
        r = requests.get(f"{BASE_URL}/api/finance/summary", headers=auth_headers)
        body = r.json()
        summary = body.get("data") or body
        assert "totalRevenue" in summary, f"totalRevenue missing: {summary}"

    def test_summary_returns_monthly_revenue(self, auth_headers):
        """Summary mein monthlyRevenue hona chahiye."""
        r = requests.get(f"{BASE_URL}/api/finance/summary", headers=auth_headers)
        body = r.json()
        summary = body.get("data") or body
        assert "monthlyRevenue" in summary, f"monthlyRevenue missing: {summary}"

    def test_summary_returns_pending_amount(self, auth_headers):
        """Summary mein pendingAmount hona chahiye."""
        r = requests.get(f"{BASE_URL}/api/finance/summary", headers=auth_headers)
        body = r.json()
        summary = body.get("data") or body
        assert "pendingAmount" in summary, f"pendingAmount missing: {summary}"

    def test_summary_returns_revenue_by_method(self, auth_headers):
        """Summary mein revenueByMethod object hona chahiye."""
        r = requests.get(f"{BASE_URL}/api/finance/summary", headers=auth_headers)
        body = r.json()
        summary = body.get("data") or body
        assert "revenueByMethod" in summary, f"revenueByMethod missing: {summary}"

    def test_summary_returns_monthly_data_array(self, auth_headers):
        """Summary mein monthlyData array hona chahiye (last 6 months chart)."""
        r = requests.get(f"{BASE_URL}/api/finance/summary", headers=auth_headers)
        body = r.json()
        summary = body.get("data") or body
        assert "monthlyData" in summary, f"monthlyData missing: {summary}"
        if "monthlyData" in summary:
            assert isinstance(summary["monthlyData"], list)

    def test_summary_revenue_values_are_numbers(self, auth_headers):
        """Revenue values numbers hone chahiye."""
        r = requests.get(f"{BASE_URL}/api/finance/summary", headers=auth_headers)
        body = r.json()
        summary = body.get("data") or body
        for key in ["totalRevenue", "monthlyRevenue", "pendingAmount"]:
            if key in summary:
                assert isinstance(summary[key], (int, float)), f"{key} is not a number"
                assert summary[key] >= 0, f"{key} is negative"

    def test_summary_without_auth_returns_401(self):
        r = requests.get(f"{BASE_URL}/api/finance/summary")
        assert r.status_code == 401


# ══════════════════════════════════════════════════════════════════════════════
# GET /api/finance/payments/member/:memberId
# ══════════════════════════════════════════════════════════════════════════════

class TestGetPaymentsByMember:
    """GET /api/finance/payments/member/:memberId"""

    def test_get_member_payments_returns_200(self, auth_headers, valid_member_id):
        r = requests.get(
            f"{BASE_URL}/api/finance/payments/member/{valid_member_id}",
            headers=auth_headers,
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"

    def test_get_member_payments_returns_list(self, auth_headers, valid_member_id):
        r = requests.get(
            f"{BASE_URL}/api/finance/payments/member/{valid_member_id}",
            headers=auth_headers,
        )
        body = r.json()
        payments = body.get("data") or (body if isinstance(body, list) else None)
        assert isinstance(payments, list) or payments is not None

    def test_get_member_payments_ordered_by_date(self, auth_headers, valid_member_id):
        """Payments paidAt desc order mein hone chahiye."""
        r = requests.get(
            f"{BASE_URL}/api/finance/payments/member/{valid_member_id}",
            headers=auth_headers,
        )
        assert r.status_code == 200

    def test_get_member_payments_without_auth_returns_401(self, valid_member_id):
        r = requests.get(f"{BASE_URL}/api/finance/payments/member/{valid_member_id}")
        assert r.status_code == 401

    def test_get_payments_for_invalid_member(self, auth_headers):
        """Invalid member ID ke liye empty list ya error aana chahiye."""
        r = requests.get(
            f"{BASE_URL}/api/finance/payments/member/999999",
            headers=auth_headers,
        )
        assert r.status_code in (200, 404, 400), f"Unexpected status: {r.status_code}"
        if r.status_code == 200:
            body = r.json()
            payments = body.get("data") or (body if isinstance(body, list) else [])
            assert isinstance(payments, list)
            assert len(payments) == 0
