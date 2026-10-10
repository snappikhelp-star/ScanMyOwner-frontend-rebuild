export function getActivationClaimKey(secret: string | undefined): Buffer | null;

export function deriveActivationClaimCode(qrCode: string, key: Uint8Array): string;

export function verifyActivationClaimCode(
  qrCode: string,
  claimCode: string,
  key: Uint8Array,
): boolean;
