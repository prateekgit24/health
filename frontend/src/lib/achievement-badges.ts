export type HealthTotals = {
  steps: number;
  dailySteps: number;
  loggingStreakDays: number;
  caloriesKcal: number;
  distanceMeters: number;
  activeMinutes: number;
  heartMinutes: number;
  dailyHeartPoints: number;
};

export type AchievementTier = "base" | "mid" | "elite";
export type AchievementCategory = "daily" | "weekly" | "streak";

export type AchievementBadge = {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  unit: string;
  threshold: number;
  current: number;
  nextTarget: number;
  remaining: number;
  unlocked: boolean;
  progress: number;
};

type BadgeSpec = {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  unit: string;
  threshold: number;
  selector: (totals: HealthTotals) => number;
};

const badgeSpecs: BadgeSpec[] = [
  {
    id: "daily-10k-steps",
    title: "Daily 10K",
    description: "Hit 10,000 steps in a single day.",
    category: "daily",
    tier: "base",
    unit: "steps",
    threshold: 10000,
    selector: (totals) => totals.dailySteps,
  },
  {
    id: "daily-15k-steps",
    title: "Daily 15K",
    description: "Crush 15,000 steps in one day.",
    category: "daily",
    tier: "mid",
    unit: "steps",
    threshold: 15000,
    selector: (totals) => totals.dailySteps,
  },
  {
    id: "daily-25k-steps",
    title: "Daily 25K",
    description: "Elite grind: reach 25,000 steps in one day.",
    category: "daily",
    tier: "elite",
    unit: "steps",
    threshold: 25000,
    selector: (totals) => totals.dailySteps,
  },
  {
    id: "weekly-50k-steps",
    title: "Weekly 50K",
    description: "Cross 50,000 steps in your weekly total.",
    category: "weekly",
    tier: "mid",
    unit: "steps",
    threshold: 50000,
    selector: (totals) => totals.steps,
  },
  {
    id: "weekly-75k-steps",
    title: "Weekly 75K",
    description: "Push through 75,000 steps in a week.",
    category: "weekly",
    tier: "mid",
    unit: "steps",
    threshold: 75000,
    selector: (totals) => totals.steps,
  },
  {
    id: "weekly-100k-steps",
    title: "Weekly 100K",
    description: "Legend tier: hit 100,000+ steps in one week.",
    category: "weekly",
    tier: "elite",
    unit: "steps",
    threshold: 100000,
    selector: (totals) => totals.steps,
  },
  {
    id: "streak-7-days",
    title: "7-Day Streak",
    description: "Log activity seven days in a row.",
    category: "streak",
    tier: "base",
    unit: "days",
    threshold: 7,
    selector: (totals) => totals.loggingStreakDays,
  },
  {
    id: "streak-30-days",
    title: "30-Day Streak",
    description: "Stay consistent for a full 30-day streak.",
    category: "streak",
    tier: "mid",
    unit: "days",
    threshold: 30,
    selector: (totals) => totals.loggingStreakDays,
  },
  {
    id: "streak-100-days",
    title: "100-Day Streak",
    description: "Master-tier discipline with a 100-day streak.",
    category: "streak",
    tier: "elite",
    unit: "days",
    threshold: 100,
    selector: (totals) => totals.loggingStreakDays,
  },
];

export function buildHealthBadges(totals: HealthTotals): AchievementBadge[] {
  return badgeSpecs.map((spec) => {
    const current = spec.selector(totals);
    const unlocked = current >= spec.threshold;
    const progress = spec.threshold > 0 ? Math.min(100, Math.round((current / spec.threshold) * 100)) : 0;
    const remaining = Math.max(0, Math.ceil(spec.threshold - current));

    return {
      id: spec.id,
      title: spec.title,
      description: spec.description,
      category: spec.category,
      tier: spec.tier,
      unit: spec.unit,
      threshold: spec.threshold,
      current,
      nextTarget: spec.threshold,
      remaining,
      unlocked,
      progress,
    };
  });
}
