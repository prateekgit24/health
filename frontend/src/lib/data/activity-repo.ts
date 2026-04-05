import activitiesData from "@/data/activities/activities.json";

export type ActivityIntensity = "all" | "low" | "moderate" | "high";
export type ActivityType = "all" | "cardio" | "conditioning" | "strength" | "mobility";

export type ActivityItem = {
  name: string;
  mets: number;
  intensity: Exclude<ActivityIntensity, "all">;
  benefits: string[];
  impact: string;
  type: Exclude<ActivityType, "all">;
  source: string;
};

export function getActivities() {
  return activitiesData as ActivityItem[];
}

export function filterActivities(
  activities: ActivityItem[],
  query: string,
  intensity: ActivityIntensity,
  type: ActivityType,
) {
  const normalized = query.trim().toLowerCase();

  return activities.filter((activity) => {
    const matchesQuery =
      normalized.length === 0 ||
      activity.name.toLowerCase().includes(normalized) ||
      activity.benefits.join(" ").toLowerCase().includes(normalized);

    const matchesIntensity = intensity === "all" || activity.intensity === intensity;
    const matchesType = type === "all" || activity.type === type;

    return matchesQuery && matchesIntensity && matchesType;
  });
}
