import Link from "next/link";

const tools = [
  {
    href: "/calculators/bmi",
    name: "BMI",
    line: "Body mass index from weight and height",
    icon: "📏",
    color: "from-primary-500 to-primary-600",
  },
  {
    href: "/calculators/bmr",
    name: "BMR",
    line: "Basal metabolic rate by Mifflin-St Jeor",
    icon: "🔥",
    color: "from-secondary-500 to-secondary-600",
  },
  {
    href: "/calculators/tdee",
    name: "TDEE",
    line: "Daily energy needs from activity level",
    icon: "⚡",
    color: "from-alert-500 to-alert-600",
  },
  {
    href: "/calculators/body-fat",
    name: "Body Fat",
    line: "US Navy body fat percentage estimate",
    icon: "💪",
    color: "from-primary-600 to-primary-700",
  },
  {
    href: "/calculators/daily-requirements",
    name: "Daily Requirements",
    line: "Calories, macros, hydration, and key micronutrients",
    icon: "🎯",
    color: "from-secondary-600 to-secondary-700",
  },
  {
    href: "/calculators/my-plate",
    name: "Calculate My Plate",
    line: "Autocomplete your meals and compare nutrient totals with TDEE",
    icon: "🍽️",
    color: "from-primary-500 to-primary-700",
  },
];

export default function CalculatorsPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gradient-to-b dark:from-[#000a07] dark:via-[#020f0b] dark:to-[#010b08]">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Header Section */}
        <div className="mb-12">
          <div className="inline-block mb-4">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-300 bg-primary-100/60 dark:bg-primary-950/60 px-4 py-2 rounded-full">
              Health Tools
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
            Health Calculators
          </h1>
          <p className="max-w-2xl text-lg text-slate-600 dark:text-primary-100/80">
            Practical tools to estimate body and energy metrics. Use these as guidance, not diagnosis. Get personalized insights to support your fitness journey.
          </p>
        </div>

        {/* Calculator Tools Grid */}
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link
              href={tool.href}
              key={tool.href}
              className="group rounded-2xl border border-primary-200/40 dark:border-primary-300/20 bg-white dark:bg-primary-950/30 p-6 shadow-md hover:shadow-lg dark:shadow-lg dark:shadow-primary-950/20 transition-all duration-200 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-4xl">{tool.icon}</div>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors">
                {tool.name}
              </h2>
              <p className="text-sm text-slate-600 dark:text-primary-100/80 leading-relaxed mb-4">
                {tool.line}
              </p>
              <div className="flex items-center text-sm font-semibold text-primary-600 dark:text-primary-300 group-hover:translate-x-1 transition-transform">
                Use Calculator →
              </div>
            </Link>
          ))}
        </section>

        {/* Info Section */}
        <section className="mt-16 rounded-2xl border border-primary-200/40 dark:border-primary-300/20 bg-gradient-to-br from-primary-50/60 to-white dark:from-primary-950/40 dark:to-primary-900/20 p-8 md:p-12">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Why Calculate?
          </h3>
          <p className="text-slate-600 dark:text-primary-100/80 mb-6 leading-relaxed">
            Understanding your personal metrics is the foundation of health and fitness success. These calculators use scientifically-backed formulas (Mifflin-St Jeor for BMR, US Navy method for body fat) to give you baseline targets.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-3">
                Build Your Profile
              </h4>
              <p className="text-sm text-slate-600 dark:text-primary-100/80">
                Use these calculations to populate your HOW profile with accurate personal data. Your profile then powers all personalized recommendations across the platform.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-3">
                Track Progress
              </h4>
              <p className="text-sm text-slate-600 dark:text-primary-100/80">
                Recalculate periodically as your body changes. Monitor how your calculations shift as you progress toward your fitness goals.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
