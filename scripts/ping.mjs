// scripts/ping.mjs
// Quick round-trip to /chat for debugging your Worker.

const WORKER_URL = (process.env.WORKER_URL || "").trim().replace(/\/+$/, "");
if (!WORKER_URL) {
  console.error("❌ Set WORKER_URL env var"); process.exit(1);
}

const body = {
  message: process.argv.slice(2).join(" ") || "What are your packages?",
  history: []
};

const res = await fetch(`${WORKER_URL}/chat`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body)
});
const text = await res.text();
console.log(res.status, res.statusText);
console.log(text);
