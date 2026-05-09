// PIN hashing for the parent's child-profile-switch gate.
// NOTE: This PIN is a UX gate (prevents the kid from switching/deleting profiles
// or accessing payment screens). It is NOT a security boundary — the parent's
// own session already grants full account access. We use SHA-256 with the
// user's UID as a per-account salt; brute-forceability of a 4-digit PIN is
// acceptable here because attackers with DB access already have everything.

import crypto from "crypto";

export function hashPin(pin: string, uid: string): string {
  return crypto.createHash("sha256").update(`${pin}:${uid}`).digest("hex");
}

export function verifyPin(pin: string, uid: string, expectedHash: string): boolean {
  return hashPin(pin, uid) === expectedHash;
}

export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}
