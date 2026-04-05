export type HealthTotals = {
  steps: number;
  dailySteps: number;
  caloriesKcal: number;
  distanceMeters: number;
  activeMinutes: number;
  heartMinutes: number;
  dailyHeartPoints: number;
};

export type AchievementBadge = {
  id: string;
  title: string;
  description: string;
  period: "today" | "week";
  unit: string;
  threshold: number;
  current: number;
  badgeCount: number;
  nextTarget: number;
  unlocked: boolean;
  progress: number;
};

type BadgeSpec = {
  id: string;
  title: string;
  description: string;
  period: "today" | "week";
  unit: string;
  threshold: number;
  selector: (totals: HealthTotals) => number;
};

const badgeSpecs: BadgeSpec[] = [
  {
    id: "steps-5k",
    title: "Starter Steps",
    description: "Reach 5,000 steps in your 7-day summary.",
    period: "week",
    unit: "steps",
    threshold: 5000,
    selector: (totals) => totals.steps,
  },
  {
    id: "steps-10k",
    title: "10k Strider",
    description: "Reach 10,000 steps in your 7-day summary.",
    period: "week",
    unit: "steps",
    threshold: 10000,
    selector: (totals) => totals.steps,
  },
  {
    id: "distance-5k",
    title: "5K Distance",
    description: "Cover at least 5 km in your 7-day summary.",
    period: "week",
    unit: "km",
    threshold: 5,
    selector: (totals) => totals.distanceMeters / 1000,
  },
  {
    id: "distance-25k",
    title: "Explorer Distance",
    description: "Cover at least 25 km in your 7-day summary.",
    period: "week",
    unit: "km",
    threshold: 25,
    selector: (totals) => totals.distanceMeters / 1000,
  },
  {
    id: "active-150",
    title: "Active 150",
    description: "Accumulate 150 active minutes in 7 days.",
    period: "week",
    unit: "min",
    threshold: 150,
    selector: (totals) => totals.activeMinutes,
  },
  {
    id: "heart-100",
    title: "Heart Points 100",
    description: "Hit 100 heart minutes in your 7-day summary.",
    period: "week",
    unit: "points",
    threshold: 100,
    selector: (totals) => totals.heartMinutes,
  },
  {
    id: "heart-300",
    title: "Cardio Champion",
    description: "Hit 300 heart minutes in your 7-day summary.",
    period: "week",
    unit: "points",
    threshold: 300,
    selector: (totals) => totals.heartMinutes,
  },
  {
    id: "daily-steps-8k",
    title: "Daily Stride",
    description: "Reach 8,000 steps in your latest daily snapshot.",
    period: "today",
    unit: "steps",
    threshold: 8000,
    selector: (totals) => totals.dailySteps,
  },
  {
    id: "daily-heart-30",
    title: "Daily Heart Boost",
    description: "Reach 30 heart points in your latest daily snapshot.",
    period: "today",
    unit: "points",
    threshold: 30,
    selector: (totals) => totals.dailyHeartPoints,
  },
];

export function buildHealthBadges(totals: HealthTotals): AchievementBadge[] {
  return badgeSpecs.map((spec) => {
    const current = spec.selector(totals);
    const badgeCount = spec.threshold > 0 ? Math.floor(current / spec.threshold) : 0;
    const cycleProgress = spec.threshold > 0 ? current % spec.threshold : 0;
    const progress = spec.threshold > 0 ? Math.min(100, Math.round((cycleProgress / spec.threshold) * 100)) : 0;
    const nextTarget = spec.threshold * (badgeCount + 1);

    return {
      id: spec.id,
      title: spec.title,
      description: spec.description,
      period: spec.period,
      unit: spec.unit,
      threshold: spec.threshold,
      current,
      badgeCount,
      nextTarget,
      unlocked: badgeCount > 0,
      progress,
    };
  });
}
