export type WeekdayKey =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export type TimeSlotKey = "early-morning" | "morning" | "afternoon" | "evening";

export type RoutineDayStatus = "completed" | "partial" | "not-done";

export type RoutinePlanSource = "template" | "custom";

export type RoutineDayPlan = {
  dayKey: WeekdayKey;
  slotKey: TimeSlotKey;
  title: string;
  status: RoutineDayStatus;
};

export type RoutinePlan = {
  id: string;
  userId: string;
  name: string;
  goal?: string;
  source: RoutinePlanSource;
  days: RoutineDayPlan[];
  weekKey: string;
  createdAt: string;
  updatedAt: string;
};

export const WEEKDAYS: WeekdayKey[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export const TIME_SLOTS: TimeSlotKey[] = ["early-morning", "morning", "afternoon", "evening"];

const EMPTY_DAY_TITLES: Record<WeekdayKey, string> = {
  sunday: "",
  monday: "",
  tuesday: "",
  wednesday: "",
  thursday: "",
  friday: "",
  saturday: "",
};

const EMPTY_SLOT_TITLES: Record<TimeSlotKey, string> = {
  "early-morning": "",
  morning: "",
  afternoon: "",
  evening: "",
};

function toSlotKey(value: unknown): TimeSlotKey {
  if (value === "early-morning" || value === "morning" || value === "afternoon" || value === "evening") {
    return value;
  }

  return "morning";
}

export function normalizeRoutineDays(days: Partial<RoutineDayPlan>[] | undefined): RoutineDayPlan[] {
  const byCell = new Map<string, Partial<RoutineDayPlan>>();

  for (const day of days ?? []) {
    if (!day.dayKey || !WEEKDAYS.includes(day.dayKey)) {
      continue;
    }

    const slotKey = toSlotKey(day.slotKey);
    byCell.set(`${day.dayKey}:${slotKey}`, day);
  }

  return WEEKDAYS.flatMap((dayKey) =>
    TIME_SLOTS.map((slotKey) => {
      const source = byCell.get(`${dayKey}:${slotKey}`);
      return {
        dayKey,
        slotKey,
        title:
          typeof source?.title === "string"
            ? source.title.trim()
            : `${EMPTY_DAY_TITLES[dayKey]}${EMPTY_SLOT_TITLES[slotKey]}`,
        status:
          source?.status === "completed" || source?.status === "partial" || source?.status === "not-done"
            ? source.status
            : "not-done",
      };
    }),
  );
}
