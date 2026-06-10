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
    assert response.status_code == 400


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