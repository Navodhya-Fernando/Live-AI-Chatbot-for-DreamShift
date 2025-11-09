import os
import json
import urllib.request

WORKER_URL = os.getenv("WORKER_URL", "").rstrip("/")
INGEST_KEY = os.getenv("INGEST_KEY", "")

if not WORKER_URL or not INGEST_KEY:
    print("❌ Missing WORKER_URL or INGEST_KEY environment variable.")
    exit(1)

KB_DIR = "kb"
FILES = [f for f in os.listdir(KB_DIR) if f.endswith(".md")]

for f in FILES:
    path = os.path.join(KB_DIR, f)
    print(f"📤 Uploading: {f}")
    with open(path, "r", encoding="utf-8") as file:
        text = file.read()

    data = json.dumps({"file": f, "text": text}).encode("utf-8")
    req = urllib.request.Request(
        f"{WORKER_URL}/ingest",
        data=data,
        headers={
            "Content-Type": "application/json",
            "x-ingest-key": INGEST_KEY
        }
    )

    try:
        with urllib.request.urlopen(req) as resp:
            print(resp.read().decode())
    except Exception as e:
        print(f"❌ Error uploading {f}: {e}")
    print("---")

print("✅ Upload complete.")
