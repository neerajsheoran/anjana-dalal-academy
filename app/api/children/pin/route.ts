// POST /api/children/pin   — set/replace the parent's child-switch PIN
// PUT  /api/children/pin   — verify a PIN attempt
//
// PIN is a UX gate (per lib/pin.ts), not a security boundary.

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { hashPin, verifyPin, isValidPin } from "@/lib/pin";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function authUid(): Promise<string | NextResponse> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  try {
    const decoded = await adminAuth.verifySessionCookie(session);
    return decoded.uid;
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
}

// Set or change the parent's child-switch PIN.
//   First-time setup:   body = { pin }
//   Change existing:    body = { pin, currentPin }   (currentPin required to prevent
//                                                     a kid in kid mode from silently
//                                                     overwriting the PIN)
export async function POST(req: Request) {
  const auth = await authUid();
  if (typeof auth !== "string") return auth;
  const uid = auth;

  let body: { pin?: unknown; currentPin?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const pin = typeof body.pin === "string" ? body.pin : "";
  const currentPin = typeof body.currentPin === "string" ? body.currentPin : "";
  if (!isValidPin(pin)) {
    return NextResponse.json({ error: "PIN must be 4 digits" }, { status: 400 });
  }

  try {
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const existingHash = userDoc.data()?.childPinHash as string | undefined;

    // Changing an existing PIN — must verify the current one first.
    // Distinguish "no currentPin provided" (UI thinks no PIN exists, but one
    // does — likely a stale-state bug) from "wrong currentPin" (real auth
    // failure) so client + dashboard logs can react differently.
    if (existingHash) {
      if (!currentPin) {
        return NextResponse.json(
          { error: "A PIN is already set. Use the change-PIN flow with your current PIN.", code: "pin-already-set" },
          { status: 409 },
        );
      }
      if (!verifyPin(currentPin, uid, existingHash)) {
        return NextResponse.json(
          { error: "Current PIN is incorrect" },
          { status: 401 },
        );
      }
    }

    await adminDb.collection("users").doc(uid).update({
      childPinHash: hashPin(pin, uid),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to set PIN:", err);
    return NextResponse.json({ error: "Failed to save PIN" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = await authUid();
  if (typeof auth !== "string") return auth;
  const uid = auth;

  let body: { pin?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const pin = typeof body.pin === "string" ? body.pin : "";
  if (!isValidPin(pin)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const expectedHash = userDoc.data()?.childPinHash as string | undefined;
    if (!expectedHash) {
      // No PIN set yet — caller should treat as success (no gate).
      return NextResponse.json({ ok: true, hasPin: false });
    }
    const ok = verifyPin(pin, uid, expectedHash);
    return NextResponse.json({ ok, hasPin: true }, { status: ok ? 200 : 401 });
  } catch (err) {
    console.error("Failed to verify PIN:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
