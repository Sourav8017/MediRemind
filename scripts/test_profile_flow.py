import requests
import sys

BASE_URL = "http://localhost:8000"

def run_test():
    # 1. Signup
    email = "profile_test_v2@example.com"
    password = "password123"
    
    print(f"1. Registering {email}...")
    resp = requests.post(f"{BASE_URL}/auth/signup", json={"email": email, "password": password})
    if resp.status_code == 400 and "already registered" in resp.text:
         print("User exists, logging in...")
    elif resp.status_code != 200:
        print(f"Signup failed: {resp.text}")
        sys.exit(1)
        
    # 2. Login
    print("2. Logging in...")
    resp = requests.post(f"{BASE_URL}/auth/token", data={"username": email, "password": password})
    if resp.status_code != 200:
        print(f"Login failed: {resp.text}")
        sys.exit(1)
    
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Get Profile
    print("3. Fetching initial profile...")
    resp = requests.get(f"{BASE_URL}/users/me", headers=headers)
    print(f"Initial: {resp.json()}")
    
    # 4. Update Profile
    update_data = {
        "full_name": "Test User Updated",
        "phone_number": "555-9999",
        "email_notifications": True
    }
    print(f"4. Updating profile to: {update_data}")
    resp = requests.put(f"{BASE_URL}/users/me", json=update_data, headers=headers)
    if resp.status_code != 200:
         print(f"Update failed: {resp.text}")
         sys.exit(1)
    
    # 5. Verify
    print("5. Verifying update...")
    resp = requests.get(f"{BASE_URL}/users/me", headers=headers)
    data = resp.json()
    
    if data["full_name"] == "Test User Updated" and data["phone_number"] == "555-9999" and data["email_notifications"] is True:
        print("✅ Profile update SUCCESS!")
    else:
        print(f"❌ Verification FAILED. Got: {data}")

if __name__ == "__main__":
    run_test()
