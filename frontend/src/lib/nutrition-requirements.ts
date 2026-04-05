import { ActivityLevel, UserProfile, type NutritionRequirements } from "@/lib/profile-types";

const activityMultiplier: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  "very-active": 1.9,
};

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function calculateBmr(profile: UserProfile) {
  const base =
    10 * profile.weightKg +
    6.25 * profile.heightCm -
    5 * profile.age +
    (profile.sex === "male" ? 5 : -161);

  return Math.max(900, base);
}

function targetCaloriesFromGoal(tdee: number, goal: UserProfile["goal"]) {
  if (goal === "fat-loss") return tdee - 450;
  if (goal === "muscle-gain") return tdee + 300;
  if (goal === "recomposition") return tdee - 150;
  return tdee;
}

export function calculateNutritionRequirements(profile: UserProfile): NutritionRequirements {
  const bmr = calculateBmr(profile);
  const tdee = bmr * activityMultiplier[profile.activityLevel];
  const targetCalories = Math.max(1200, targetCaloriesFromGoal(tdee, profile.goal));

  const proteinPerKg = profile.goal === "muscle-gain" ? 2 : profile.goal === "fat-loss" ? 2.1 : 1.6;
  const proteinG = profile.weightKg * proteinPerKg;

  const fatRatio = profile.goal === "fat-loss" ? 0.25 : 0.28;
  const fatG = (targetCalories * fatRatio) / 9;

  const remainingCalories = targetCalories - proteinG * 4 - fatG * 9;
  const carbsG = Math.max(80, remainingCalories / 4);

  const fiberG = profile.sex === "male" ? 35 : 28;
  const waterMl = profile.weightKg * 35 + profile.weeklyWorkoutDays * 250;

  return {
    bmr: round(bmr),
    tdee: round(tdee),
    targetCalories: round(targetCalories),
    macros: {
      protein_g: round(proteinG),
      carbs_g: round(carbsG),
      fat_g: round(fatG),
    },
    hydration: {
      water_ml: round(waterMl),
      sodium_mg: profile.weeklyWorkoutDays >= 5 ? 2200 : 1800,
      potassium_mg: 3500,
    },
    micros: {
      fiber_g: fiberG,
      calcium_mg: 1000,
      iron_mg: profile.sex === "male" ? 8 : 18,
      vitamin_c_mg: 90,
      vitamin_d_iu: 800,
      vitamin_b12_mcg: 2.4,
      magnesium_mg: profile.sex === "male" ? 420 : 320,
      zinc_mg: profile.sex === "male" ? 11 : 8,
    },
  };
}
