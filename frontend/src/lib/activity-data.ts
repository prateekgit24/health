export type Activity = {
  name: string;
  mets: number;
  intensity: "low" | "moderate" | "high";
  benefits: string[];
  impact: string;
};

export const activities: Activity[] = [
  {
    name: "Brisk Walking (5.6 km/h)",
    mets: 4.3,
    intensity: "moderate",
    benefits: ["cardio health", "fat loss support", "joint-friendly"],
    impact: "Builds consistency and baseline endurance",
  },
  {
    name: "Cycling (light-moderate)",
    mets: 6.8,
    intensity: "moderate",
    benefits: ["leg endurance", "cardio", "low impact"],
    impact: "Improves work capacity with lower joint stress",
  },
  {
    name: "Jump Rope",
    mets: 11,
    intensity: "high",
    benefits: ["coordination", "calorie burn", "conditioning"],
    impact: "Increases anaerobic capacity and footwork",
  },
  {
    name: "Strength Training",
    mets: 6,
    intensity: "moderate",
    benefits: ["muscle gain", "bone density", "metabolic health"],
    impact: "Supports long-term body composition change",
  },
];
