"""
test_workout.py — Workout & Diet Plans API Tests
=================================================
Coverage:
  GET    /api/workout/exercises       — Saare workouts lo
  POST   /api/workout/exercises       — Workout create karo
  PATCH  /api/workout/exercises/:id   — Workout update karo
  DELETE /api/workout/exercises/:id   — Workout delete karo

  GET    /api/workout/diet-plans      — Saare diet plans lo
  POST   /api/workout/diet-plans      — Diet plan create karo
  PATCH  /api/workout/diet-plans/:id  — Diet plan update karo
  DELETE /api/workout/diet-plans/:id  — Diet plan delete karo
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


def make_workout_payload(suffix: str = "001") -> dict:
    return {
        "name": f"Test Workout {suffix}",
        "category": "Chest",
        "muscleGroup": ["Pectorals", "Triceps"],
        "sets": 3,
        "reps": "10-12",
        "duration": "10 mins",
        "difficulty": "Beginner",
        "description": "Basic chest press",
        "isActive": True,
    }


def make_diet_payload(suffix: str = "001") -> dict:
    return {
        "name": f"Test Diet Plan {suffix}",
        "goal": "Muscle Gain",
        "calories": 2500,
        "protein": 150.0,
        "carbs": 300.0,
        "fats": 70.0,
        "description": "High protein diet",
        "meals": ["Breakfast: Eggs", "Lunch: Chicken", "Dinner: Fish"],
        "isActive": True,
    }


# ══════════════════════════════════════════════════════════════════════════════
# POST /api/workout/exercises
# ══════════════════════════════════════════════════════════════════════════════

class TestCreateWorkout:
    """POST /api/workout/exercises"""

    def test_create_workout_success(self, auth_headers):
        r = requests.post(
            f"{BASE_URL}/api/workout/exercises",
            json=make_workout_payload("py01"),
            headers=auth_headers,
        )
        assert r.status_code in (200, 201), f"Expected 200/201, got {r.status_code}: {r.text}"

    def test_create_workout_without_auth_returns_401(self):
        r = requests.post(f"{BASE_URL}/api/workout/exercises", json=make_workout_payload("noauth"))
        assert r.status_code == 401


# ══════════════════════════════════════════════════════════════════════════════
# GET /api/workout/exercises
# ══════════════════════════════════════════════════════════════════════════════

class TestGetAllWorkouts:
    """GET /api/workout/exercises"""

    def test_get_all_workouts_returns_200(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/workout/exercises", headers=auth_headers)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"

    def test_get_all_workouts_returns_list(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/workout/exercises", headers=auth_headers)
        body = r.json()
        workouts = body.get("data") or (body if isinstance(body, list) else None)
        assert workouts is not None, f"Workouts list missing: {body}"

    def test_get_all_workouts_without_auth_returns_401(self):
        r = requests.get(f"{BASE_URL}/api/workout/exercises")
        assert r.status_code == 401


# ══════════════════════════════════════════════════════════════════════════════
# PATCH /api/workout/exercises/:id
# ══════════════════════════════════════════════════════════════════════════════

class TestUpdateWorkout:
    """PATCH /api/workout/exercises/:id"""

    @pytest.fixture(autouse=True)
    def _get_workout_id(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/workout/exercises", headers=auth_headers)
        body = r.json()
        workouts = body.get("data") or (body if isinstance(body, list) else [])
        if not workouts:
            pytest.skip("No workouts available to test PATCH")
        self.workout_id = workouts[0]["id"]
        self.headers = auth_headers

    def test_update_workout_name(self):
        r = requests.patch(
            f"{BASE_URL}/api/workout/exercises/{self.workout_id}",
            json={"name": "Updated Workout"},
            headers=self.headers,
        )
        assert r.status_code in (200, 201), f"Expected 200, got {r.status_code}: {r.text}"

    def test_update_workout_without_auth_returns_401(self):
        r = requests.patch(
            f"{BASE_URL}/api/workout/exercises/{self.workout_id}",
            json={"name": "Hack"},
        )
        assert r.status_code == 401


# ══════════════════════════════════════════════════════════════════════════════
# DELETE /api/workout/exercises/:id
# ══════════════════════════════════════════════════════════════════════════════

class TestDeleteWorkout:
    """DELETE /api/workout/exercises/:id"""

    @pytest.fixture(autouse=True)
    def _create_temp_workout(self, auth_headers):
        payload = make_workout_payload("del99")
        r = requests.post(f"{BASE_URL}/api/workout/exercises", json=payload, headers=auth_headers)
        self.headers = auth_headers
        if r.status_code in (200, 201):
            body = r.json()
            self.workout_id = body.get("id") or body.get("data", {}).get("id")
        else:
            pytest.skip(f"Could not create workout for delete test: {r.text}")

    def test_delete_workout_returns_success(self):
        r = requests.delete(
            f"{BASE_URL}/api/workout/exercises/{self.workout_id}",
            headers=self.headers,
        )
        assert r.status_code in (200, 201, 204), f"Expected 2xx, got {r.status_code}: {r.text}"

    def test_delete_workout_without_auth_returns_401(self):
        r = requests.delete(f"{BASE_URL}/api/workout/exercises/{self.workout_id}")
        assert r.status_code == 401


# ══════════════════════════════════════════════════════════════════════════════
# POST /api/workout/diet-plans
# ══════════════════════════════════════════════════════════════════════════════

class TestCreateDietPlan:
    """POST /api/workout/diet-plans"""

    def test_create_diet_plan_success(self, auth_headers):
        r = requests.post(
            f"{BASE_URL}/api/workout/diet-plans",
            json=make_diet_payload("py01"),
            headers=auth_headers,
        )
        assert r.status_code in (200, 201), f"Expected 200/201, got {r.status_code}: {r.text}"

    def test_create_diet_plan_without_auth_returns_401(self):
        r = requests.post(f"{BASE_URL}/api/workout/diet-plans", json=make_diet_payload("noauth"))
        assert r.status_code == 401


# ══════════════════════════════════════════════════════════════════════════════
# GET /api/workout/diet-plans
# ══════════════════════════════════════════════════════════════════════════════

class TestGetAllDietPlans:
    """GET /api/workout/diet-plans"""

    def test_get_all_diet_plans_returns_200(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/workout/diet-plans", headers=auth_headers)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"

    def test_get_all_diet_plans_returns_list(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/workout/diet-plans", headers=auth_headers)
        body = r.json()
        diet_plans = body.get("data") or (body if isinstance(body, list) else None)
        assert diet_plans is not None, f"Diet plans list missing: {body}"

    def test_get_all_diet_plans_without_auth_returns_401(self):
        r = requests.get(f"{BASE_URL}/api/workout/diet-plans")
        assert r.status_code == 401


# ══════════════════════════════════════════════════════════════════════════════
# PATCH /api/workout/diet-plans/:id
# ══════════════════════════════════════════════════════════════════════════════

class TestUpdateDietPlan:
    """PATCH /api/workout/diet-plans/:id"""

    @pytest.fixture(autouse=True)
    def _get_diet_plan_id(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/workout/diet-plans", headers=auth_headers)
        body = r.json()
        diet_plans = body.get("data") or (body if isinstance(body, list) else [])
        if not diet_plans:
            pytest.skip("No diet plans available to test PATCH")
        self.diet_plan_id = diet_plans[0]["id"]
        self.headers = auth_headers

    def test_update_diet_plan_name(self):
        r = requests.patch(
            f"{BASE_URL}/api/workout/diet-plans/{self.diet_plan_id}",
            json={"name": "Updated Diet Plan"},
            headers=self.headers,
        )
        assert r.status_code in (200, 201), f"Expected 200, got {r.status_code}: {r.text}"

    def test_update_diet_plan_without_auth_returns_401(self):
        r = requests.patch(
            f"{BASE_URL}/api/workout/diet-plans/{self.diet_plan_id}",
            json={"name": "Hack"},
        )
        assert r.status_code == 401


# ══════════════════════════════════════════════════════════════════════════════
# DELETE /api/workout/diet-plans/:id
# ══════════════════════════════════════════════════════════════════════════════

class TestDeleteDietPlan:
    """DELETE /api/workout/diet-plans/:id"""

    @pytest.fixture(autouse=True)
    def _create_temp_diet_plan(self, auth_headers):
        payload = make_diet_payload("del99")
        r = requests.post(f"{BASE_URL}/api/workout/diet-plans", json=payload, headers=auth_headers)
        self.headers = auth_headers
        if r.status_code in (200, 201):
            body = r.json()
            self.diet_plan_id = body.get("id") or body.get("data", {}).get("id")
        else:
            pytest.skip(f"Could not create diet plan for delete test: {r.text}")

    def test_delete_diet_plan_returns_success(self):
        r = requests.delete(
            f"{BASE_URL}/api/workout/diet-plans/{self.diet_plan_id}",
            headers=self.headers,
        )
        assert r.status_code in (200, 201, 204), f"Expected 2xx, got {r.status_code}: {r.text}"

    def test_delete_diet_plan_without_auth_returns_401(self):
        r = requests.delete(f"{BASE_URL}/api/workout/diet-plans/{self.diet_plan_id}")
        assert r.status_code == 401
