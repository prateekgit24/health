"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase-client";
import {
  TIME_SLOTS,
  WEEKDAYS,
  type RoutineDayPlan,
  type RoutineDayStatus,
  type RoutinePlan,
  type TimeSlotKey,
  type WeekdayKey,
} from "@/lib/routines-types";

type RoutineTemplate = {
  id: string;
  name: string;
  goal: string;
  description: string;
  days: RoutineDayPlan[];
};

type RoutineApiResponse = {
  plans?: RoutinePlan[];
  plan?: RoutinePlan;
  error?: string;
};

const weekdayLabels: Record<WeekdayKey, string> = {
  sunday: "Sunday",
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
};

const slotLabels: Record<TimeSlotKey, string> = {
  "early-morning": "Early Morning",
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

function todayDayKey(): WeekdayKey {
  return WEEKDAYS[new Date().getDay()] ?? "sunday";
}

function getCurrentWeekKey() {
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() - cursor.getDay());
  return cursor.toISOString().slice(0, 10);
}

function emptyDays(): RoutineDayPlan[] {
  return WEEKDAYS.flatMap((dayKey) =>
    TIME_SLOTS.map((slotKey) => ({
      dayKey,
      slotKey,
      title: "",
      status: "not-done" as RoutineDayStatus,
    })),
  );
}

function cloneDays(days: RoutineDayPlan[]) {
  return days.map((day) => ({ ...day }));
}

function buildTemplateDays(entries: Array<{ dayKey: WeekdayKey; slotKey: TimeSlotKey; title: string }>) {
  const cells = emptyDays();

  for (const entry of entries) {
    const index = cells.findIndex((cell) => cell.dayKey === entry.dayKey && cell.slotKey === entry.slotKey);
    if (index < 0) {
      continue;
    }

    cells[index] = {
      ...cells[index],
      title: entry.title,
      status: "not-done",
    };
  }

  return cells;
}

const defaultTemplates: RoutineTemplate[] = [
  {
    id: "fat-loss",
    name: "Fat Loss Starter",
    goal: "Fat Loss",
    description: "Balance lifting, cardio, and recovery to improve body composition sustainably.",
    days: buildTemplateDays([
      { dayKey: "monday", slotKey: "morning", title: "Upper-body strength" },
      { dayKey: "monday", slotKey: "evening", title: "20-min walk" },
      { dayKey: "tuesday", slotKey: "evening", title: "Zone-2 cardio" },
      { dayKey: "wednesday", slotKey: "morning", title: "Lower-body strength" },
      { dayKey: "thursday", slotKey: "evening", title: "Mobility + core" },
      { dayKey: "friday", slotKey: "morning", title: "Full-body circuit" },
      { dayKey: "saturday", slotKey: "morning", title: "Outdoor walk/cycle" },
      { dayKey: "sunday", slotKey: "evening", title: "Recovery + weekly review" },
    ]),
  },
  {
    id: "muscle-gain",
    name: "Muscle Gain Split",
    goal: "Muscle Gain",
    description: "Structured resistance training with strategic rest to support progressive overload.",
    days: buildTemplateDays([
      { dayKey: "monday", slotKey: "morning", title: "Push day" },
      { dayKey: "tuesday", slotKey: "morning", title: "Pull day" },
      { dayKey: "wednesday", slotKey: "morning", title: "Leg day" },
      { dayKey: "thursday", slotKey: "evening", title: "Active recovery" },
      { dayKey: "friday", slotKey: "morning", title: "Upper hypertrophy" },
      { dayKey: "saturday", slotKey: "morning", title: "Lower hypertrophy" },
      { dayKey: "sunday", slotKey: "evening", title: "Rest + prep" },
    ]),
  },
  {
    id: "general-fitness",
    name: "General Fitness Balance",
    goal: "General Fitness",
    description: "Mix strength, cardio, and flexibility for an all-round active week.",
    days: buildTemplateDays([
      { dayKey: "monday", slotKey: "morning", title: "Full-body strength" },
      { dayKey: "tuesday", slotKey: "evening", title: "Brisk walk/jog" },
      { dayKey: "wednesday", slotKey: "evening", title: "Mobility + yoga" },
      { dayKey: "thursday", slotKey: "morning", title: "Full-body strength" },
      { dayKey: "friday", slotKey: "evening", title: "Intervals or sports" },
      { dayKey: "saturday", slotKey: "morning", title: "Light activity" },
      { dayKey: "sunday", slotKey: "evening", title: "Recovery" },
    ]),
  },
];

function updateCell(
  days: RoutineDayPlan[],
  dayKey: WeekdayKey,
  slotKey: TimeSlotKey,
  patch: Partial<RoutineDayPlan>,
) {
  return days.map((cell) =>
    cell.dayKey === dayKey && cell.slotKey === slotKey
      ? {
          ...cell,
          ...patch,
        }
      : cell,
  );
}

function getCellStatusIcon(status: RoutineDayStatus, isPast: boolean) {
  if (status === "completed") {
    return { icon: "✓", tone: "text-emerald-200 border-emerald-300/55 bg-emerald-300/18", title: "Done" };
  }

  if (status === "partial") {
    return { icon: "-", tone: "text-amber-200 border-amber-300/55 bg-amber-300/18", title: "Partially done" };
  }

  if (isPast) {
    return { icon: "✕", tone: "text-rose-200 border-rose-300/55 bg-rose-300/16", title: "Incomplete" };
  }

  return { icon: "", tone: "text-emerald-100 border-emerald-200/35 bg-emerald-950/70", title: "No status" };
}

function nextStatus(status: RoutineDayStatus) {
  if (status === "not-done") {
    return "partial" as RoutineDayStatus;
  }

  if (status === "partial") {
    return "completed" as RoutineDayStatus;
  }

  return "not-done" as RoutineDayStatus;
}

function isPastDay(planWeekKey: string, dayKey: WeekdayKey) {
  const weekStart = new Date(`${planWeekKey}T00:00:00`);
  if (Number.isNaN(weekStart.getTime())) {
    return false;
  }

  const dayDate = new Date(weekStart);
  dayDate.setDate(weekStart.getDate() + WEEKDAYS.indexOf(dayKey));
  dayDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return dayDate.getTime() < today.getTime();
}

function WeeklyGridEditor({
  days,
  onChange,
  expandedDay,
  weekKey,
}: {
  days: RoutineDayPlan[];
  onChange: (dayKey: WeekdayKey, slotKey: TimeSlotKey, patch: Partial<RoutineDayPlan>) => void;
  expandedDay: WeekdayKey;
  weekKey: string;
}) {
  const presentDay = todayDayKey();
  const gridTemplateColumns = `84px ${WEEKDAYS.map((day) =>
    day === presentDay ? "minmax(168px,1.5fr)" : "minmax(112px,1fr)",
  ).join(" ")}`;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[980px] rounded-xl border border-emerald-200/20 bg-emerald-950/25 p-2">
        <div className="grid gap-2" style={{ gridTemplateColumns }}>
          <div className="rounded-lg border border-emerald-200/20 bg-emerald-950/45 p-2 text-center text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200/90">
            Time
          </div>
          {WEEKDAYS.map((day) => (
            <div
              key={`header-${day}`}
              className={`rounded-lg border p-2 text-center text-xs font-semibold uppercase tracking-[0.14em] ${
                day === expandedDay
                  ? "border-amber-300/60 bg-amber-300/15 text-amber-100"
                  : "border-emerald-200/20 bg-emerald-950/45 text-emerald-100"
              }`}
            >
              {weekdayLabels[day]}
            </div>
          ))}

          {TIME_SLOTS.map((slotKey) => (
            <div key={`row-${slotKey}`} className="contents">
              <div className="rounded-lg border border-emerald-200/20 bg-emerald-950/45 p-2 text-xs font-semibold text-emerald-100">
                {slotLabels[slotKey]}
              </div>

              {WEEKDAYS.map((dayKey) => {
                const cell = days.find((item) => item.dayKey === dayKey && item.slotKey === slotKey) ?? {
                  dayKey,
                  slotKey,
                  title: "",
                  status: "not-done" as RoutineDayStatus,
                };
                const isExpandedDay = dayKey === expandedDay;
                const isPast = isPastDay(weekKey, dayKey);
                const statusMeta = getCellStatusIcon(cell.status, isPast);

                return (
                  <div
                    key={`${dayKey}-${slotKey}`}
                    className={`relative rounded-lg border p-2 ${
                      isExpandedDay
                        ? "min-h-[180px] border-amber-300/45 bg-amber-300/10"
                        : "min-h-[140px] border-emerald-200/20 bg-emerald-950/45"
                    }`}
                  >
                    <button
                      type="button"
                      title={statusMeta.title}
                      onClick={() => onChange(dayKey, slotKey, { status: nextStatus(cell.status) })}
                      className={`absolute right-2 top-2 z-20 h-6 w-6 rounded-md border text-sm font-bold leading-none ${statusMeta.tone}`}
                    >
                      {statusMeta.icon}
                    </button>

                    <textarea
                      value={cell.title}
                      onChange={(event) => onChange(dayKey, slotKey, { title: event.target.value })}
                      placeholder="Plan"
                      className="absolute inset-0 z-0 h-full w-full resize-none bg-transparent px-2 pb-2 pr-10 pt-8 text-xs text-emerald-50 outline-none placeholder:text-emerald-200/45"
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RoutinesPage() {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [plans, setPlans] = useState<RoutinePlan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string>("");
  const [editorDays, setEditorDays] = useState<RoutineDayPlan[]>(emptyDays());
  const [customName, setCustomName] = useState("");
  const [customGoal, setCustomGoal] = useState("");
  const [customDays, setCustomDays] = useState<RoutineDayPlan[]>(emptyDays());
  const [expandedDay, setExpandedDay] = useState<WeekdayKey>(todayDayKey());
  const [showCreateGrid, setShowCreateGrid] = useState(false);
  const [showEditGrid, setShowEditGrid] = useState(false);

  const authedFetch = useCallback(async (input: string, init?: RequestInit) => {
    const firebaseAuth = getFirebaseAuth();
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser) {
      return fetch(input, init);
    }

    const token = await currentUser.getIdToken();
    const headers = new Headers(init?.headers ?? {});
    headers.set("Authorization", `Bearer ${token}`);

    return fetch(input, {
      ...init,
      headers,
    });
  }, []);

  const activePlan = useMemo(
    () => plans.find((plan) => plan.id === activePlanId) ?? null,
    [plans, activePlanId],
  );

  const completionStats = useMemo(() => {
    const planned = editorDays.filter((day) => day.title.trim().length > 0);
    const completed = planned.filter((day) => day.status === "completed").length;
    const partial = planned.filter((day) => day.status === "partial").length;
    const notDone = planned.length - completed - partial;

    return { completed, partial, notDone, planned: planned.length };
  }, [editorDays]);

  const loadPlans = useCallback(async () => {
    setLoading(true);

    try {
      const response = await authedFetch("/api/routines");
      const payload = (await response.json()) as RoutineApiResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load routine plans");
      }

      const fetchedPlans = payload.plans ?? [];
      setPlans(fetchedPlans);
      setActivePlanId((current) => current || fetchedPlans[0]?.id || "");
      setMessage(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load routines";
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [authedFetch]);

  useEffect(() => {
    setExpandedDay(todayDayKey());
  }, []);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthed(false);
        setPlans([]);
        setActivePlanId("");
        setLoading(false);
        return;
      }

      setAuthed(true);
      await loadPlans();
    });

    return () => unsubscribe();
  }, [loadPlans]);

  useEffect(() => {
    if (!activePlan) {
      setEditorDays(emptyDays());
      return;
    }

    setEditorDays(cloneDays(activePlan.days));
  }, [activePlan]);

  async function createFromTemplate(template: RoutineTemplate) {
    setSaving(true);
    setMessage(null);

    try {
      const response = await authedFetch("/api/routines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: template.name,
          goal: template.goal,
          source: "template",
          days: template.days,
        }),
      });

      const payload = (await response.json()) as RoutineApiResponse;
      if (!response.ok || !payload.plan) {
        throw new Error(payload.error ?? "Failed to create plan from template");
      }

      setPlans((prev) => [payload.plan!, ...prev]);
      setActivePlanId(payload.plan.id);
      setShowEditGrid(true);
      setMessage(`Template plan "${payload.plan.name}" added to your account.`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create template plan";
      setMessage(errorMessage);
    } finally {
      setSaving(false);
    }
  }

  async function createCustomPlan(event: FormEvent) {
    event.preventDefault();
    const trimmedName = customName.trim();
    const hasAnyWorkout = customDays.some((day) => day.title.trim().length > 0);

    if (!trimmedName) {
      setMessage("Please enter a name for your custom routine plan.");
      return;
    }

    if (!hasAnyWorkout) {
      setMessage("Please add at least one planned cell in your weekly grid.");
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await authedFetch("/api/routines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          goal: customGoal,
          source: "custom",
          days: customDays,
        }),
      });

      const payload = (await response.json()) as RoutineApiResponse;
      if (!response.ok || !payload.plan) {
        throw new Error(payload.error ?? "Failed to create custom routine plan");
      }

      setPlans((prev) => [payload.plan!, ...prev]);
      setActivePlanId(payload.plan.id);
      setCustomName("");
      setCustomGoal("");
      setCustomDays(emptyDays());
      setShowCreateGrid(false);
      setShowEditGrid(true);
      setMessage("Custom routine created and saved.");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create custom plan";
      setMessage(errorMessage);
    } finally {
      setSaving(false);
    }
  }

  function updateEditorDay(dayKey: WeekdayKey, slotKey: TimeSlotKey, patch: Partial<RoutineDayPlan>) {
    setEditorDays((prev) => updateCell(prev, dayKey, slotKey, patch));
  }

  function updateCustomDay(dayKey: WeekdayKey, slotKey: TimeSlotKey, patch: Partial<RoutineDayPlan>) {
    setCustomDays((prev) => updateCell(prev, dayKey, slotKey, patch));
  }

  async function saveActivePlan() {
    if (!activePlan) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await authedFetch("/api/routines", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: activePlan.id,
          days: editorDays,
        }),
      });

      const payload = (await response.json()) as RoutineApiResponse;
      if (!response.ok || !payload.plan) {
        throw new Error(payload.error ?? "Failed to update routine plan");
      }

      setPlans((prev) => prev.map((plan) => (plan.id === payload.plan!.id ? payload.plan! : plan)));
      setMessage("Routine progress saved.");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save routine";
      setMessage(errorMessage);
    } finally {
      setSaving(false);
    }
  }

  async function deleteActivePlan() {
    if (!activePlan) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await authedFetch("/api/routines", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: activePlan.id }),
      });

      const payload = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to delete routine plan");
      }

      const remaining = plans.filter((plan) => plan.id !== activePlan.id);
      setPlans(remaining);
      if (activePlanId === activePlan.id) {
        setActivePlanId(remaining[0]?.id ?? "");
      }
      setEditorDays(emptyDays());
      setShowEditGrid(false);
      setMessage("Routine plan removed.");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete routine plan";
      setMessage(errorMessage);
    } finally {
      setSaving(false);
    }
  }

  if (!authed && !loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <section className="rounded-2xl border border-emerald-200/20 bg-emerald-950/25 p-6">
          <h1 className="text-3xl font-semibold text-emerald-50">Routine Planner</h1>
          <p className="mt-2 text-sm text-emerald-100/80">
            Please log in from your profile to create and track your weekly routine plans.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <section className="rounded-3xl border border-emerald-200/20 bg-emerald-950/25 p-6 sm:p-8">
        <h1 className="text-4xl font-semibold tracking-tight text-emerald-50">Routine Planner</h1>
        <p className="mt-3 max-w-3xl text-emerald-100/80">
          Click the mini status square in each box to cycle through incomplete, partial, done, and back.
        </p>
      </section>

      {message ? (
        <p className="mt-4 rounded-xl border border-emerald-200/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
          {message}
        </p>
      ) : null}

      <section className="mt-6">
        <h2 className="text-2xl font-semibold text-amber-200">Suggested Plans</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          {defaultTemplates.map((template) => (
            <article key={template.id} className="rounded-2xl border border-emerald-200/15 bg-emerald-950/25 p-5">
              <h3 className="text-xl font-semibold text-emerald-50">{template.name}</h3>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-emerald-200/80">{template.goal}</p>
              <p className="mt-2 text-sm text-emerald-100/80">{template.description}</p>
              <button
                type="button"
                onClick={() => createFromTemplate(template)}
                disabled={saving || loading}
                className="mt-4 rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Use This Plan
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-emerald-200/20 bg-emerald-950/25 p-5 sm:p-6">
        {!showCreateGrid ? (
          <button
            type="button"
            onClick={() => setShowCreateGrid(true)}
            className="rounded-full bg-emerald-300 px-5 py-2 text-sm font-semibold text-zinc-900 hover:bg-emerald-200"
          >
            Create Your Own Plan
          </button>
        ) : (
          <form onSubmit={createCustomPlan} className="space-y-4">
            <h2 className="text-2xl font-semibold text-amber-200">Create Your Own Weekly Plan</h2>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm text-emerald-100/85">
                <span>Plan Name</span>
                <input
                  value={customName}
                  onChange={(event) => setCustomName(event.target.value)}
                  placeholder="Example: My Office Week Plan"
                  className="w-full rounded-lg border border-emerald-100/20 bg-emerald-950/35 px-3 py-2 text-emerald-50"
                />
              </label>
              <label className="space-y-1 text-sm text-emerald-100/85">
                <span>Goal (optional)</span>
                <input
                  value={customGoal}
                  onChange={(event) => setCustomGoal(event.target.value)}
                  placeholder="Example: Improve stamina"
                  className="w-full rounded-lg border border-emerald-100/20 bg-emerald-950/35 px-3 py-2 text-emerald-50"
                />
              </label>
            </div>

            <WeeklyGridEditor
              days={customDays}
              expandedDay={expandedDay}
              weekKey={getCurrentWeekKey()}
              onChange={(dayKey, slotKey, patch) => updateCustomDay(dayKey, slotKey, patch)}
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={saving || loading}
                className="rounded-full bg-amber-300 px-5 py-2 text-sm font-semibold text-zinc-900 hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Save Custom Plan
              </button>
              <button
                type="button"
                onClick={() => setShowCreateGrid(false)}
                className="rounded-full border border-emerald-200/35 px-5 py-2 text-sm font-semibold text-emerald-50 hover:border-emerald-100/60"
              >
                Close
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="mt-8 rounded-2xl border border-emerald-200/20 bg-emerald-950/25 p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-amber-200">Your Saved Plans</h2>
            <p className="text-sm text-emerald-100/75">Pick a routine from the dropdown to manage it.</p>
          </div>

          <label className="flex min-w-[220px] flex-col gap-1 text-sm text-emerald-100/85">
            <span>Routine</span>
            <select
              value={activePlanId}
              onChange={(event) => {
                setActivePlanId(event.target.value);
                setShowEditGrid(false);
              }}
              disabled={loading || plans.length === 0}
              className="rounded-lg border border-emerald-100/20 bg-emerald-950/35 px-3 py-2 text-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {plans.length === 0 ? <option value="">No plans available</option> : null}
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                  {plan.goal ? ` - ${plan.goal}` : ""}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading ? <p className="mt-3 text-sm text-emerald-100/70">Loading...</p> : null}

        {activePlan ? (
          <>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-2xl font-semibold text-emerald-50">{activePlan.name}</h3>
                <p className="text-sm text-emerald-100/75">
                  ✓ {completionStats.completed} | - {completionStats.partial} | ✕ {completionStats.notDone}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditGrid((prev) => !prev)}
                  className="rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-emerald-200"
                >
                  {showEditGrid ? "Hide Grid" : "Open Grid"}
                </button>
                <button
                  type="button"
                  onClick={saveActivePlan}
                  disabled={saving || loading}
                  className="rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={deleteActivePlan}
                  disabled={saving || loading}
                  className="rounded-full border border-rose-300/50 px-4 py-2 text-sm font-semibold text-rose-100 hover:border-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Delete
                </button>
              </div>
            </div>

            {showEditGrid ? (
              <div className="mt-4">
                <WeeklyGridEditor
                  days={editorDays}
                  expandedDay={expandedDay}
                  weekKey={activePlan.weekKey}
                  onChange={(dayKey, slotKey, patch) => updateEditorDay(dayKey, slotKey, patch)}
                />
              </div>
            ) : null}
          </>
        ) : (
          !loading ? <p className="mt-3 text-sm text-emerald-100/75">Create a plan to start tracking routines.</p> : null
        )}
      </section>
    </main>
  );
}
