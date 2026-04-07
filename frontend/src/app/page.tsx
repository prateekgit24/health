import Link from "next/link";

const featureCards = [
  {
    title: "Profile-Driven Targets",
    description: "Get personalized calorie, macro, hydration, and goal guidance that adapts to your body profile and activity behavior.",
    href: "/profile",
    icon: "👤",
    accentColor: "from-primary-500 to-primary-600",
  },
  {
    title: "Smart Nutrition Explorer",
    description: "Compare foods in seconds, inspect macros, and make better meal choices with practical context.",
    href: "/nutrition",
    icon: "🥗",
    accentColor: "from-secondary-500 to-secondary-600",
  },
  {
    title: "Training and Activity Insights",
    description: "Understand workouts, sports, and daily movement with useful intensity and benefit information.",
    href: "/activities",
    icon: "💪",
    accentColor: "from-alert-500 to-alert-600",
  },
  {
    title: "Fitness Calculators",
    description: "Use BMI, BMR, TDEE, and daily requirement calculators to make informed health decisions.",
    href: "/calculators",
    icon: "🧮",
    accentColor: "from-primary-600 to-primary-700",
  },
];

const siteBenefits = [
  "One place for profile, nutrition, movement, and planning",
  "Privacy-aware friend comparison and progress context",
  "Actionable numbers instead of generic motivation",
  "Simple workflows for beginners and consistency seekers",
];

const quickStats = [
  { label: "Daily Metrics", value: "15+", icon: "📊" },
  { label: "Nutrition Data", value: "100+ foods", icon: "🍽️" },
  { label: "Activity Catalog", value: "30+", icon: "🏃" },
  { label: "Personal Tools", value: "6 calculators", icon: "🛠️" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white dark:bg-gradient-to-b dark:from-[#000a07] dark:via-[#020f0b] dark:to-[#010b08]">
      {/* Hero Section */}
      <section className="enter-fade mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="rounded-3xl overflow-hidden border border-primary-200/40 dark:border-primary-300/20 bg-gradient-to-br from-primary-50 to-white dark:from-primary-950/40 dark:to-primary-900/20 p-8 sm:p-12 shadow-xl dark:shadow-2xl dark:shadow-primary-950/50">
          <div className="max-w-4xl">
            <div className="inline-block mb-4">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-300 bg-primary-100/60 dark:bg-primary-950/60 px-4 py-2 rounded-full">
                Health Over Wealth
              </span>
            </div>
            <h1 className="mt-4 max-w-4xl text-4xl sm:text-5xl lg:text-6xl leading-tight font-bold tracking-tight text-slate-900 dark:text-white">
              Your all-in-one health and fitness operating system.
            </h1>
            <p className="mt-6 max-w-3xl text-base sm:text-lg text-slate-700 dark:text-primary-100/90 leading-relaxed">
              HOW combines profile planning, nutrition intelligence, movement insights, calculator tools, friend comparison, and AI guidance to help you stay consistent and improve week by week.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/profile"
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-3 text-sm font-bold text-white shadow-lg hover:shadow-xl dark:shadow-primary-500/40 hover:-translate-y-0.5 transition-all duration-200"
              >
                Start Your Profile
              </Link>
              <Link
                href="/friends"
                className="inline-flex items-center justify-center rounded-lg border border-primary-300/50 dark:border-primary-300/30 bg-white dark:bg-primary-950/30 px-6 py-3 text-sm font-bold text-slate-900 dark:text-primary-100 hover:bg-primary-50 dark:hover:bg-primary-900/40 transition-all duration-200"
              >
                Explore Community
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats Grid */}
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {quickStats.map((item) => (
            <article
              key={item.label}
              className="rounded-2xl border border-primary-200/40 dark:border-primary-300/20 bg-gradient-to-br from-primary-50/60 to-white dark:from-primary-950/30 dark:to-primary-900/20 p-4 sm:p-5 text-center shadow-md dark:shadow-lg dark:shadow-primary-950/20"
            >
              <div className="text-2xl sm:text-3xl mb-2">{item.icon}</div>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{item.value}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.15em] font-semibold text-slate-800 dark:text-primary-200/70">
                {item.label}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Powerful Features Built for You
        </h2>
        <p className="text-slate-700 dark:text-primary-100/80 mb-8">
          Everything you need to manage your health and fitness in one place.
        </p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featureCards.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group rounded-2xl border border-primary-200/40 dark:border-primary-300/20 bg-white dark:bg-primary-950/30 p-6 shadow-md hover:shadow-lg dark:shadow-lg dark:shadow-primary-950/20 transition-all duration-200 hover:-translate-y-1"
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors">
                {item.title}
              </h3>
              <p className="text-sm text-slate-700 dark:text-primary-100/80 leading-relaxed">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Why It Works Section */}
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-12">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Why HOW Works */}
          <article className="rounded-2xl border border-primary-200/40 dark:border-primary-300/20 bg-white dark:bg-gradient-to-br dark:from-primary-950/40 dark:to-primary-900/20 p-8 shadow-md dark:shadow-lg dark:shadow-primary-950/20">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Why HOW Works
            </h3>
            <p className="text-slate-700 dark:text-primary-100/80 mb-6 leading-relaxed">
              Most health apps are either too basic or too overwhelming. HOW gives you practical structure: easy profile setup, measurable goals, and meaningful progress signals.
            </p>
            <ul className="space-y-3">
              {siteBenefits.map((benefit) => (
                <li key={benefit} className="flex gap-3 text-sm text-slate-800 dark:text-primary-100/90">
                  <span className="inline-flex shrink-0 items-center justify-center w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/60 text-primary-600 dark:text-primary-300 font-bold text-xs">
                    ✓
                  </span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </article>

          {/* Built for Real Progress */}
          <article className="rounded-2xl border border-primary-200/40 dark:border-primary-300/20 bg-white dark:bg-gradient-to-br dark:from-primary-950/40 dark:to-primary-900/20 p-8 shadow-md dark:shadow-lg dark:shadow-primary-950/20">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Built For Real Progress
            </h3>
            <p className="text-slate-700 dark:text-primary-100/80 mb-6 leading-relaxed">
              This is your digital coach dashboard. Track steps, compare with friends, optimize intake, and make each week better than the previous one.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-primary-200/40 dark:border-primary-300/20 bg-primary-50/40 dark:bg-primary-950/50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary-700 dark:text-primary-300 mb-2">
                  Health Focus
                </p>
                <p className="text-sm text-slate-800 dark:text-primary-100/90">
                  Movement, nutrition, recovery, and consistency tracking.
                </p>
              </div>
              <div className="rounded-lg border border-primary-200/40 dark:border-primary-300/20 bg-primary-50/40 dark:bg-primary-950/50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary-700 dark:text-primary-300 mb-2">
                  Fitness Focus
                </p>
                <p className="text-sm text-slate-800 dark:text-primary-100/90">
                  Calculators, activity planning, and performance habits.
                </p>
              </div>
            </div>
            <Link
              href="/insights"
              className="mt-5 inline-flex rounded-lg border border-primary-300/50 dark:border-primary-300/30 px-5 py-2.5 text-sm font-bold text-slate-900 dark:text-primary-100 hover:bg-primary-50 dark:hover:bg-primary-900/40 transition-all duration-200"
            >
              Explore Insights & Articles →
            </Link>
          </article>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-16">
        <div className="rounded-3xl border border-primary-200/40 dark:border-primary-300/20 overflow-hidden bg-gradient-to-r from-primary-100/80 to-primary-50/80 dark:from-primary-950/60 dark:to-primary-900/40 p-8 sm:p-12 shadow-lg dark:shadow-2xl dark:shadow-primary-950/40">
          <h3 className="max-w-3xl text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Start your transformation with HOW today.
          </h3>
          <p className="max-w-2xl text-base text-slate-800 dark:text-primary-100/85 mb-8 leading-relaxed">
            Whether your goal is fat loss, maintenance, muscle gain, or simply better energy, HOW gives you a structured, modern system to stay on track.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/profile"
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-secondary-500 to-secondary-600 px-6 py-3 text-sm font-bold text-slate-900 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              Create My Plan
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-lg border border-primary-300/50 dark:border-primary-300/30 bg-white dark:bg-primary-950/50 px-6 py-3 text-sm font-bold text-slate-900 dark:text-primary-100 hover:bg-primary-50 dark:hover:bg-primary-900/40 transition-all duration-200"
            >
              Contact Team HOW
            </Link>
          </div>
        </div>
      </section>

      {/* Bottom Spacer */}
      <div className="h-8" />
    </main>
  );
}
