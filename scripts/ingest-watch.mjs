// scripts/ingest-watch.mjs
// Watches /kb/*.md and re-uploads the changed file.
// Usage: node scripts/ingest-watch.mjs

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const KB_DIR = path.join(ROOT, "kb");

const WORKER_URL = (process.env.WORKER_URL || "").trim().replace(/\/+$/, "");
const INGEST_KEY = (process.env.INGEST_KEY || "").trim();

if (!WORKER_URL || !INGEST_KEY) {
  console.error("❌ Set WORKER_URL and INGEST_KEY before running watch.");
  process.exit(1);
}

const endpoint = `${WORKER_URL}/ingest`;

async function upload(file) {
  const full = path.join(KB_DIR, file);
  const text = await fsp.readFile(full, "utf-8");
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-ingest-key": INGEST_KEY },
    body: JSON.stringify({ file, text })
  });
  const raw = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${raw}`);
  return raw;
}

function isMd(name) { return name.toLowerCase().endsWith(".md"); }

console.log(`👀 Watching ${KB_DIR} ...`);
fs.watch(KB_DIR, { persistent: true }, async (event, filename) => {
  if (!filename || !isMd(filename)) return;
  // debounce
  if (upload._t) clearTimeout(upload._t);
  upload._t = setTimeout(async () => {
    process.stdout.write(`📤 ${filename} ... `);
    try {
      const out = await upload(filename);
      console.log("ok", out);
    } catch (e) {
      console.log("failed");
      console.error(`   ❌ ${e.message}`);
    }
  }, 150);
});
