// POST /api/attempts — save a brain-training activity attempt for the active child.
//
// Writes to: users/{parentUid}/children/{childId}/attempts/{auto-id}
// per cognilift-mechanics.md §11 schema.

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { ACTIVE_CHILD_COOKIE } from "@/lib/active-child";
import { computeScore, type ScoreInput } from "@/lib/scoring";
import { generateInsight } from "@/lib/insights";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

interface AttemptRequestBody {
  activityKey: string;
  moduleKey: string;
  difficultyLevel: string;
  contentVariant?: string;        // "abstract" (Phase 2) | "academic" (Phase 2.5)
  isCorrect: boolean;
  accuracyPercent?: number;
  timeTakenSeconds: number;
  expectedTimeSeconds: number;
  confidence: "low" | "medium" | "high";
  reflection: ScoreInput["reflection"];
  answerJson?: unknown;
  correctAnswerJson?: unknown;
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let parentUid: string;
  try {
    const decoded = await adminAuth.verifySessionCookie(session);
    parentUid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const childId = cookieStore.get(ACTIVE_CHILD_COOKIE)?.value;
  if (!childId) {
    return NextResponse.json(
      { error: "No active child profile. Switch profile first." },
      { status: 400 },
    );
  }

  let body: AttemptRequestBody;
  try {
    body = (await req.json()) as AttemptRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Minimal validation
  if (
    !body.activityKey ||
    !body.moduleKey ||
    typeof body.isCorrect !== "boolean" ||
    typeof body.timeTakenSeconds !== "number" ||
    typeof body.expectedTimeSeconds !== "number"
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    // Confirm child belongs to parent
    const childRef = adminDb
      .collection("users")
      .doc(parentUid)
      .collection("children")
      .doc(childId);
    const childDoc = await childRef.get();
    if (!childDoc.exists) {
      return NextResponse.json({ error: "Active child not found" }, { status: 404 });
    }

    // Compute score + insight server-side (don't trust client to do it)
    const scoreInput: ScoreInput = {
      isCorrect: body.isCorrect,
      accuracyPercent: body.accuracyPercent,
      timeTakenSeconds: body.timeTakenSeconds,
      expectedTimeSeconds: body.expectedTimeSeconds,
      confidence: body.confidence,
      reflection: body.reflection,
    };
    const scores = computeScore(scoreInput);
    const insight = generateInsight({
      isCorrect: body.isCorrect,
      timeTakenSeconds: body.timeTakenSeconds,
      expectedTimeSeconds: body.expectedTimeSeconds,
      confidence: body.confidence,
    });

    const docRef = await childRef.collection("attempts").add({
      activityKey: body.activityKey,
      moduleKey: body.moduleKey,
      difficultyLevel: body.difficultyLevel || "easy",
      contentVariant: body.contentVariant || "abstract",
      isCorrect: body.isCorrect,
      accuracyPercent:
        typeof body.accuracyPercent === "number"
          ? body.accuracyPercent
          : body.isCorrect
          ? 100
          : 0,
      timeTakenSeconds: body.timeTakenSeconds,
      expectedTimeSeconds: body.expectedTimeSeconds,
      confidenceLevel: body.confidence,
      reflectionType: body.reflection,
      answerJson: body.answerJson ?? null,
      correctAnswerJson: body.correctAnswerJson ?? null,
      scores,
      insight,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      ok: true,
      id: docRef.id,
      scores,
      insight,
    });
  } catch (err) {
    console.error("Failed to save attempt:", err);
    return NextResponse.json({ error: "Failed to save attempt" }, { status: 500 });
  }
}
