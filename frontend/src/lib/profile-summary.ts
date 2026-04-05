import type { ProfileSummary, UserProfile } from "@/lib/profile-types";
import { calculateNutritionRequirements } from "@/lib/nutrition-requirements";

export function buildProfileSummary(profile: UserProfile): ProfileSummary {
  const req = calculateNutritionRequirements(profile);
  const riskFlags: string[] = [];

  if (profile.weeklyWorkoutDays <= 1) {
    riskFlags.push("Very low activity schedule. Aim for at least 3 active days/week.");
  }
  if (profile.goal === "fat-loss" && req.targetCalories < 1400) {
    riskFlags.push("Aggressive calorie target detected. Consider a smaller deficit.");
  }

  const status =
    profile.goal === "muscle-gain"
      ? "Performance and recovery focus"
      : profile.goal === "fat-loss"
        ? "Body-composition reduction focus"
        : "Consistency and health focus";

  return {
    headline: `${profile.name}, your current target is ${Math.round(req.targetCalories)} kcal/day with ${Math.round(req.macros.protein_g)} g protein.`,
    status,
    nextActions: [
      "Track body weight trend weekly and adjust calories slowly.",
      "Keep protein spread across 3-5 meals.",
      "Hit hydration and fiber target daily.",
    ],
    riskFlags,
  };
}
