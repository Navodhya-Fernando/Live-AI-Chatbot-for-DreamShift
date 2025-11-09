// scripts/ingest.mjs
// Upload every *.md in /kb to your Worker /ingest endpoint.
//
// Env vars required:
//   WORKER_URL  -> e.g. https://dreamshift-bot.dreamshift-kb.workers.dev
//   INGEST_KEY  -> your private ingest key
//
// Usage: node scripts/ingest.mjs

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const KB_DIR = path.join(ROOT, "kb");

const WORKER_URL = (process.env.WORKER_URL || "").trim().replace(/\/+$/, "");
const INGEST_KEY = (process.env.INGEST_KEY || "").trim();

if (!WORKER_URL) {
  console.error("❌ Missing WORKER_URL. Example:");
  console.error('   export WORKER_URL="https://dreamshift-bot.dreamshift-kb.workers.dev"');
  process.exit(1);
}
if (!INGEST_KEY) {
  console.error("❌ Missing INGEST_KEY. Example:");
  console.error('   export INGEST_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"');
  process.exit(1);
}

const endpoint = `${WORKER_URL}/ingest`;

async function uploadOne(file) {
  const full = path.join(KB_DIR, file);
  const text = await fs.readFile(full, "utf-8");

  const payload = { file, text };
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ingest-key": INGEST_KEY
    },
    body: JSON.stringify(payload)
  });

  const raw = await res.text();
  let json;
  try { json = JSON.parse(raw); } catch { json = { raw }; }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${raw}`);
  }
  return json;
}

async function run() {
  const files = (await fs.readdir(KB_DIR)).filter(f => f.endsWith(".md")).sort();
  if (files.length === 0) {
    console.warn("ℹ️  No .md files found in /kb");
    return;
  }

  console.log(`🚀 Ingesting ${files.length} file(s) to ${endpoint}`);
  for (const f of files) {
    process.stdout.write(`📤 ${f} ... `);
    try {
      const out = await uploadOne(f);
      console.log("ok", out);
    } catch (e) {
      console.log("failed");
      console.error(`   ❌ ${e.message}`);
    }
  }
  console.log("✅ Ingestion complete.");
}

run().catch(err => {
  console.error("❌ Fatal:", err);
  process.exit(1);
});
