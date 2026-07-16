"""
test_dashboard.py — Dashboard API Tests
========================================
Coverage:
  GET    /api/dashboard/stats      — Dashboard stats lo
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
# GET /api/dashboard/stats
# ══════════════════════════════════════════════════════════════════════════════

class TestDashboardStats:
    """GET /api/dashboard/stats"""

    def test_dashboard_stats_returns_200(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=auth_headers)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"

    def test_dashboard_stats_returns_key_metrics(self, auth_headers):
        """Dashboard stats mein key metrics hone chahiye."""
        r = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=auth_headers)
        body = r.json()
        stats = body.get("data") or body
        
        required_keys = [
            "totalMembers", "activeMembers", "newMembersThisMonth",
            "totalRevenue", "monthlyRevenue", "pendingPayments",
            "totalStaff", "totalProducts", "totalInquiries"
        ]
        
        for key in required_keys:
            assert key in stats, f"'{key}' missing from dashboard stats: {stats}"

    def test_dashboard_stats_returns_chart_data(self, auth_headers):
        """Dashboard stats mein chart data array hona chahiye."""
        r = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=auth_headers)
        body = r.json()
        stats = body.get("data") or body
        
        assert "memberGrowth" in stats, "memberGrowth missing"
        if "memberGrowth" in stats:
            assert isinstance(stats["memberGrowth"], list)
            
        assert "revenueChart" in stats, "revenueChart missing"
        if "revenueChart" in stats:
            assert isinstance(stats["revenueChart"], list)
            
        assert "membersByPlan" in stats, "membersByPlan missing"
        if "membersByPlan" in stats:
            assert isinstance(stats["membersByPlan"], list)

    def test_dashboard_stats_without_auth_returns_401(self):
        r = requests.get(f"{BASE_URL}/api/dashboard/stats")
        assert r.status_code == 401
