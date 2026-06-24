import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app import models

_TEST_URL = "sqlite:///./test.db"
_engine = create_engine(_TEST_URL, connect_args={"check_same_thread": False})
_Session = sessionmaker(bind=_engine)


@pytest.fixture
def db():
    session = _Session()
    try:
        yield session
    finally:
        session.close()


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def test_register(client):
    response = client.post("/auth/register", json={
        "username": "testuser",
        "email": "test@gmail.com",
        "password": "password123"
    })
    assert response.status_code == 200
    assert response.json()["username"] == "testuser"


def test_register_duplicate(client):
    client.post("/auth/register", json={
        "username": "testuser",
        "email": "test@gmail.com",
        "password": "password123"
    })
    response = client.post("/auth/register", json={
        "username": "testuser",
        "email": "test@gmail.com",
        "password": "password123"
    })
    assert response.status_code == 400


def test_login(client, registered_user):
    response = client.post("/auth/login", data={
        "username": registered_user["username"],
        "password": registered_user["password"]
    })
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_wrong_password(client, registered_user):
    response = client.post("/auth/login", data={
        "username": registered_user["username"],
        "password": "wrongpassword"
    })
    assert response.status_code == 401


def test_register_empty_fields(client):
    response = client.post("/auth/register", json={
        "username": "",
        "email": "a@b.com",
        "password": "pass"
    })
    assert response.status_code in (400, 422)

    response = client.post("/auth/register", json={
        "username": "user2",
        "email": "",
        "password": "pass"
    })
    assert response.status_code in (400, 422)

    response = client.post("/auth/register", json={
        "username": "user3",
        "email": "c@d.com",
        "password": ""
    })
    assert response.status_code in (400, 422)


def test_register_duplicate_email(client):
    client.post("/auth/register", json={
        "username": "u1",
        "email": "dup@example.com",
        "password": "password"
    })

    response = client.post("/auth/register", json={
        "username": "u2",
        "email": "dup@example.com",
        "password": "password"
    })
    assert response.status_code == 400


def test_register_invalid_email_format(client):
    response = client.post("/auth/register", json={
        "username": "bademail",
        "email": "not-an-email",
        "password": "password"
    })
    assert response.status_code in (400, 422)


def test_login_empty_fields(client):
    response = client.post("/auth/login", data={
        "username": "",
        "password": "password123"
    })
    assert response.status_code in (400, 422)

    response = client.post("/auth/login", data={
        "username": "testuser",
        "password": ""
    })
    assert response.status_code in (400, 422)


def test_delete_account_returns_200(client, auth_token):
    response = client.delete("/auth/me", headers=_auth(auth_token))
    assert response.status_code == 200
    assert response.json() == {"detail": "Account deleted"}


def test_delete_account_removes_user_from_db(client, auth_token, db):
    client.delete("/auth/me", headers=_auth(auth_token))
    user = db.query(models.User).filter(models.User.username == "testuser").first()
    assert user is None


def test_delete_account_cascades_tasks(client, auth_token, db):
    client.post("/tasks/", json={"title": "Task 1", "priority": "low"}, headers=_auth(auth_token))
    client.post("/tasks/", json={"title": "Task 2", "priority": "high"}, headers=_auth(auth_token))
    client.delete("/auth/me", headers=_auth(auth_token))
    assert db.query(models.Task).all() == []


def test_delete_account_cascades_categories(client, auth_token, db):
    client.post("/categories/", json={"name": "Work"}, headers=_auth(auth_token))
    client.post("/categories/", json={"name": "Personal"}, headers=_auth(auth_token))
    client.delete("/auth/me", headers=_auth(auth_token))
    assert db.query(models.Category).all() == []


def test_delete_account_no_token(client):
    response = client.delete("/auth/me")
    assert response.status_code == 401


def test_delete_account_invalid_token(client):
    response = client.delete("/auth/me", headers={"Authorization": "Bearer fake.token.here"})
    assert response.status_code == 401


def test_delete_account_login_fails_after(client, auth_token, registered_user):
    client.delete("/auth/me", headers=_auth(auth_token))
    response = client.post("/auth/login", data={
        "username": registered_user["username"],
        "password": registered_user["password"],
    })
    assert response.status_code == 401


def test_delete_account_token_invalidated(client, auth_token):
    client.delete("/auth/me", headers=_auth(auth_token))
    response = client.get("/tasks/", headers=_auth(auth_token))
    assert response.status_code == 401


def test_delete_account_frees_username(client, auth_token):
    client.delete("/auth/me", headers=_auth(auth_token))
    response = client.post("/auth/register", json={
        "username": "testuser",
        "email": "new@example.com",
        "password": "newpassword123",
    })
    assert response.status_code == 200