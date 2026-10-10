import { mkdir, open } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import {
  deriveActivationClaimCode,
  getActivationClaimKey,
} from "../src/lib/activation-claim.mjs";

const key = getActivationClaimKey(process.env.QR_ACTIVATION_HMAC_KEY);
if (!key) {
  console.error("Set QR_ACTIVATION_HMAC_KEY to a 64-character random hex value before generating claim codes.");
  process.exit(1);
}

const input = await new Promise((resolveInput, reject) => {
  let data = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => { data += chunk; });
  process.stdin.on("end", () => resolveInput(data));
  process.stdin.on("error", reject);
});

const codes = input
  .replace(/^\uFEFF/, "")
  .split(/\r?\n/)
  .map((code) => code.trim())
  .filter(Boolean);
const validCode = (code) =>
  code.length <= 128 && /^[A-Za-z0-9._~-]+$/.test(code);

if (codes.length === 0 || codes.some((code) => !validCode(code))) {
  console.error("Provide one or more valid QR codes, one per input line.");
  process.exit(1);
}
if (new Set(codes).size !== codes.length) {
  console.error("The input contains duplicate QR codes; no file was written.");
  process.exit(1);
}

const outputDirectory = fileURLToPath(
  new URL("../../../generated-artifacts/activation-claim-codes/", import.meta.url),
);
const outputPath = resolve(outputDirectory, "activation-claim-codes.csv");
await mkdir(outputDirectory, { recursive: true, mode: 0o700 });
const output = await open(outputPath, "wx", 0o600);
try {
  const rows = [
    "qr_code,claim_code",
    ...codes.map((code) => `${code},${deriveActivationClaimCode(code, key)}`),
  ];
  await output.writeFile(`${rows.join("\n")}\n`, "utf8");
} finally {
  await output.close();
}

console.log(`Wrote ${codes.length} private package claim-code entries to generated-artifacts/activation-claim-codes/activation-claim-codes.csv.`);
