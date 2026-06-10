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