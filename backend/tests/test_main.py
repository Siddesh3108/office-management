from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_signup_login_flow():
    # 1. Test User Registration
    username = "test_user_quality_assurance"
    response = client.post("/signup", json={"username": username, "password": "password123"})
    
    # Assert successful creation (200) or already exists (400)
    assert response.status_code in [200, 400]
    
    # 2. Test Login
    login_res = client.post("/token", data={"username": username, "password": "password123"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    
    # 3. Test Secured Endpoint Access
    headers = {"Authorization": f"Bearer {token}"}
    res = client.get("/subscriptions", headers=headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_unauthorized_access():
    # Attempt to access protected route without token
    response = client.get("/subscriptions")
    assert response.status_code == 401