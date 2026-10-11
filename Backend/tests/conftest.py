import os

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

# Test-only environment defaults, applied at import time so they exist *before*
# pytest collects test modules. Several application modules call get_settings()
# at import time, which requires JWT_SECRET to be present.
# setdefault() is used so any real value supplied by the shell or CI (e.g.
# GitHub Actions) always wins — this only fills gaps. The secret below is a
# non-production test value and must never be used to sign real tokens.
os.environ.setdefault("JWT_SECRET", "test-only-insecure-jwt-secret-do-not-use-in-production")


@pytest_asyncio.fixture
async def client():
    from app.main import app
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def test_user_payload():
    return {"email": "test.student@example.com", "password": "StrongPass123!", "full_name": "Test Student"}


@pytest_asyncio.fixture()
async def clean_test_user(test_user_payload):
    """
    Deletes the test user before and after each test so re-running the
    suite never collides with a leftover user from a previous run.
    Skips DB setup gracefully when MongoDB is unreachable (CI without DB).
    """
    try:
        from app.db.mongodb import close_db, init_db
        from app.models.user import User
        await init_db()
    except Exception as exc:
        pytest.skip(f"MongoDB unavailable, skipping DB test: {exc}")
    await User.find_one({"email": test_user_payload["email"]})
    db = User.get_motor_collection()
    await db.delete_many({"email": test_user_payload["email"]})
    yield
    db = User.get_motor_collection()
    await db.delete_many({"email": test_user_payload["email"]})
    await close_db()