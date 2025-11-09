import os, json, urllib.request, textwrap

WORKER_URL = os.environ["WORKER_URL"].rstrip("/")
INGEST_KEY = os.environ["INGEST_KEY"]
FILE = "kb/faqs.md"

with open(FILE, "r", encoding="utf-8") as f:
    text = f.read()

# Split client-side into ~8k char chunks (extra safe)
chunks = textwrap.wrap(text, width=8000, break_long_words=False, break_on_hyphens=False)
total = 0
for i, chunk in enumerate(chunks, 1):
    data = json.dumps({"file": "faqs.md", "text": chunk}).encode("utf-8")
    req = urllib.request.Request(
        f"{WORKER_URL}/ingest",
        data=data,
        headers={"Content-Type":"application/json", "x-ingest-key": INGEST_KEY}
    )
    with urllib.request.urlopen(req) as resp:
        print(f"Part {i}/{len(chunks)}:", resp.read().decode())
        total += 1
print("Uploaded parts:", total)
