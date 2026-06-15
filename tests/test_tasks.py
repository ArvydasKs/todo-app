def test_create_task(client, auth_token):
    response = client.post("/tasks/", json={
        "title": "Test task",
        "description": "Test description",
        "priority": "high"
    }, headers={"Authorization": f"Bearer {auth_token}"})
    assert response.status_code == 200
    assert response.json()["title"] == "Test task"
    assert response.json()["completed"] is False


def test_get_tasks(client, auth_token):
    client.post("/tasks/", json={
        "title": "Test task",
        "priority": "medium"
    }, headers={"Authorization": f"Bearer {auth_token}"})
    response = client.get("/tasks/", headers={"Authorization": f"Bearer {auth_token}"})
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_get_task(client, auth_token):
    created = client.post("/tasks/", json={
        "title": "Test task",
        "priority": "low"
    }, headers={"Authorization": f"Bearer {auth_token}"})
    task_id = created.json()["id"]
    response = client.get(f"/tasks/{task_id}", headers={"Authorization": f"Bearer {auth_token}"})
    assert response.status_code == 200
    assert response.json()["id"] == task_id


def test_complete_task(client, auth_token):
    created = client.post("/tasks/", json={
        "title": "Test task",
        "priority": "medium"
    }, headers={"Authorization": f"Bearer {auth_token}"})
    task_id = created.json()["id"]
    response = client.patch(f"/tasks/{task_id}/complete", headers={"Authorization": f"Bearer {auth_token}"})
    assert response.status_code == 200
    assert response.json()["completed"] is True


def test_delete_task(client, auth_token):
    created = client.post("/tasks/", json={
        "title": "Test task",
        "priority": "medium"
    }, headers={"Authorization": f"Bearer {auth_token}"})
    task_id = created.json()["id"]
    response = client.delete(f"/tasks/{task_id}", headers={"Authorization": f"Bearer {auth_token}"})
    assert response.status_code == 200
    assert response.json()["detail"] == "Task deleted"


def test_task_not_found(client, auth_token):
    response = client.get("/tasks/999", headers={"Authorization": f"Bearer {auth_token}"})
    assert response.status_code == 404


def test_unauthorized(client):
    response = client.get("/tasks/")
    assert response.status_code == 401