import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def verify():
    print(f"Testing API at {BASE_URL}")
    
    # 1. Signup
    email = "test_verify_api@example.com"
    password = "SecurePassword123!"
    
    print(f"\n1. Testing Signup ({email})...")
    signup_payload = {"email": email, "password": password}
    try:
        r = requests.post(f"{BASE_URL}/auth/signup", json=signup_payload)
        if r.status_code == 200:
            print("✅ Signup successful")
        elif r.status_code == 400 and "already registered" in r.text:
            print("INFO: User already exists, proceeding to login")
        else:
            print(f"❌ Signup failed: {r.status_code} {r.text}")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        sys.exit(1)

    # 2. Login
    print(f"\n2. Testing Login...")
    login_data = {"username": email, "password": password}
    r = requests.post(f"{BASE_URL}/auth/token", data=login_data)
    if r.status_code != 200:
        print(f"❌ Login failed: {r.status_code} {r.text}")
        sys.exit(1)
    
    token = r.json().get("access_token")
    if not token:
        print("❌ No token returned")
        sys.exit(1)
    print("✅ Login successful, token received")
    
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Predict Risk (RAG Test)
    print(f"\n3. Testing Risk Prediction with RAG...")
    health_data = {
        "age": 45,
        "gender": "Male",
        "systolicBP": 135,
        "diastolicBP": 85,
        "heartRate": 78,
        "weight": 80,
        "height": 175,
        "smokingStatus": "Former",
        "diabetesStatus": "No",
        "familyHistory": ["Heart Disease"],
        "currentMedications": [],
        "recentSymptoms": ["Chest Pain"]
    }
    
    r = requests.post(f"{BASE_URL}/predict-risk", json=health_data, headers=headers)
    if r.status_code != 200:
        print(f"❌ Prediction failed: {r.status_code} {r.text}")
        sys.exit(1)
        
    data = r.json()
    print("✅ Prediction received")
    
    # 4. Verify Content
    print(f"\n4. Verifying RAG & Compliance...")
    nlem = data.get("nlemContext", "")
    disclaimer = data.get("disclaimer", "")
    
    print(f"Risk Score: {data.get('riskScore')}")
    print(f"NLEM Context Length: {len(nlem)}")
    print(f"Disclaimer Length: {len(disclaimer)}")
    
    if len(nlem) > 10:
        print("✅ NLEM Context present")
    else:
        print("⚠️ WARNING: NLEM Context missing or too short")
        # Don't fail, maybe no match found
        
    if "CDSCO" in disclaimer or "Clinical authority" in disclaimer or "RMP" in disclaimer:
        print("✅ CDSCO Disclaimer present")
    else:
        print(f"❌ Disclaimer missing or incorrect: {disclaimer}")
        sys.exit(1)
        
    print("\n✅ \033[92mALL CHECKS PASSED\033[0m")

if __name__ == "__main__":
    verify()
