import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import http from "node:http";
import { readFile } from "node:fs/promises";
import {
  deriveActivationClaimCode,
  getActivationClaimKey,
} from "../src/lib/activation-claim.mjs";

process.env.NODE_ENV = "test";
process.env.LOG_LEVEL = "silent";
process.env.VITE_SUPABASE_URL = "https://yskhbzievopsooadzgqo.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-only-key-never-sent-to-network";
process.env.QR_ACTIVATION_HMAC_KEY = "a".repeat(64);

const phone = "+14155552671";
const claimKey = getActivationClaimKey(process.env.QR_ACTIVATION_HMAC_KEY);
assert.ok(claimKey);
const cardsByCode = new Map([
  ["activation-test-card", [{ id: "test-card-1", code: "activation-test-card", status: "UNACTIVATED" }]],
  ["concurrent-test-card", [{ id: "test-card-2", code: "concurrent-test-card", status: "UNACTIVATED" }]],
  ["rpc-failure-test-card", [{ id: "test-card-3", code: "rpc-failure-test-card", status: "UNACTIVATED" }]],
  ["duplicate-test-card", [
    { id: "test-card-4", code: "duplicate-test-card", status: "UNACTIVATED" },
    { id: "test-card-5", code: "duplicate-test-card", status: "UNACTIVATED" },
  ]],
]);
const registrations = new Map();
const rpcCalls = [];
const nonRpcWrites = [];
const codeLocks = new Map();
let app;
let server;
let port;

const jsonResponse = (value, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });

async function withCodeLock(code, operation) {
  const previous = codeLocks.get(code) ?? Promise.resolve();
  let release;
  const current = new Promise((resolve) => {
    release = resolve;
  });
  codeLocks.set(code, current);
  await previous;
  try {
    await new Promise((resolve) => setTimeout(resolve, 10));
    return await operation();
  } finally {
    release();
    if (codeLocks.get(code) === current) codeLocks.delete(code);
  }
}

globalThis.fetch = async (resource, init = {}) => {
  const url = new URL(
    resource instanceof URL
      ? resource.href
      : typeof resource === "string"
        ? resource
        : resource.url,
  );
  const method = init.method ?? "GET";

  if (url.pathname === "/rest/v1/qr_cards" && method === "GET") {
    const filter = url.searchParams.get("code") ?? "";
    const code = filter.startsWith("eq.") ? filter.slice(3) : "";
    return jsonResponse((cardsByCode.get(code) ?? []).map((card) => ({ ...card })));
  }

  if (url.pathname === "/rest/v1/rpc/activate_qr_card" && method === "POST") {
    const args = JSON.parse(init.body ?? "{}");
    rpcCalls.push({
      code: args.p_code,
      method,
      path: url.pathname,
      claimCodeForwarded: Object.hasOwn(args, "claimCode"),
    });
    const outcome = await withCodeLock(args.p_code, () => {
      const matches = cardsByCode.get(args.p_code) ?? [];
      if (matches.length === 0) return "not_found";
      if (matches.length > 1) return "duplicate_code";

      const [card] = matches;
      if (card.status !== "UNACTIVATED" || registrations.has(card.id)) {
        return "already_activated";
      }

      const stagedRegistration = {
        card_id: card.id,
        owner_name: args.p_owner_name,
        owner_phone: args.p_owner_phone,
      };
      if (args.p_code === "rpc-failure-test-card") {
        // Simulate a database error after preparing the insert but before commit.
        return null;
      }

      registrations.set(card.id, stagedRegistration);
      card.status = "ACTIVE";
      return "activated";
    });

    return outcome === null
      ? jsonResponse({ error: "simulated transaction failure" }, 500)
      : jsonResponse(outcome);
  }

  if (method !== "GET") nonRpcWrites.push({ method, path: url.pathname });
  return jsonResponse({ error: "unexpected mock request" }, 500);
};

async function apiRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const request = http.request(
      {
        host: "127.0.0.1",
        port,
        method,
        path,
        agent: false,
        headers: {
          connection: "close",
          ...(body ? { "content-type": "application/json" } : {}),
        },
      },
      (response) => {
        let text = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          text += chunk;
        });
        response.on("end", () => {
          resolve({ status: response.statusCode, headers: response.headers, text });
        });
      },
    );
    request.on("error", reject);
    if (body) request.write(JSON.stringify(body));
    request.end();
  });
}

const activationDetails = (code) => ({
  claimCode: deriveActivationClaimCode(code, claimKey),
  ownerName: "Synthetic Test Owner",
  ownerPhone: phone,
  vehicleMake: "Example",
  vehicleModel: "Model",
  vehicleColour: "Blue",
  vehicleRegistration: "TEST 1234",
});

before(async () => {
  ({ app } = await import("../dist/index.mjs"));
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  port = server.address().port;
});

after(async () => {
  if (!server) return;
  server.closeAllConnections();
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("activation commits through one RPC and keeps owner phone private", async () => {
  const beforeActivation = await apiRequest("GET", "/api/qr/activation-test-card");
  assert.equal(beforeActivation.status, 200);
  assert.deepEqual(JSON.parse(beforeActivation.text), { state: "activation_required" });

  const activated = await apiRequest(
    "POST",
    "/api/qr/activation-test-card/activate",
    activationDetails("activation-test-card"),
  );
  assert.equal(activated.status, 201);
  assert.deepEqual(JSON.parse(activated.text), { state: "active" });
  assert.equal(activated.text.includes(phone), false);
  assert.equal(activated.headers["cache-control"], "no-store");
  assert.equal(registrations.get("test-card-1")?.owner_phone, phone);
  assert.deepEqual(rpcCalls.filter((call) => call.code === "activation-test-card").map((call) => call.path), [
    "/rest/v1/rpc/activate_qr_card",
  ]);
  assert.equal(rpcCalls.find((call) => call.code === "activation-test-card")?.claimCodeForwarded, false);
  assert.equal(nonRpcWrites.length, 0);

  const publicStatus = await apiRequest("GET", "/api/qr/activation-test-card");
  assert.equal(publicStatus.status, 200);
  assert.deepEqual(JSON.parse(publicStatus.text), { state: "active" });
  assert.equal(publicStatus.text.includes(phone), false);
});

test("retries and duplicate codes fail closed", async () => {
  const retry = await apiRequest(
    "POST",
    "/api/qr/activation-test-card/activate",
    activationDetails("activation-test-card"),
  );
  assert.equal(retry.status, 409);

  const duplicateStatus = await apiRequest("GET", "/api/qr/duplicate-test-card");
  assert.equal(duplicateStatus.status, 409);
  const duplicateActivation = await apiRequest(
    "POST",
    "/api/qr/duplicate-test-card/activate",
    activationDetails("duplicate-test-card"),
  );
  assert.equal(duplicateActivation.status, 409);
  assert.equal(registrations.has("test-card-4"), false);
  assert.equal(registrations.has("test-card-5"), false);
});

test("simultaneous attempts can produce only one registration", async () => {
  const outcomes = await Promise.all([
    apiRequest("POST", "/api/qr/concurrent-test-card/activate", activationDetails("concurrent-test-card")),
    apiRequest("POST", "/api/qr/concurrent-test-card/activate", activationDetails("concurrent-test-card")),
  ]);
  assert.deepEqual(outcomes.map((outcome) => outcome.status).sort(), [201, 409]);
  assert.equal(registrations.has("test-card-2"), true);
  assert.equal(cardsByCode.get("concurrent-test-card")[0].status, "ACTIVE");
  assert.equal(outcomes.every((outcome) => !outcome.text.includes(phone)), true);
});

test("an RPC failure does not expose private data or report success", async () => {
  const response = await apiRequest(
    "POST",
    "/api/qr/rpc-failure-test-card/activate",
    activationDetails("rpc-failure-test-card"),
  );
  assert.equal(response.status, 503);
  assert.equal(response.text.includes(phone), false);
  assert.equal(cardsByCode.get("rpc-failure-test-card")[0].status, "UNACTIVATED");
  assert.equal(registrations.has("test-card-3"), false);
});

test("missing or incorrect package claim codes never reach Supabase", async () => {
  const beforeRpc = rpcCalls.length;
  const beforeNonRpcWrites = nonRpcWrites.length;
  const validDetails = activationDetails("activation-test-card");
  const missingClaimCode = { ...validDetails };
  delete missingClaimCode.claimCode;
  const missing = await apiRequest(
    "POST",
    "/api/qr/activation-test-card/activate",
    missingClaimCode,
  );
  assert.equal(missing.status, 400);

  for (const claimCode of ["", "not-a-claim-code", null, 123, "0".repeat(32)]) {
    const rejected = await apiRequest(
      "POST",
      "/api/qr/activation-test-card/activate",
      { ...validDetails, claimCode },
    );
    assert.ok([400, 403].includes(rejected.status));
    assert.equal(rejected.text.includes(validDetails.claimCode), false);
    assert.equal(rpcCalls.length, beforeRpc);
    assert.equal(nonRpcWrites.length, beforeNonRpcWrites);
  }

  const incorrect = await apiRequest(
    "POST",
    "/api/qr/activation-test-card/activate",
    { ...validDetails, claimCode: activationDetails("concurrent-test-card").claimCode },
  );
  assert.equal(incorrect.status, 403);
  assert.equal(missing.text.includes(phone), false);
  assert.equal(incorrect.text.includes(phone), false);
  assert.equal(incorrect.text.includes(validDetails.claimCode), false);
  assert.equal(rpcCalls.length, beforeRpc);
  assert.equal(nonRpcWrites.length, beforeNonRpcWrites);
});

test("activation fails closed when the HMAC key is unavailable or malformed", async () => {
  const previousKey = process.env.QR_ACTIVATION_HMAC_KEY;
  const beforeRpc = rpcCalls.length;
  const beforeNonRpcWrites = nonRpcWrites.length;
  try {
    for (const secret of [undefined, "", "a".repeat(63), "z".repeat(64)]) {
      if (secret === undefined) {
        delete process.env.QR_ACTIVATION_HMAC_KEY;
      } else {
        process.env.QR_ACTIVATION_HMAC_KEY = secret;
      }
      const response = await apiRequest(
        "POST",
        "/api/qr/activation-test-card/activate",
        activationDetails("activation-test-card"),
      );
      assert.equal(response.status, 503);
      assert.equal(response.text.includes(phone), false);
      assert.equal(response.text.includes(activationDetails("activation-test-card").claimCode), false);
      assert.equal(rpcCalls.length, beforeRpc);
      assert.equal(nonRpcWrites.length, beforeNonRpcWrites);
    }
  } finally {
    process.env.QR_ACTIVATION_HMAC_KEY = previousKey;
  }
});

test("the SQL migration keeps both writes in one restricted function", async () => {
  const migration = await readFile(
    new URL("../../../supabase/migrations/20261010000000_atomic_qr_activation.sql", import.meta.url),
    "utf8",
  );
  const insertPosition = migration.indexOf("INSERT INTO public.registrations");
  const updatePosition = migration.indexOf("UPDATE public.qr_cards");

  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.activate_qr_card/);
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /FOR UPDATE/);
  assert.ok(insertPosition >= 0 && updatePosition > insertPosition);
  assert.match(migration, /RAISE EXCEPTION/);
  assert.match(migration, /REVOKE ALL ON FUNCTION[\s\S]*FROM PUBLIC, anon, authenticated/);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION[\s\S]*TO service_role/);
  assert.doesNotMatch(migration, /CREATE TABLE/i);
});
