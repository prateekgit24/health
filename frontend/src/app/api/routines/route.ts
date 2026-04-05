import { NextRequest, NextResponse } from "next/server";
import { requireFirebaseUser } from "@/lib/firebase-auth-server";
import { createRoutinePlan, deleteRoutinePlan, listRoutinePlansByUser, updateRoutinePlan } from "@/lib/routines-store";
import type { RoutineDayPlan, RoutineDayStatus, RoutinePlanSource, TimeSlotKey, WeekdayKey } from "@/lib/routines-types";
import { TIME_SLOTS, WEEKDAYS } from "@/lib/routines-types";

type CreateRoutinePayload = {
  name?: string;
  goal?: string;
  source?: RoutinePlanSource;
  days?: Array<{
    dayKey?: WeekdayKey;
    slotKey?: TimeSlotKey;
    title?: string;
    status?: RoutineDayStatus;
  }>;
};

type UpdateRoutinePayload = {
  planId?: string;
  name?: string;
  goal?: string;
  days?: Array<{
    dayKey?: WeekdayKey;
    slotKey?: TimeSlotKey;
    title?: string;
    status?: RoutineDayStatus;
  }>;
};

function normalizeStatus(status: unknown): RoutineDayStatus {
  if (status === "completed" || status === "partial" || status === "not-done") {
    return status;
  }

  return "not-done";
}

function sanitizeDays(inputDays: unknown): Partial<RoutineDayPlan>[] {
  if (!Array.isArray(inputDays)) {
    return [];
  }

  const sanitized: Partial<RoutineDayPlan>[] = [];

  for (const item of inputDays) {
    const day = item as {
      dayKey?: unknown;
      slotKey?: unknown;
      title?: unknown;
      status?: unknown;
    };

    if (typeof day.dayKey !== "string" || !WEEKDAYS.includes(day.dayKey as WeekdayKey)) {
      continue;
    }

    const slotKey: TimeSlotKey =
      day.slotKey === "early-morning" || day.slotKey === "morning" || day.slotKey === "afternoon" || day.slotKey === "evening"
        ? day.slotKey
        : "morning";

    if (!TIME_SLOTS.includes(slotKey)) {
      continue;
    }

    sanitized.push({
      dayKey: day.dayKey as WeekdayKey,
      slotKey,
      title: typeof day.title === "string" ? day.title : "",
      status: normalizeStatus(day.status),
    });
  }

  return sanitized;
}

export async function GET(request: NextRequest) {
  const user = await requireFirebaseUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const plans = await listRoutinePlansByUser(user.uid);
    return NextResponse.json({ plans });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load routine plans";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await requireFirebaseUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as CreateRoutinePayload;
  const name = String(payload.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Routine name is required" }, { status: 400 });
  }

  const source: RoutinePlanSource = payload.source === "template" ? "template" : "custom";
  const sanitizedDays = sanitizeDays(payload.days);

  try {
    const plan = await createRoutinePlan({
      userId: user.uid,
      name,
      goal: typeof payload.goal === "string" ? payload.goal : undefined,
      source,
      days: sanitizedDays,
    });

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create routine plan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await requireFirebaseUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as UpdateRoutinePayload;
  const planId = String(payload.planId ?? "").trim();

  if (!planId) {
    return NextResponse.json({ error: "planId is required" }, { status: 400 });
  }

  const patch: { name?: string; goal?: string; days?: Partial<RoutineDayPlan>[] } = {};

  if (typeof payload.name === "string") {
    patch.name = payload.name;
  }

  if (typeof payload.goal === "string") {
    patch.goal = payload.goal;
  }

  if (payload.days !== undefined) {
    patch.days = sanitizeDays(payload.days);
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  try {
    const plan = await updateRoutinePlan(user.uid, planId, patch);
    return NextResponse.json({ plan });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update routine plan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await requireFirebaseUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as { planId?: string };
  const planId = String(payload.planId ?? "").trim();

  if (!planId) {
    return NextResponse.json({ error: "planId is required" }, { status: 400 });
  }

  try {
    await deleteRoutinePlan(user.uid, planId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete routine plan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
