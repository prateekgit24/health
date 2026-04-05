import exercisesCategory from "@/data/activities/activities.exercises.json";
import yogaCategory from "@/data/activities/activities.yoga.json";
import gymCategory from "@/data/activities/activities.gym-activities.json";
import athleticsCategory from "@/data/activities/activities.athletics.json";
import gamesCategory from "@/data/activities/activities.games.json";
import sportsCategory from "@/data/activities/activities.sports.json";
import fightingSportsCategory from "@/data/activities/activities.fighting-sports.json";
import athleticsRecords from "@/data/activities/athletics.records.json";

export type ActivityCategorySlug =
  | "exercises"
  | "yoga"
  | "gym-activities"
  | "athletics"
  | "games"
  | "sports"
  | "fighting-sports";

export type ActivitySubcategory = {
  slug: string;
  name: string;
  teaser: string;
  intensity: "low" | "moderate" | "high";
  focusAreas: string[];
  muscleChanges: string[];
  physicalQualities: string[];
  benefits: string[];
  techniqueRules: string[];
  starterPlan: string[];
  nutritionFocus: string[];
  performanceTableKey?: string;
  performanceTable?: {
    note: string;
    columns: string[];
    rows: Array<{
      distance: string;
      sex: "Male" | "Female";
      values: string[];
    }>;
  };
};

export type ActivityCategory = {
  slug: ActivityCategorySlug;
  name: string;
  description: string;
  quickData: string;
  subcategories: ActivitySubcategory[];
};

type RecordsMap = Record<
  string,
  {
    note: string;
    columns: string[];
    rows: Array<{
      distance: string;
      sex: "Male" | "Female";
      values: string[];
    }>;
  }
>;

function withPerformanceTables(category: ActivityCategory, recordsMap: RecordsMap): ActivityCategory {
  return {
    ...category,
    subcategories: category.subcategories.map((subcategory) => {
      if (!subcategory.performanceTableKey) {
        return subcategory;
      }

      return {
        ...subcategory,
        performanceTable: recordsMap[subcategory.performanceTableKey],
      };
    }),
  };
}

const categoryShards = [
  exercisesCategory,
  yogaCategory,
  gymCategory,
  withPerformanceTables(athleticsCategory as ActivityCategory, athleticsRecords as RecordsMap),
  gamesCategory,
  sportsCategory,
  fightingSportsCategory,
];

export const activityCatalog: ActivityCategory[] = categoryShards as ActivityCategory[];

export function getActivityCategories() {
  return activityCatalog;
}

export function getActivityCategory(categorySlug: string) {
  return activityCatalog.find((category) => category.slug === categorySlug);
}

export function getActivitySubcategory(categorySlug: string, subcategorySlug: string) {
  const category = getActivityCategory(categorySlug);
  if (!category) return undefined;
  return category.subcategories.find((item) => item.slug === subcategorySlug);
}
