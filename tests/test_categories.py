def test_create_category(client, auth_token):
    response = client.post("/categories/", json={
        "name": "Work"
    }, headers={"Authorization": f"Bearer {auth_token}"})
    assert response.status_code == 200
    assert response.json()["name"] == "Work"
    assert "id" in response.json()


def test_get_categories_empty(client, auth_token):
    response = client.get("/categories/", headers={"Authorization": f"Bearer {auth_token}"})
    assert response.status_code == 200
    assert response.json() == []


def test_get_categories(client, auth_token):
    client.post("/categories/", json={"name": "Work"}, headers={"Authorization": f"Bearer {auth_token}"})
    client.post("/categories/", json={"name": "Personal"}, headers={"Authorization": f"Bearer {auth_token}"})
    response = client.get("/categories/", headers={"Authorization": f"Bearer {auth_token}"})
    assert response.status_code == 200
    assert len(response.json()) == 2
    names = [c["name"] for c in response.json()]
    assert "Work" in names
    assert "Personal" in names


def test_delete_category(client, auth_token):
    created = client.post("/categories/", json={"name": "Work"}, headers={"Authorization": f"Bearer {auth_token}"})
    category_id = created.json()["id"]
    response = client.delete(f"/categories/{category_id}", headers={"Authorization": f"Bearer {auth_token}"})
    assert response.status_code == 200
    assert response.json()["detail"] == "Category deleted"

    categories = client.get("/categories/", headers={"Authorization": f"Bearer {auth_token}"})
    assert len(categories.json()) == 0


def test_delete_category_not_found(client, auth_token):
    response = client.delete("/categories/999", headers={"Authorization": f"Bearer {auth_token}"})
    assert response.status_code == 404


def test_categories_isolated_between_users(client, auth_token):
    client.post("/categories/", json={"name": "User1 Category"}, headers={"Authorization": f"Bearer {auth_token}"})

    client.post("/auth/register", json={
        "username": "otheruser",
        "email": "other@gmail.com",
        "password": "password123"
    })
    login = client.post("/auth/login", data={"username": "otheruser", "password": "password123"})
    other_token = login.json()["access_token"]

    response = client.get("/categories/", headers={"Authorization": f"Bearer {other_token}"})
    assert response.json() == []


def test_delete_task_with_category_assigned(client, auth_token):
    category = client.post("/categories/", json={"name": "Work"}, headers={"Authorization": f"Bearer {auth_token}"})
    category_id = category.json()["id"]

    task = client.post("/tasks/", json={
        "title": "Task with category",
        "priority": "medium",
        "category_id": category_id
    }, headers={"Authorization": f"Bearer {auth_token}"})
    task_id = task.json()["id"]

    client.delete(f"/tasks/{task_id}", headers={"Authorization": f"Bearer {auth_token}"})

    tasks = client.get("/tasks/", headers={"Authorization": f"Bearer {auth_token}"})
    assert len(tasks.json()) == 0

    categories = client.get("/categories/", headers={"Authorization": f"Bearer {auth_token}"})
    assert len(categories.json()) == 1
    assert categories.json()[0]["name"] == "Work"


def test_delete_category_with_task_assigned(client, auth_token):
    category = client.post("/categories/", json={"name": "Work"}, headers={"Authorization": f"Bearer {auth_token}"})
    category_id = category.json()["id"]

    client.post("/tasks/", json={
        "title": "Task with category",
        "priority": "low",
        "category_id": category_id
    }, headers={"Authorization": f"Bearer {auth_token}"})

    delete_response = client.delete(f"/categories/{category_id}", headers={"Authorization": f"Bearer {auth_token}"})
    assert delete_response.status_code == 400
    assert "assigned tasks" in delete_response.json()["detail"]

    categories = client.get("/categories/", headers={"Authorization": f"Bearer {auth_token}"})
    assert len(categories.json()) == 1

    tasks = client.get("/tasks/", headers={"Authorization": f"Bearer {auth_token}"})
    assert len(tasks.json()) == 1
    assert tasks.json()[0]["category"]["name"] == "Work"


def test_create_task_with_category(client, auth_token):
    category = client.post("/categories/", json={"name": "Work"}, headers={"Authorization": f"Bearer {auth_token}"})
    category_id = category.json()["id"]

    task = client.post("/tasks/", json={
        "title": "Categorised task",
        "priority": "high",
        "category_id": category_id
    }, headers={"Authorization": f"Bearer {auth_token}"})
    assert task.status_code == 200
    assert task.json()["category_id"] == category_id
    assert task.json()["category"]["name"] == "Work"


def test_task_without_category(client, auth_token):
    task = client.post("/tasks/", json={
        "title": "No category task",
        "priority": "low"
    }, headers={"Authorization": f"Bearer {auth_token}"})
    assert task.status_code == 200
    assert task.json()["category_id"] is None
    assert task.json()["category"] is None


def test_unauthorized_categories(client):
    response = client.get("/categories/")
    assert response.status_code == 401

    response = client.post("/categories/", json={"name": "Work"})
    assert response.status_code == 401

    response = client.delete("/categories/1")
    assert response.status_code == 401
