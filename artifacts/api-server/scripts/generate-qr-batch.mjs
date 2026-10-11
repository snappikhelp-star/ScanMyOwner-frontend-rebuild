import { randomBytes } from "node:crypto";
import { mkdir, open, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  deriveActivationClaimCode,
  getActivationClaimKey,
} from "../src/lib/activation-claim.mjs";

const COUNT = Number(process.env.QR_BATCH_COUNT || 500);
const urlText = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const claimKey = getActivationClaimKey(process.env.QR_ACTIVATION_HMAC_KEY);

if (!Number.isInteger(COUNT) || COUNT < 1 || COUNT > 5000) {
  throw new Error("QR_BATCH_COUNT must be between 1 and 5000.");
}
if (!urlText || !serviceKey || !claimKey) {
  throw new Error("Required Supabase or existing HMAC environment variable is missing.");
}

const base = new URL(urlText);
if (base.protocol !== "https:" || base.hostname !== "yskhbzievopsooadzgqo.supabase.co") {
  throw new Error("Unexpected Supabase project URL.");
}

const headers = {
  apikey: serviceKey,
  authorization: `Bearer ${serviceKey}`,
  accept: "application/json",
};

const valid = (c) => /^[A-Za-z0-9._~-]{1,128}$/.test(c);

async function lookup(codes) {
  const found = [];
  for (let i = 0; i < codes.length; i += 100) {
    const batch = codes.slice(i, i + 100);
    const q = new URLSearchParams({
      select: "code,status",
      code: `in.(${batch.map((c) => `"${c}"`).join(",")})`,
    });
    const r = await fetch(new URL(`/rest/v1/qr_cards?${q}`, base), { headers });
    if (!r.ok) throw new Error("Database lookup failed.");
    const rows = await r.json();
    if (!Array.isArray(rows)) throw new Error("Unexpected database response.");
    found.push(...rows);
  }
  return found;
}

async function writeNew(path, contents) {
  const f = await open(path, "wx", 0o600);
  try {
    await f.writeFile(contents, "utf8");
    await f.sync();
  } finally {
    await f.close();
  }
}

const codes = new Set();
while (codes.size < COUNT) {
  codes.add(`SMO-${randomBytes(12).toString("hex").toUpperCase()}`);
}
const list = [...codes];
if (list.some((c) => !valid(c))) throw new Error("Generated code format failed.");

const collisions = await lookup(list);
if (collisions.length) throw new Error("Duplicate QR code detected; insert cancelled.");

const batchId = `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomBytes(4).toString("hex")}`;
const root = fileURLToPath(new URL("../../../generated-artifacts/qr-batches/", import.meta.url));
const dir = resolve(root, batchId);
await mkdir(root, { recursive: true, mode: 0o700 });
await mkdir(dir, { recursive: false, mode: 0o700 });

const csv = (v) => `"${String(v).replaceAll('"', '""')}"`;
const claimCsv = [
  "qr_code,claim_code",
  ...list.map((c) => `${csv(c)},${csv(deriveActivationClaimCode(c, claimKey))}`),
].join("\n") + "\n";
const urlCsv = [
  "qr_code,qr_url",
  ...list.map((c) => `${csv(c)},${csv(`https://scanmyowner.com/t/${c}`)}`),
].join("\n") + "\n";

const claimPath = resolve(dir, "package-claim-codes.csv");
const urlsPath = resolve(dir, "print-qr-urls.csv");
const manifestPath = resolve(dir, "manifest.json");

await writeNew(claimPath, claimCsv);
await writeNew(urlsPath, urlCsv);
await writeNew(manifestPath, JSON.stringify({
  batchId, count: COUNT, status: "PREPARED_NOT_INSERTED",
  createdAt: new Date().toISOString(),
}, null, 2) + "\n");

let response;
try {
  response = await fetch(new URL("/rest/v1/qr_cards", base), {
    method: "POST",
    headers: { ...headers, "content-type": "application/json", prefer: "return=representation" },
    body: JSON.stringify(list.map((code) => ({ code }))),
  });
} catch {
  console.error(`Insert outcome unknown. Do not rerun. Private batch: ${dir}`);
  process.exit(2);
}

if (!response.ok) {
  const status = response.status;
  await response.body?.cancel();
  try {
    const rows = await lookup(list);
    console.error(`Insert returned HTTP ${status}; ${rows.length}/${COUNT} batch codes currently found.`);
    console.error(`Do not rerun or delete anything. Reconcile this batch: ${dir}`);
  } catch {
    console.error(`Insert returned HTTP ${status}; database recheck failed. Do not rerun. Private batch: ${dir}`);
  }
  process.exit(2);
}

let rows;
try {
  rows = await response.json();
} catch {
  console.error(`Insert response unreadable. Do not rerun. Private batch: ${dir}`);
  process.exit(2);
}

const validInsert = Array.isArray(rows) && rows.length === COUNT &&
  rows.every((row) => codes.has(row.code) && row.status === "UNACTIVATED");

if (!validInsert) {
  console.error(`Insert response not fully verified. Do not rerun. Private batch: ${dir}`);
  process.exit(2);
}

const manifestTemp = resolve(dir, "manifest-confirmed.tmp");
await writeNew(manifestTemp, JSON.stringify({
  batchId, count: COUNT, status: "INSERT_CONFIRMED",
  createdAt: new Date().toISOString(), insertedCount: rows.length,
}, null, 2) + "\n");
await rename(manifestTemp, manifestPath);

console.log(`SUCCESS: ${COUNT} new cards inserted and confirmed UNACTIVATED.`);
console.log(`Batch folder: ${dir}`);
console.log("Files: print-qr-urls.csv, package-claim-codes.csv, manifest.json");
