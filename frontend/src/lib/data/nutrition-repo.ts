import foodsData from "@/data/nutrition/foods.final.json";
import foodGuidesData from "@/data/nutrition/food-guides.json";
import requiredCommonFoods from "@/data/nutrition/common-foods.required.json";

export type FoodCategory =
  | "all"
  | "grains"
  | "protein"
  | "fruits"
  | "dairy"
  | "nuts"
  | "legumes"
  | "fats-oils"
  | "other";

export type FoodItem = {
  name: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium_mg: number;
  cholesterol_mg: number;
  nutrition_density: number;
  category: Exclude<FoodCategory, "all">;
  highlights: string[];
  source: string;
  source_file: string;
  verified: boolean;
  fdc_id: string | null;
  source_url: string | null;
  verified_at: string | null;
  data_quality_note: string | null;
  validation_flags: string[];
  diet_token: DietToken;
  is_common: boolean;
  common_tier: CommonTier;
  food_group: Exclude<FoodGroup, "all">;
};

export type DietToken = "veg" | "non-veg" | "egg";
export type CommonTier = "very-common" | "common" | "other";
export type VerifiedFilter = "all" | "verified" | "not-verified";
export type CommonFilter = "all" | "very-common" | "other";
export type FoodGroup =
  | "all"
  | "fruits"
  | "vegetables"
  | "grains"
  | "protein"
  | "dairy"
  | "nuts"
  | "legumes"
  | "fats-oils"
  | "other";

export type FoodGuide = {
  slug: string;
  importance: string;
  uses?: string[];
  benefits?: string[];
  pros?: string[];
  cons?: string[];
  bestFor: string[];
  portionTips: string[];
  cautions: string[];
  pairingIdeas: string[];
};

const commonTerms = (requiredCommonFoods as string[]).map((term) => term.toLowerCase().trim());

function inferDietToken(name: string): DietToken {
  const lower = name.toLowerCase();
  if (lower.includes("egg")) {
    return "egg";
  }

  if (
    lower.includes("chicken") ||
    lower.includes("fish") ||
    lower.includes("beef") ||
    lower.includes("mutton") ||
    lower.includes("pork") ||
    lower.includes("turkey") ||
    lower.includes("seafood")
  ) {
    return "non-veg";
  }

  return "veg";
}

function isCommonFoodName(name: string) {
  const lower = name.toLowerCase();
  return commonTerms.some((term) => lower.includes(term));
}

function getCommonTier(name: string): CommonTier {
  return isCommonFoodName(name) ? "very-common" : "other";
}

function inferFoodGroup(name: string, category: Exclude<FoodCategory, "all">): Exclude<FoodGroup, "all"> {
  if (category === "fruits") return "fruits";
  if (category === "grains") return "grains";
  if (category === "protein") return "protein";
  if (category === "dairy") return "dairy";
  if (category === "nuts") return "nuts";
  if (category === "legumes") return "legumes";
  if (category === "fats-oils") return "fats-oils";

  const lower = name.toLowerCase();
  const vegetableTerms = [
    "spinach",
    "tomato",
    "onion",
    "carrot",
    "potato",
    "cabbage",
    "broccoli",
    "cauliflower",
    "pepper",
    "okra",
    "peas",
  ];

  if (vegetableTerms.some((term) => lower.includes(term))) {
    return "vegetables";
  }

  return "other";
}

export function foodSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function getFoods() {
  const mappedFoods = (foodsData as Array<Record<string, unknown>>).map((food) => {
    const rawHighlights = food.highlights;
    const highlights = Array.isArray(rawHighlights)
      ? rawHighlights.map(String)
      : typeof rawHighlights === "string"
        ? [rawHighlights]
        : [];

    const rawFlags = food.validation_flags;
    const validationFlags = Array.isArray(rawFlags)
      ? rawFlags.map(String)
      : typeof rawFlags === "string"
        ? [rawFlags]
        : [];

    const category = String(food.category ?? "other") as Exclude<FoodCategory, "all">;

    return {
      name: String(food.name ?? ""),
      serving: String(food.serving ?? "100 g"),
      calories: Number(food.calories ?? 0),
      protein: Number(food.protein ?? 0),
      carbs: Number(food.carbs ?? 0),
      fat: Number(food.fat ?? 0),
      fiber: Number(food.fiber ?? 0),
      sugar: Number(food.sugar ?? 0),
      sodium_mg: Number(food.sodium_mg ?? 0),
      cholesterol_mg: Number(food.cholesterol_mg ?? 0),
      nutrition_density: Number(food.nutrition_density ?? 0),
      category,
      highlights,
      source: String(food.source ?? "Kaggle Nutrition Dataset"),
      source_file: String(food.source_file ?? ""),
      verified: Boolean(food.verified),
      fdc_id: food.fdc_id ? String(food.fdc_id) : null,
      source_url: food.source_url ? String(food.source_url) : null,
      verified_at: food.verified_at ? String(food.verified_at) : null,
      data_quality_note: food.data_quality_note ? String(food.data_quality_note) : null,
      validation_flags: validationFlags,
      diet_token: inferDietToken(String(food.name ?? "")),
      is_common: isCommonFoodName(String(food.name ?? "")),
      common_tier: getCommonTier(String(food.name ?? "")),
      food_group: inferFoodGroup(String(food.name ?? ""), category),
    } satisfies FoodItem;
  });

  return mappedFoods;
}

export function getFoodBySlug(slug: string) {
  return getFoods().find((food) => foodSlug(food.name) === slug);
}

export function getFoodGuideBySlug(slug: string) {
  return (foodGuidesData as FoodGuide[]).find((guide) => guide.slug === slug);
}

export function getFoodSlugs() {
  return getFoods().map((food) => foodSlug(food.name));
}

export function filterFoods(foods: FoodItem[], query: string, category: FoodCategory) {
  const normalized = query.trim().toLowerCase();

  return foods.filter((food) => {
    const matchesQuery =
      normalized.length === 0 ||
      food.name.toLowerCase().includes(normalized) ||
      food.highlights.join(" ").toLowerCase().includes(normalized);

    const matchesCategory = category === "all" || food.category === category;

    return matchesQuery && matchesCategory;
  });
}

export function filterFoodsAdvanced(
  foods: FoodItem[],
  filters: {
    query: string;
    category: FoodCategory;
    dietToken: "all" | DietToken;
    verified: VerifiedFilter;
    common: CommonFilter;
    foodGroup: FoodGroup;
  },
) {
  const normalized = filters.query.trim().toLowerCase();

  return foods.filter((food) => {
    const matchesQuery =
      normalized.length === 0 ||
      food.name.toLowerCase().includes(normalized) ||
      food.highlights.join(" ").toLowerCase().includes(normalized);

    const matchesCategory = filters.category === "all" || food.category === filters.category;
    const matchesDiet = filters.dietToken === "all" || food.diet_token === filters.dietToken;
    const matchesVerified =
      filters.verified === "all" ||
      (filters.verified === "verified" ? food.verified : !food.verified);
    const matchesCommon =
      filters.common === "all" ||
      (filters.common === "very-common" ? food.common_tier === "very-common" : food.common_tier !== "very-common");
    const matchesGroup = filters.foodGroup === "all" || food.food_group === filters.foodGroup;

    return (
      matchesQuery &&
      matchesCategory &&
      matchesDiet &&
      matchesVerified &&
      matchesCommon &&
      matchesGroup
    );
  });
}

export function isCommonFood(food: FoodItem) {
  return food.is_common;
}

export function isVeryCommonFood(food: FoodItem) {
  return food.common_tier === "very-common";
}
