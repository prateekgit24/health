import Link from "next/link";
import { notFound } from "next/navigation";
import { getActivityCategories, getActivityCategory } from "@/lib/data/activity-catalog";

type CategoryPageProps = {
  params: Promise<{ category: string }>;
};

export function generateStaticParams() {
  return getActivityCategories().map((category) => ({
    category: category.slug,
  }));
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const selectedCategory = getActivityCategory(category);

  if (!selectedCategory) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <Link href="/activities" className="text-sm text-primary-200/80 transition hover:text-secondary-200">
        Back to all activity sections
      </Link>

      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-primary-50">
        {selectedCategory.name}
      </h1>
      <p className="mt-3 max-w-3xl text-primary-100/80">{selectedCategory.description}</p>

      <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {selectedCategory.subcategories.map((item) => (
          <Link
            key={item.slug}
            href={`/activities/${selectedCategory.slug}/${item.slug}`}
            className="rounded-2xl border border-primary-200/15 bg-[linear-gradient(170deg,rgba(18,67,62,0.45),rgba(5,20,20,0.2))] p-5 transition hover:-translate-y-0.5 hover:border-secondary-300/70"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-2xl font-semibold text-secondary-200">{item.name}</h2>
              <span className="rounded-full bg-primary-900/90 px-3 py-1 text-xs uppercase tracking-wide text-primary-200">
                {item.intensity}
              </span>
            </div>
            <p className="mt-2 text-sm text-primary-100/80">{item.teaser}</p>
            <p className="mt-3 text-xs text-primary-200/75">
              Focus: {item.focusAreas.slice(0, 2).join(", ")}...
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}
