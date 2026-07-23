import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.db.mongodb import close_db, init_db
from app.main import app
from app.models.user import User


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def test_user_payload():
    return {"email": "test.student@example.com", "password": "StrongPass123!", "full_name": "Test Student"}


@pytest_asyncio.fixture(autouse=True)
async def clean_test_user(test_user_payload):
    """
    Deletes the test user before and after each test so re-running the
    suite never collides with a leftover user from a previous run.
    """
    await init_db()
    await User.find_one({"email": test_user_payload["email"]})
    db = User.get_motor_collection()
    await db.delete_many({"email": test_user_payload["email"]})
    yield
    db = User.get_motor_collection()
    await db.delete_many({"email": test_user_payload["email"]})
    await close_db()