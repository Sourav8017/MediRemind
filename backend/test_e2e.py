import requests
import time
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

# Configuration
API_URL = "http://localhost:8000"
DB_URL = "sqlite:///./app.db"

# Setup DB connection for direct verification
engine = create_engine(DB_URL)
SessionLocal = sessionmaker(bind=engine)

def log(msg):
    print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] {msg}")

def test_reliability():
    log("🚀 Starting End-to-End Reliability Test")
    
    # 1. Simulate User Adding Medication
    # We use the test-trigger endpoint which simulates the result of the add-medication flow
    # Setting it for 15 seconds in the future
    log("Step 1: Simulating user adding a high-risk medication via App...")
    try:
        response = requests.post(f"{API_URL}/medications/test-trigger?minutes=0.25&high_risk=true")
        if response.status_code == 200:
            data = response.json()
            log(f"✅ Medication created: {data['medication']}")
            log(f"ℹ️  Reminder scheduled for approx {data['message'].split('for ')[1]}")
        else:
            log(f"❌ Failed to create medication: {response.text}")
            sys.exit(1)
    except Exception as e:
        log(f"❌ API Connection Error: {e}")
        sys.exit(1)

    # 2. Verify Initial State (PENDING)
    log("Step 2: Verifying initial PENDING state in Database...")
    db = SessionLocal()
    # execute raw sql or use models if imported. using raw sql for independence
    try:
        result = db.execute("SELECT id, status, scheduled_time FROM reminders ORDER BY id DESC LIMIT 1").fetchone()
        if result and result[1] == "PENDING":
            log(f"✅ Verified Reminder ID {result[0]} is PENDING")
        else:
            log(f"❌ Reminder not found or not PENDING. Status: {result[1] if result else 'None'}")
            sys.exit(1)
    except Exception as e:
        log(f"❌ DB Error: {e}")
        sys.exit(1)
    finally:
        db.close()

    # 3. Wait for Background Worker
    log("Step 3: Waiting for Background Worker (polling every 10s)...")
    wait_seconds = 25
    for i in range(wait_seconds):
        time.sleep(1)
        if i % 5 == 0:
            print(".", end="", flush=True)
    print() # newline

    # 4. Verify Worker Action (DUE)
    # The worker transitions PENDING -> DUE
    log("Step 4: Verifying Worker Trigger (PENDING -> DUE/SENT)...")
    db = SessionLocal()
    try:
        result = db.execute("SELECT id, status FROM reminders ORDER BY id DESC LIMIT 1").fetchone()
        status = result[1]
        
        # If main.py is active and someone connected, it might be SENT. 
        # If no one is connected, it should be DUE.
        # However, checking 'DUE' confirms the WORKER did its job.
        # Checking 'SENT' means main.py ALSO did its job (stream active?).
        
        if status in ["DUE", "SENT"]:
            log(f"✅ SUCCESS: Reminder status transitioned to '{status}'")
            log("🎉 Background Worker successfully triggered the alert artifact!")
        else:
            log(f"❌ FAILURE: Reminder status is still '{status}'")
            log("⚠️  Worker failed to pick up the due reminder.")
            sys.exit(1)
            
    except Exception as e:
        log(f"❌ DB Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_reliability()
