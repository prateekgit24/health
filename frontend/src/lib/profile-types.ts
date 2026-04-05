export type BiologicalSex = "male" | "female";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very-active";

export type GoalType = "fat-loss" | "recomposition" | "maintenance" | "muscle-gain";

export type DietPreference = "veg" | "egg" | "non-veg";

export type StressLevel = "low" | "moderate" | "high";

export type DetailedProfile = {
  lifestyle?: {
    sleepHours?: number;
    stressLevel?: StressLevel;
    jobActivity?: string;
  };
  medical?: {
    bloodGroup?: string;
    hemoglobinGdl?: number;
    eyesightLeft?: string;
    eyesightRight?: string;
    fastingSugarMgDl?: number;
    postMealSugarMgDl?: number;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    restingHeartRateBpm?: number;
    allergies?: string;
    conditions?: string;
    injuries?: string;
    medications?: string;
    notes?: string;
  };
  preferences?: {
    trainingTime?: string;
    constraints?: string;
    goalDate?: string;
  };
};

export type UserProfile = {
  id: string;
  name: string;
  email?: string;
  avatarEmoji?: string;
  age: number;
  sex: BiologicalSex;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: GoalType;
  dietPreference: DietPreference;
  targetWeightKg?: number;
  weeklyWorkoutDays: number;
  medicalNotes?: string;
  detailedProfile?: DetailedProfile;
  compareOptIn?: boolean;
  termsAcceptedAt?: string;
  googleFitConnected: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProfileSummary = {
  headline: string;
  status: string;
  nextActions: string[];
  riskFlags: string[];
};

export type NutritionRequirements = {
  bmr: number;
  tdee: number;
  targetCalories: number;
  macros: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  hydration: {
    water_ml: number;
    sodium_mg: number;
    potassium_mg: number;
  };
  micros: {
    fiber_g: number;
    calcium_mg: number;
    iron_mg: number;
    vitamin_c_mg: number;
    vitamin_d_iu: number;
    vitamin_b12_mcg: number;
    magnesium_mg: number;
    zinc_mg: number;
  };
};
