"use client";

import Link from "next/link";
import { memo, useCallback, useDeferredValue, useMemo, useState } from "react";
import {
  filterFoodsAdvanced,
  foodSlug,
  getFoods,
  isVeryCommonFood,
  type FoodItem,
  type CommonFilter,
  type FoodCategory,
  type VerifiedFilter,
} from "@/lib/data/nutrition-repo";

const categories: FoodCategory[] = [
  "all",
  "grains",
  "protein",
  "fruits",
  "dairy",
  "nuts",
  "legumes",
  "fats-oils",
  "other",
];

const verifiedFilters: VerifiedFilter[] = ["all", "verified", "not-verified"];
const commonFilters: CommonFilter[] = ["all", "very-common", "other"];
const INITIAL_VISIBLE = 24;
const LOAD_MORE_STEP = 24;
const foods = getFoods();
const foodsByName = new Map(foods.map((food) => [food.name, food]));

type FoodCardProps = {
  food: FoodItem;
  isSelected: boolean;
  canSelectMore: boolean;
  onToggle: (name: string) => void;
};

const FoodCard = memo(function FoodCard({ food, isSelected, canSelectMore, onToggle }: FoodCardProps) {
  return (
    <article
      className={`app-surface rounded-2xl p-5 ${
        food.verified && isVeryCommonFood(food)
          ? "border-primary-300/70 bg-[linear-gradient(150deg,rgba(16,185,129,0.28),rgba(8,30,21,0.72))]"
          : ""
      }`}
    >
      <Link href={`/nutrition/${foodSlug(food.name)}`} className="block">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-2xl font-semibold text-primary-100">{food.name}</h2>
          <p className="text-sm text-slate-300">{food.serving}</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-primary-500/25 px-2.5 py-1 text-xs font-semibold text-primary-100">{food.diet_token}</span>
          {food.is_common ? (
            <span className="rounded-full bg-teal-500/25 px-2.5 py-1 text-xs font-semibold text-teal-100">
              very common
            </span>
          ) : null}
          {food.verified ? (
            <span className="rounded-full bg-success-500/25 px-2.5 py-1 text-xs font-semibold text-success-100">
              USDA verified
            </span>
          ) : (
            <span className="rounded-full bg-alert-500/25 px-2.5 py-1 text-xs font-semibold text-alert-100">
              pending verification
            </span>
          )}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-200">
          <p>Calories: {food.calories} kcal</p>
          <p>Protein: {food.protein} g</p>
          <p>Carbs: {food.carbs} g</p>
          <p>Fat: {food.fat} g</p>
          <p>Fiber: {food.fiber} g</p>
          <p>Sugar: {food.sugar} g</p>
        </div>
        {food.search_aliases.length > 0 ? (
          <p className="mt-3 text-xs text-emerald-100/90">Also searched as: {food.search_aliases.join(", ")}</p>
        ) : null}
        {food.note ? (
          <p className="mt-2 text-xs text-amber-100/90">Note: {food.note}</p>
        ) : null}
        <p className="mt-4 text-sm text-slate-200">Highlights: {food.highlights.join(", ")}</p>
        <p className="mt-2 text-xs text-slate-400">Source: {food.source}</p>
        <p className="mt-1 text-xs text-slate-400">
          Verified: {food.verified ? "Yes" : "No"}
          {food.source_file ? ` | File: ${food.source_file}` : ""}
        </p>
      </Link>

      <button
        type="button"
        onClick={() => onToggle(food.name)}
        disabled={!isSelected && !canSelectMore}
        className={`mt-4 rounded-full px-4 py-1.5 text-xs font-semibold ${
          isSelected
            ? "bg-[linear-gradient(95deg,#34d399,#4ade80)] text-slate-950"
            : "app-pill text-primary-50 hover:border-primary-200/45 hover:text-white"
        } disabled:cursor-not-allowed disabled:opacity-45`}
      >
        {isSelected ? "Remove from compare" : "Add to compare"}
      </button>
    </article>
  );
});

export default function NutritionPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FoodCategory>("all");
  const [dietToken, setDietToken] = useState<"all" | "veg" | "non-veg" | "egg">("all");
  const [verified, setVerified] = useState<VerifiedFilter>("all");
  const [common, setCommon] = useState<CommonFilter>("all");
  const [compareNames, setCompareNames] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const deferredQuery = useDeferredValue(query);

  const onQueryChange = useCallback((value: string) => {
    setQuery(value);
    setVisibleCount(INITIAL_VISIBLE);
  }, []);

  const onCategoryChange = useCallback((value: FoodCategory) => {
    setCategory(value);
    setVisibleCount(INITIAL_VISIBLE);
  }, []);

  const onDietTokenChange = useCallback((value: "all" | "veg" | "non-veg" | "egg") => {
    setDietToken(value);
    setVisibleCount(INITIAL_VISIBLE);
  }, []);

  const onVerifiedChange = useCallback((value: VerifiedFilter) => {
    setVerified(value);
    setVisibleCount(INITIAL_VISIBLE);
  }, []);

  const onCommonChange = useCallback((value: CommonFilter) => {
    setCommon(value);
    setVisibleCount(INITIAL_VISIBLE);
  }, []);

  const filteredFoods = useMemo(() => {
    return filterFoodsAdvanced(foods, {
      query: deferredQuery,
      category,
      dietToken,
      verified,
      common,
      foodGroup: "all",
    });
  }, [deferredQuery, category, dietToken, verified, common]);

  const visibleFoods = useMemo(
    () => filteredFoods.slice(0, visibleCount),
    [filteredFoods, visibleCount],
  );

  const compareSet = useMemo(() => new Set(compareNames), [compareNames]);
  const canSelectMore = compareNames.length < 5;

  const compareFoods = useMemo(() => {
    return compareNames
      .map((name) => foodsByName.get(name))
      .filter((food): food is FoodItem => Boolean(food));
  }, [compareNames]);

  const toggleCompare = useCallback((foodName: string) => {
    setCompareNames((prev) => {
      if (prev.includes(foodName)) {
        return prev.filter((item) => item !== foodName);
      }

      if (prev.length >= 5) {
        return prev;
      }

      return [...prev, foodName];
    });
  }, []);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-semibold tracking-tight text-white">Nutrition Explorer</h1>
      <p className="mt-3 max-w-2xl text-slate-200">
        Explore foods by category, dietary preference, verification state, and common-food priority.
      </p>

      <section className="app-surface mt-6 grid gap-3 rounded-2xl p-4 md:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm font-semibold text-primary-100">
          Search
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search by food name or nutrient highlight"
            className="mt-1 w-full rounded-lg border border-primary-200/30 bg-[#07241a]/90 px-3 py-2 text-sm text-primary-50 placeholder:text-slate-400"
          />
        </label>
        <label className="text-sm font-semibold text-primary-100">
          Category
          <select
            value={category}
            onChange={(event) => onCategoryChange(event.target.value as FoodCategory)}
            className="mt-1 w-full rounded-lg border border-primary-200/30 bg-[#07241a]/90 px-3 py-2 text-sm text-primary-50"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item[0].toUpperCase() + item.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-primary-100">
          Diet Type
          <select
            value={dietToken}
            onChange={(event) => onDietTokenChange(event.target.value as "all" | "veg" | "non-veg" | "egg")}
            className="mt-1 w-full rounded-lg border border-primary-200/30 bg-[#07241a]/90 px-3 py-2 text-sm text-primary-50"
          >
            <option value="all">All diet types</option>
            <option value="veg">Veg</option>
            <option value="egg">Egg</option>
            <option value="non-veg">Non-veg</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-primary-100">
          Verification
          <select
            value={verified}
            onChange={(event) => onVerifiedChange(event.target.value as VerifiedFilter)}
            className="mt-1 w-full rounded-lg border border-primary-200/30 bg-[#07241a]/90 px-3 py-2 text-sm text-primary-50"
          >
            {verifiedFilters.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-primary-100">
          Common Foods Priority
          <select
            value={common}
            onChange={(event) => onCommonChange(event.target.value as CommonFilter)}
            className="mt-1 w-full rounded-lg border border-primary-200/30 bg-[#07241a]/90 px-3 py-2 text-sm text-primary-50"
          >
            {commonFilters.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="app-surface mt-6 rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-primary-100">Compare Foods (up to 5)</h2>
          <button
            type="button"
            onClick={() => setCompareNames([])}
            className="app-pill rounded-full px-4 py-1.5 text-xs font-semibold text-primary-50 hover:border-primary-200/45 hover:text-white"
          >
            Clear compare
          </button>
        </div>
        {compareFoods.length === 0 ? (
          <p className="mt-3 text-sm text-slate-200">Add food items from cards below to compare nutrition stats side by side.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm text-slate-100">
              <thead>
                <tr>
                  <th className="border-b border-primary-200/20 px-2 py-2 text-left">Metric</th>
                  {compareFoods.map((food) => (
                    <th key={food.name} className="border-b border-primary-200/20 px-2 py-2 text-left text-primary-100">
                      {food.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border-b border-primary-200/15 px-2 py-2">Calories (kcal)</td>
                  {compareFoods.map((food) => <td key={`cal-${food.name}`} className="border-b border-primary-200/15 px-2 py-2">{food.calories}</td>)}
                </tr>
                <tr>
                  <td className="border-b border-primary-200/15 px-2 py-2">Protein (g)</td>
                  {compareFoods.map((food) => <td key={`pro-${food.name}`} className="border-b border-primary-200/15 px-2 py-2">{food.protein}</td>)}
                </tr>
                <tr>
                  <td className="border-b border-primary-200/15 px-2 py-2">Carbs (g)</td>
                  {compareFoods.map((food) => <td key={`carb-${food.name}`} className="border-b border-primary-200/15 px-2 py-2">{food.carbs}</td>)}
                </tr>
                <tr>
                  <td className="border-b border-primary-200/15 px-2 py-2">Fat (g)</td>
                  {compareFoods.map((food) => <td key={`fat-${food.name}`} className="border-b border-primary-200/15 px-2 py-2">{food.fat}</td>)}
                </tr>
                <tr>
                  <td className="border-b border-primary-200/15 px-2 py-2">Fiber (g)</td>
                  {compareFoods.map((food) => <td key={`fib-${food.name}`} className="border-b border-primary-200/15 px-2 py-2">{food.fiber}</td>)}
                </tr>
                <tr>
                  <td className="border-b border-primary-200/15 px-2 py-2">Sugar (g)</td>
                  {compareFoods.map((food) => <td key={`sug-${food.name}`} className="border-b border-primary-200/15 px-2 py-2">{food.sugar}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="mt-6 flex items-center justify-between text-sm text-slate-300">
        <p>
          Showing {Math.min(visibleFoods.length, filteredFoods.length)} of {filteredFoods.length} foods
        </p>
        {filteredFoods.length > visibleCount ? (
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + LOAD_MORE_STEP)}
            className="rounded-full bg-[linear-gradient(95deg,#34d399,#4ade80)] px-4 py-2 text-xs font-semibold text-slate-950 hover:brightness-110"
          >
            Load more foods
          </button>
        ) : null}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {visibleFoods.map((food) => (
          <FoodCard
            key={food.name}
            food={food}
            isSelected={compareSet.has(food.name)}
            canSelectMore={canSelectMore || compareSet.has(food.name)}
            onToggle={toggleCompare}
          />
        ))}
      </div>

      {filteredFoods.length === 0 ? (
        <p className="mt-6 rounded-xl border border-primary-300/35 bg-primary-500/15 p-4 text-sm text-primary-100">
          No foods matched your filters. Try a broader query or change category.
        </p>
      ) : null}
    </main>
  );
}
