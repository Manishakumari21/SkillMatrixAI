import pytest

@pytest.mark.asyncio
async def test_health_check(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_register_login_and_me(client, test_user_payload):
    register_response = await client.post("/api/v1/auth/register", json=test_user_payload)
    assert register_response.status_code == 201
    assert register_response.json()["email"] == test_user_payload["email"]

    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": test_user_payload["email"], "password": test_user_payload["password"]},
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    assert token

    me_response = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_response.status_code == 200
    assert me_response.json()["email"] == test_user_payload["email"]


@pytest.mark.asyncio
async def test_login_wrong_password_fails(client, test_user_payload):
    await client.post("/api/v1/auth/register", json=test_user_payload)
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": test_user_payload["email"], "password": "wrong-password"},
    )
    assert response.status_code == 401