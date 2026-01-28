import requests
import chromadb
import os
import sys

# Configuration
BASE_URL = "http://localhost:8002"
CHROMA_PATH = os.path.join(os.path.dirname(__file__), "..", "medical_db")

def test_chroma_connection():
    print(f"Testing ChromaDB connection at {CHROMA_PATH}...")
    try:
        client = chromadb.PersistentClient(path=CHROMA_PATH)
        collection = client.get_collection("nlem_2022_grounding")
        count = collection.count()
        print(f"✅ ChromaDB Success. Document count: {count}")
        return True
    except Exception as e:
        print(f"❌ ChromaDB Failed: {e}")
        return False

def test_auth_flow():
    print("\nTesting Authentication Flow...")
    
    # 1. Test Protected Endpoint without Token
    try:
        resp = requests.post(f"{BASE_URL}/medications/test-trigger")
        if resp.status_code == 401:
            print("✅ Protected route correctly returned 401 Unauthorized without token")
        else:
            print(f"❌ Protected route failed security check. Status: {resp.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to backend. Is it running?")
        return False

    # 2. Signup (Ignore if exists)
    email = "test_user@example.com"
    password = "password123"
    
    requests.post(f"{BASE_URL}/auth/signup", json={"email": email, "password": password})
    
    # 3. Login
    resp = requests.post(f"{BASE_URL}/auth/token", data={"username": email, "password": password})
    if resp.status_code != 200:
        print(f"❌ Login failed: {resp.text}")
        return False
    
    token = resp.json()["access_token"]
    print("✅ Login successful. Token received.")
    
    # 4. Access Protected Route with Token
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.post(f"{BASE_URL}/medications/test-trigger", headers=headers)
    
    if resp.status_code == 200:
        print("✅ Protected route accessed successfully with token.")
        print(f"   Response: {resp.json()}")
        return True
    else:
        print(f"❌ Protected route failed with token. Status: {resp.status_code}")
        return False

if __name__ == "__main__":
    chroma_ok = test_chroma_connection()
    auth_ok = test_auth_flow()
    
    if chroma_ok and auth_ok:
        print("\n🎉 ALL TESTS PASSED")
        sys.exit(0)
    else:
        print("\n💥 TESTS FAILED")
        sys.exit(1)
