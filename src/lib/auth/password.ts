import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

// Scrypt-based passcode hashing for individual staff accounts (no extra
// dependency needed — Node's crypto module ships this). Stored as
// "salt:hash", both hex-encoded.

export function hashPasscode(passcode: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(passcode, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPasscodeHash(candidate: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidateHash = scryptSync(candidate, salt, 64);
  const storedHash = Buffer.from(hash, "hex");
  if (candidateHash.length !== storedHash.length) return false;
  return timingSafeEqual(candidateHash, storedHash);
}
