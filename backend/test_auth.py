import requests
import json

BASE_URL = "http://localhost:8000"

# Test registration
print("Testing registration...")
try:
    resp = requests.post(
        f"{BASE_URL}/api/auth/register",
        json={"username": "testuser5", "email": "test5@example.com", "password": "testpass123"}
    )
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text}")
except Exception as e:
    print(f"Error: {e}")

# Test login
print("\nTesting login...")
try:
    resp = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"username": "testuser5", "password": "testpass123"}
    )
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text}")
    if resp.status_code == 200:
        token = resp.json().get("access_token")
        # Test /me endpoint
        print("\nTesting /me endpoint...")
        resp = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")
except Exception as e:
    print(f"Error: {e}")
