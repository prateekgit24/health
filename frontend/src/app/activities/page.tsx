import Image from "next/image";
import Link from "next/link";
import { getActivityCategories } from "@/lib/data/activity-catalog";

const categoryImages: Record<string, string> = {
  exercises: "/images/categories/exercises.svg",
  yoga: "/images/categories/yoga.svg",
  "gym-activities": "/images/categories/gym-activities.svg",
  athletics: "/images/categories/athletics.svg",
  games: "/images/categories/games.svg",
  sports: "/images/categories/sports.svg",
  "fighting-sports": "/images/categories/fighting-sports.svg",
};

export default function ActivitiesPage() {
  const categories = getActivityCategories();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-semibold tracking-tight text-emerald-50">Physical Activities</h1>
      <p className="mt-3 max-w-3xl text-emerald-100/80">
        Choose a section to explore. Each section opens subcategory cards with examples, then full
        pages including benefits, affected muscles, technique rules, planning, and nutrition focus.
      </p>

      <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/activities/${category.slug}`}
            className="overflow-hidden rounded-2xl border border-emerald-200/15 bg-emerald-950/25 p-0 transition hover:-translate-y-0.5 hover:border-amber-300/70"
          >
            <div className="relative h-36 w-full">
              <Image
                src={categoryImages[category.slug] ?? "/images/categories/athletics.svg"}
                alt={`${category.name} illustration`}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-5">
              <h2 className="text-2xl font-semibold text-amber-200">{category.name}</h2>
              <p className="mt-2 text-sm text-emerald-100/80">{category.description}</p>
              <p className="mt-3 text-xs uppercase tracking-wide text-emerald-200/75">
                {category.quickData}
              </p>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
