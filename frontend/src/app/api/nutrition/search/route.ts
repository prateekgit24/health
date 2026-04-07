import { NextRequest, NextResponse } from "next/server";
import { getFoods } from "@/lib/data/nutrition-repo";

function getMatchPriority(food: ReturnType<typeof getFoods>[number], normalized: string) {
  const name = food.name.toLowerCase();
  const aliasText = food.search_aliases.join(" ").toLowerCase();
  const noteText = (food.note ?? "").toLowerCase();
  const highlightText = food.highlights.join(" ").toLowerCase();

  if (name.startsWith(normalized)) return 0;
  if (name.includes(normalized)) return 1;
  if (aliasText.startsWith(normalized)) return 2;
  if (aliasText.includes(normalized)) return 3;
  if (highlightText.includes(normalized)) return 4;
  if (noteText.includes(normalized)) return 5;
  return Number.POSITIVE_INFINITY;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ foods: [] });
  }

  const normalized = query.trim().toLowerCase();
  const allFoods = getFoods();

  const matched = allFoods
    .map((food) => ({ food, priority: getMatchPriority(food, normalized) }))
    .filter((item) => Number.isFinite(item.priority));

  const sortedMatches = matched
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }

      return a.food.name.length - b.food.name.length;
    })
    .slice(0, 15)
    .map((item) => item.food);

  const results = sortedMatches.map((f) => ({
    name: f.name,
    calories: f.calories,
    protein: f.protein,
    carbs: f.carbs,
    fat: f.fat,
    serving: f.serving,
    search_aliases: f.search_aliases,
    note: f.note,
  }));

  return NextResponse.json({ foods: results });
}