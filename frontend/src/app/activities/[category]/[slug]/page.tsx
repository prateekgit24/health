import Link from "next/link";
import { notFound } from "next/navigation";
import { BenchmarkCompare } from "@/components/athletics/benchmark-compare";
import {
  getActivityCategories,
  getActivityCategory,
  getActivitySubcategory,
} from "@/lib/data/activity-catalog";

type DetailPageProps = {
  params: Promise<{ category: string; slug: string }>;
};

export function generateStaticParams() {
  return getActivityCategories().flatMap((category) =>
    category.subcategories.map((subcategory) => ({
      category: category.slug,
      slug: subcategory.slug,
    })),
  );
}

export default async function ActivityDetailPage({ params }: DetailPageProps) {
  const { category, slug } = await params;
  const selectedCategory = getActivityCategory(category);
  const item = getActivitySubcategory(category, slug);

  if (!selectedCategory || !item) {
    notFound();
  }

  const siblingItems = selectedCategory.subcategories.filter((subcategory) => subcategory.slug !== item.slug);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <Link
        href={`/activities/${selectedCategory.slug}`}
        className="text-sm text-emerald-200/80 transition hover:text-amber-200"
      >
        Back to {selectedCategory.name}
      </Link>

      <div className="mt-4 rounded-2xl border border-emerald-200/15 bg-emerald-950/25 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-4xl font-semibold text-emerald-50">{item.name}</h1>
          <span className="rounded-full bg-emerald-900/90 px-3 py-1 text-xs uppercase tracking-wide text-emerald-200">
            {item.intensity}
          </span>
        </div>
        <p className="mt-3 text-emerald-100/80">{item.teaser}</p>
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200/15 bg-emerald-950/25 p-5">
          <h2 className="text-xl font-semibold text-amber-200">General Benefits</h2>
          <ul className="mt-3 space-y-2 text-sm text-emerald-100/85">
            {item.benefits.map((benefit) => (
              <li key={benefit}>- {benefit}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-emerald-200/15 bg-emerald-950/25 p-5">
          <h2 className="text-xl font-semibold text-amber-200">What It Affects</h2>
          <p className="mt-3 text-sm text-emerald-100/85">Focus Areas: {item.focusAreas.join(", ")}</p>
          <p className="mt-2 text-sm text-emerald-100/85">
            Muscle Changes: {item.muscleChanges.join(", ")}
          </p>
          <p className="mt-2 text-sm text-emerald-100/85">
            Physical Qualities: {item.physicalQualities.join(", ")}
          </p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200/15 bg-emerald-950/25 p-5">
          <h2 className="text-xl font-semibold text-amber-200">Rules and Technique</h2>
          <ul className="mt-3 space-y-2 text-sm text-emerald-100/85">
            {item.techniqueRules.map((rule) => (
              <li key={rule}>- {rule}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-emerald-200/15 bg-emerald-950/25 p-5">
          <h2 className="text-xl font-semibold text-amber-200">Starter Plan</h2>
          <ul className="mt-3 space-y-2 text-sm text-emerald-100/85">
            {item.starterPlan.map((planLine) => (
              <li key={planLine}>- {planLine}</li>
            ))}
          </ul>
          <h3 className="mt-5 text-lg font-semibold text-amber-100">Nutrition Focus</h3>
          <ul className="mt-2 space-y-2 text-sm text-emerald-100/85">
            {item.nutritionFocus.map((entry) => (
              <li key={entry}>- {entry}</li>
            ))}
          </ul>
        </div>
      </section>

      {item.performanceTable ? (
        <section className="mt-6 rounded-2xl border border-emerald-200/15 bg-emerald-950/25 p-5">
          <h2 className="text-xl font-semibold text-amber-200">Performance Benchmarks</h2>
          <p className="mt-2 text-sm text-emerald-100/80">{item.performanceTable.note}</p>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b border-emerald-200/20 px-3 py-2 text-left text-emerald-200">Distance</th>
                  <th className="border-b border-emerald-200/20 px-3 py-2 text-left text-emerald-200">Sex</th>
                  {item.performanceTable.columns.map((column) => (
                    <th key={column} className="border-b border-emerald-200/20 px-3 py-2 text-left text-emerald-200">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {item.performanceTable.rows.map((row) => (
                  <tr key={`${row.distance}-${row.sex}`}>
                    <td className="border-b border-emerald-200/10 px-3 py-2 text-emerald-100/85">{row.distance}</td>
                    <td className="border-b border-emerald-200/10 px-3 py-2 text-emerald-100/85">{row.sex}</td>
                    {row.values.map((value, index) => (
                      <td key={`${row.distance}-${row.sex}-${index}`} className="border-b border-emerald-200/10 px-3 py-2 text-emerald-100/85">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <BenchmarkCompare table={item.performanceTable} />
        </section>
      ) : null}

      {siblingItems.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-emerald-50">Explore Other {selectedCategory.name}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {siblingItems.map((subItem) => (
              <Link
                key={subItem.slug}
                href={`/activities/${selectedCategory.slug}/${subItem.slug}`}
                className="rounded-2xl border border-emerald-200/15 bg-emerald-950/25 p-5 transition hover:-translate-y-0.5 hover:border-amber-300/70"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xl font-semibold text-amber-200">{subItem.name}</h3>
                  <span className="rounded-full bg-emerald-900/90 px-3 py-1 text-xs uppercase tracking-wide text-emerald-200">
                    {subItem.intensity}
                  </span>
                </div>
                <p className="mt-2 text-sm text-emerald-100/80">{subItem.teaser}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
