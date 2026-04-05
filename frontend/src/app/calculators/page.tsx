import Link from "next/link";

const tools = [
  {
    href: "/calculators/bmi",
    name: "BMI",
    line: "Body mass index from weight and height",
  },
  {
    href: "/calculators/bmr",
    name: "BMR",
    line: "Basal metabolic rate by Mifflin-St Jeor",
  },
  {
    href: "/calculators/tdee",
    name: "TDEE",
    line: "Daily energy needs from activity level",
  },
  {
    href: "/calculators/body-fat",
    name: "Body Fat",
    line: "US Navy body fat percentage estimate",
  },
  {
    href: "/calculators/daily-requirements",
    name: "Daily Requirements",
    line: "Calories, macros, hydration, and key micronutrients",
  },
];

export default function CalculatorsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-semibold tracking-tight text-emerald-50">Calculators</h1>
      <p className="mt-3 max-w-2xl text-emerald-100/80">
        Practical tools to estimate body and energy metrics. Use these as guidance, not diagnosis.
      </p>
      <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link
            href={tool.href}
            key={tool.href}
            className="rounded-2xl border border-emerald-200/20 bg-emerald-950/30 p-5 transition hover:-translate-y-0.5 hover:border-amber-300/60"
          >
            <h2 className="text-xl font-semibold text-amber-200">{tool.name}</h2>
            <p className="mt-2 text-sm text-emerald-100/80">{tool.line}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
