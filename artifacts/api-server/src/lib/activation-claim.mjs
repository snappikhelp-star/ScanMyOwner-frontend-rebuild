import { createHmac, timingSafeEqual } from "node:crypto";

const claimCodePattern = /^[a-f0-9]{32}$/i;

export function getActivationClaimKey(secret) {
  if (typeof secret !== "string" || !/^[a-f0-9]{64}$/i.test(secret)) {
    return null;
  }
  return Buffer.from(secret, "hex");
}

export function deriveActivationClaimCode(qrCode, key) {
  return createHmac("sha256", key)
    .update("scanmyowner:qr-activation-claim:v1\0", "utf8")
    .update(qrCode, "utf8")
    .digest()
    .subarray(0, 16)
    .toString("hex");
}

export function verifyActivationClaimCode(qrCode, claimCode, key) {
  if (typeof claimCode !== "string" || !claimCodePattern.test(claimCode)) {
    return false;
  }

  const expected = Buffer.from(deriveActivationClaimCode(qrCode, key), "hex");
  const supplied = Buffer.from(claimCode, "hex");
  return timingSafeEqual(expected, supplied);
}
