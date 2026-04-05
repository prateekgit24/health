import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getFoodBySlug,
  getFoodGuideBySlug,
  getFoodSlugs,
  isVeryCommonFood,
} from "@/lib/data/nutrition-repo";

type FoodDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getFoodSlugs().map((slug) => ({ slug }));
}

export default async function FoodDetailPage({ params }: FoodDetailPageProps) {
  const { slug } = await params;
  const food = getFoodBySlug(slug);
  const guide = getFoodGuideBySlug(slug);

  if (!food) {
    notFound();
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

  const showExtended = isVeryCommonFood(food);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
      <Link href="/nutrition" className="text-sm text-emerald-200/80 transition hover:text-amber-200">
        Back to nutrition explorer
      </Link>

      <div className="mt-4 rounded-2xl border border-emerald-200/15 bg-emerald-950/25 p-6">
        <h1 className="text-4xl font-semibold tracking-tight text-emerald-50">{food.name}</h1>
        <p className="mt-2 text-emerald-100/80">Serving Basis: {food.serving}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-emerald-900/80 px-2.5 py-1 text-emerald-100">{food.diet_token}</span>
          <span className="rounded-full bg-amber-300/20 px-2.5 py-1 text-amber-100">
            {food.is_common ? "very common food" : "specialty food"}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 ${
              food.verified ? "bg-lime-300/20 text-lime-100" : "bg-rose-300/20 text-rose-100"
            }`}
          >
            {food.verified ? "USDA verified" : "verification pending"}
          </span>
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-emerald-200/15 bg-emerald-950/25 p-6">
        <h2 className="text-2xl font-semibold text-amber-200">Nutrition Stats</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm text-emerald-100/90">
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
        <section className="mt-6 rounded-2xl border border-lime-300/40 bg-lime-200/10 p-6">
          <h2 className="text-2xl font-semibold text-lime-100">Extended Nutrition Chart (Very Common Food)</h2>
          <p className="mt-2 text-sm text-emerald-100/85">
            This chart gives a quick profile view so common foods like apple, rice, milk, egg and similar staples are easy to compare.
          </p>
          <div className="mt-4 space-y-3">
            {extendedRows.map((row) => {
              const width = Math.min(100, (row.value / row.max) * 100);
              return (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-sm text-emerald-100/90">
                    <span>{row.label}</span>
                    <span>
                      {row.value} {row.unit}
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-emerald-950/50">
                    <div className="h-2 rounded-full bg-lime-300" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200/15 bg-emerald-950/25 p-5">
          <h3 className="text-xl font-semibold text-amber-200">Importance and Use</h3>
          <p className="mt-3 text-sm text-emerald-100/85">
            {guide?.importance ??
              "Use this food according to your calorie target and training load. Balance it with protein, fiber, and hydration for better outcomes."}
          </p>
          {guide?.uses?.length ? (
            <>
              <p className="mt-3 text-sm font-semibold text-amber-100">Uses</p>
              <ul className="mt-1 space-y-1 text-sm text-emerald-100/85">
                {guide.uses.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </>
          ) : null}
          {guide?.benefits?.length ? (
            <>
              <p className="mt-3 text-sm font-semibold text-amber-100">Benefits</p>
              <ul className="mt-1 space-y-1 text-sm text-emerald-100/85">
                {guide.benefits.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </>
          ) : null}
          {guide?.pros?.length ? (
            <>
              <p className="mt-3 text-sm font-semibold text-amber-100">Pros</p>
              <ul className="mt-1 space-y-1 text-sm text-emerald-100/85">
                {guide.pros.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </>
          ) : null}
          {guide?.cons?.length ? (
            <>
              <p className="mt-3 text-sm font-semibold text-amber-100">Cons</p>
              <ul className="mt-1 space-y-1 text-sm text-emerald-100/85">
                {guide.cons.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </>
          ) : null}
          {guide ? (
            <>
              <p className="mt-3 text-sm font-semibold text-amber-100">Best For</p>
              <ul className="mt-1 space-y-1 text-sm text-emerald-100/85">
                {guide.bestFor.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
              <p className="mt-3 text-sm font-semibold text-amber-100">Portion Tips</p>
              <ul className="mt-1 space-y-1 text-sm text-emerald-100/85">
                {guide.portionTips.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </>
          ) : null}
          <p className="mt-3 text-sm text-emerald-100/85">
            Highlights: {food.highlights.length > 0 ? food.highlights.join(", ") : "No highlights yet"}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200/15 bg-emerald-950/25 p-5">
          <h3 className="text-xl font-semibold text-amber-200">Verification and Source</h3>
          <p className="mt-3 text-sm text-emerald-100/85">Source: {food.source}</p>
          <p className="mt-1 text-sm text-emerald-100/85">
            Verified: {food.verified ? "Yes (USDA-backed)" : "No (pending USDA verification)"}
          </p>
          <p className="mt-1 text-sm text-emerald-100/85">FDC ID: {food.fdc_id ?? "Not mapped yet"}</p>
          <p className="mt-1 text-sm text-emerald-100/85">
            Source URL:{" "}
            {food.source_url ? (
              <a href={food.source_url} target="_blank" rel="noopener noreferrer" className="text-amber-200 underline">
                {food.source_url}
              </a>
            ) : (
              "Will be added during USDA enrichment"
            )}
          </p>
          <p className="mt-1 text-sm text-emerald-100/85">
            Verified At: {food.verified_at ?? "Pending"}
          </p>
          {food.data_quality_note ? (
            <p className="mt-1 text-sm text-emerald-100/85">Data Note: {food.data_quality_note}</p>
          ) : null}
        </div>
      </section>

      {guide ? (
        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-200/15 bg-emerald-950/25 p-5">
            <h3 className="text-xl font-semibold text-amber-200">Cautions</h3>
            <ul className="mt-3 space-y-1 text-sm text-emerald-100/85">
              {guide.cautions.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-emerald-200/15 bg-emerald-950/25 p-5">
            <h3 className="text-xl font-semibold text-amber-200">Pairing Ideas</h3>
            <ul className="mt-3 space-y-1 text-sm text-emerald-100/85">
              {guide.pairingIdeas.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </main>
  );
}
