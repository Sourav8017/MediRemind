
print("Attempting to import models...")
try:
    from backend import models
    print("✅ Successfully imported backend.models")
    print(f"Boolean type available? {models.Boolean}")
except ImportError as e:
    # Try local import if running from backend dir
    try:
        import models
        print("✅ Successfully imported models (local)")
    except Exception as e2:
        print(f"❌ Failed import: {e2}")
        import traceback
        traceback.print_exc()
except Exception as e:
    print(f"❌ Failed: {e}")
    import traceback
    traceback.print_exc()
