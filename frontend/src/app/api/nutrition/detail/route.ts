import { NextRequest, NextResponse } from "next/server";
import { getFoodBySlug, getFoodGuideBySlug, isVeryCommonFood } from "@/lib/data/nutrition-repo";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Slug required" }, { status: 400 });
  }

  const food = getFoodBySlug(slug);
  if (!food) {
    return NextResponse.json({ error: "Food not found" }, { status: 404 });
  }

  const guide = getFoodGuideBySlug(slug);
  const isVeryCommon = isVeryCommonFood(food);

  return NextResponse.json({ 
    food, 
    guide, 
    isVeryCommon 
  });
}
