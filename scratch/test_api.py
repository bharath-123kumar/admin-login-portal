import requests

BASE_URL = "http://localhost:5000/api"

def test_signup():
    print("Testing signup...")
    data = {
        "full_name": "Test Admin",
        "email": "test@example.com",
        "password": "password123",
        "confirm_password": "password123"
    }
    response = requests.post(f"{BASE_URL}/signup", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.status_code == 201 or (response.status_code == 400 and "already registered" in response.json().get("error", ""))

def test_login():
    print("Testing login...")
    data = {
        "email": "test@example.com",
        "password": "password123"
    }
    response = requests.post(f"{BASE_URL}/login", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

if __name__ == "__main__":
    if test_signup():
        test_login()
