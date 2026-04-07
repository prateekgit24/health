"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function ClientFoodPage({ slug }: { slug: string }) {
  const [food, setFood] = useState<any>(null);
  const [guide, setGuide] = useState<any>(null);
  const [showExtended, setShowExtended] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/nutrition/detail?slug=${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setFood(data.food);
        setGuide(data.guide);
        setShowExtended(data.isVeryCommon);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return <div className="p-12 text-center text-primary-100">Loading nutrition data...</div>;
  }

  if (!food) {
    return <div className="p-12 text-center text-alert-300">Food not found.</div>;
  }

  const extendedRows = [
    { label: "Protein", value: food.protein, max: 60, unit: "g" },
    { label: "Carbs", value: food.carbs, max: 100, unit: "g" },
    { label: "Fat", value: food.fat, max: 50, unit: "g" },
    { label: "Fiber", value: food.fiber, max: 30, unit: "g" },
    { label: "Sugar", value: food.sugar, max: 50, unit: "g" },
    { label: "Sodium", value: food.sodium_mg, max: 2300, unit: "mg" },
    { label: "Cholesterol", value: food.cholesterol_mg, max: 300, unit: "mg" },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
      <div className="flex items-center justify-between">
        <Link href="/nutrition" className="text-sm text-primary-200/80 transition hover:text-secondary-200">
          ← Back to nutrition explorer
        </Link>

        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-primary-900/80 px-2.5 py-1 text-primary-100">{food.diet_token}</span>
          <span className="rounded-full bg-secondary-300/20 px-2.5 py-1 text-secondary-100">
            {food.is_common ? "very common food" : "specialty food"}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 ${
              food.verified ? "bg-success-300/20 text-success-100" : "bg-alert-300/20 text-alert-100"
            }`}
          >
            {food.verified ? "USDA verified" : "verification pending"}
          </span>
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-primary-200/15 bg-primary-950/25 p-6">
        <h2 className="text-2xl font-semibold text-secondary-200">Nutrition Stats</h2>
        {Array.isArray(food.search_aliases) && food.search_aliases.length > 0 ? (
          <p className="mt-3 text-sm text-emerald-100/90">Also searched as: {food.search_aliases.join(", ")}</p>
        ) : null}
        {food.note ? (
          <p className="mt-2 text-sm text-amber-100/90">Note: {food.note}</p>
        ) : null}
        <div className="mt-4 grid gap-3 text-sm text-primary-100/90 sm:grid-cols-2 lg:grid-cols-3">
          <p>Calories: {food.calories} kcal</p>
          <p>Protein: {food.protein} g</p>
          <p>Carbohydrates: {food.carbs} g</p>
          <p>Fat: {food.fat} g</p>
          <p>Fiber: {food.fiber} g</p>
          <p>Sugar: {food.sugar} g</p>
          <p>Sodium: {food.sodium_mg} mg</p>
          <p>Cholesterol: {food.cholesterol_mg} mg</p>
          <p>Nutrition Density: {food.nutrition_density}</p>
        </div>
      </section>

      {showExtended ? (
        <section className="mt-6 rounded-2xl border border-success-300/40 bg-success-200/10 p-6">
          <h2 className="text-2xl font-semibold text-success-100">Extended Nutrition Chart (Very Common Food)</h2>
          <p className="mt-2 text-sm text-primary-100/85">
            This chart gives a quick profile view so common foods like apple, rice, milk, egg and similar staples are easy to compare.
          </p>
          <div className="mt-4 space-y-3">
            {extendedRows.map((row) => {
              const width = Math.min(100, (row.value / row.max) * 100);
              return (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-sm text-primary-100/90">
                    <span>{row.label}</span>
                    <span>
                      {row.value} {row.unit}
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-primary-950/50">
                    <div className="h-2 rounded-full bg-success-300" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-primary-200/15 bg-primary-950/25 p-5">
          <h3 className="text-xl font-semibold text-secondary-200">Importance and Use</h3>
          <p className="mt-3 text-sm text-primary-100/85">
            {guide?.importance ??
              "Use this food according to your calorie target and training load. Balance it with protein, fiber, and hydration for better outcomes."}
          </p>
          {guide?.uses?.length ? (
             <>
               <p className="mt-3 text-sm font-semibold text-secondary-100">Uses</p>
               <ul className="mt-1 space-y-1 text-sm text-primary-100/85">
                 {guide.uses.map((item: string) => <li key={item}>- {item}</li>)}
               </ul>
             </>
           ) : null}
           {guide?.benefits?.length ? (
             <>
               <p className="mt-3 text-sm font-semibold text-secondary-100">Benefits</p>
               <ul className="mt-1 space-y-1 text-sm text-primary-100/85">
                 {guide.benefits.map((item: string) => <li key={item}>- {item}</li>)}
               </ul>
             </>
           ) : null}
         </div>
      </section>
    </main>
  );
}