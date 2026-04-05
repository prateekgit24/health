import Link from "next/link";

const featureCards = [
  {
    title: "Profile-Driven Targets",
    description: "Get calorie, macro, hydration, and goal guidance that adapts to your body profile and activity behavior.",
    href: "/profile",
  },
  {
    title: "Smart Nutrition Explorer",
    description: "Compare foods in seconds, inspect macros, and make better meal choices with practical context.",
    href: "/nutrition",
  },
  {
    title: "Training and Activity Insights",
    description: "Understand workouts, sports, and daily movement with useful intensity and benefit information.",
    href: "/activities",
  },
  {
    title: "Fitness Calculators",
    description: "Use BMI, BMR, TDEE, and daily requirement calculators to make informed health decisions.",
    href: "/calculators",
  },
];

const siteBenefits = [
  "One place for profile, nutrition, movement, and planning",
  "Privacy-aware friend comparison and progress context",
  "Actionable numbers instead of generic motivation",
  "Simple workflows for beginners and consistency seekers",
];

const quickStats = [
  { label: "Daily Metrics", value: "15+" },
  { label: "Nutrition Data", value: "100+ foods" },
  { label: "Activity Catalog", value: "30+" },
  { label: "Personal Tools", value: "6 calculators" },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <section className="enter-fade overflow-hidden rounded-3xl border border-emerald-300/25 bg-[linear-gradient(120deg,rgba(6,78,59,0.65),rgba(16,185,129,0.24),rgba(2,12,8,0.45))] p-8 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-200">Health Over Wealth</p>
        <h1 className="mt-3 max-w-4xl text-5xl leading-tight font-semibold text-white sm:text-6xl">
          Your all-in-one health and fitness operating system.
        </h1>
        <p className="mt-5 max-w-3xl text-base text-emerald-50/90 sm:text-lg">
          HOW combines profile planning, nutrition intelligence, movement insights, calculator tools,
          friend comparison, and AI guidance to help you stay consistent and improve week by week.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/profile"
            className="rounded-full bg-[linear-gradient(95deg,#34d399,#4ade80)] px-6 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
          >
            Start Your Profile
          </Link>
          <Link
            href="/friends"
            className="rounded-full border border-emerald-200/40 bg-[#0a2a1d]/80 px-6 py-3 text-sm font-semibold text-emerald-50 transition hover:border-emerald-200/70"
          >
            Explore Friends & Badges
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((item) => (
          <article key={item.label} className="app-surface rounded-2xl p-4">
            <p className="text-2xl font-semibold text-emerald-100">{item.value}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-emerald-200/75">{item.label}</p>
          </article>
        ))}
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {featureCards.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="app-surface rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <h2 className="text-2xl font-semibold text-emerald-100">{item.title}</h2>
            <p className="mt-2 text-sm text-slate-200">{item.description}</p>
          </Link>
        ))}
      </section>

      <section className="mt-10 grid gap-4 lg:grid-cols-2">
        <article className="app-surface rounded-2xl p-6">
          <h3 className="text-2xl font-semibold text-amber-200">Why HOW Works</h3>
          <p className="mt-3 text-sm text-emerald-100/80">
            Most health apps are either too basic or too overwhelming. HOW gives you practical structure:
            easy profile setup, measurable goals, and meaningful progress signals.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-emerald-100/90">
            {siteBenefits.map((item) => (
              <li key={item} className="rounded-lg border border-emerald-200/20 bg-emerald-950/40 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </article>

        <article className="app-surface rounded-2xl p-6">
          <h3 className="text-2xl font-semibold text-amber-200">Built For Real Progress</h3>
          <p className="mt-3 text-sm text-emerald-100/80">
            This is your digital coach dashboard. Track steps, compare with friends, optimize intake,
            and make each week better than the previous one.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-200/20 bg-emerald-950/40 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/75">Health Focus</p>
              <p className="mt-1 text-sm text-emerald-100">Movement, nutrition, recovery, and consistency tracking.</p>
            </div>
            <div className="rounded-xl border border-emerald-200/20 bg-emerald-950/40 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/75">Fitness Focus</p>
              <p className="mt-1 text-sm text-emerald-100">Calculators, activity planning, and performance-oriented habits.</p>
            </div>
          </div>
          <Link
            href="/insights"
            className="mt-5 inline-flex rounded-full border border-emerald-200/35 px-5 py-2 text-sm font-semibold text-emerald-50 hover:border-emerald-100/60"
          >
            Explore Insights and Articles
          </Link>
        </article>
      </section>

      <section className="mt-10 rounded-3xl border border-emerald-300/25 bg-[linear-gradient(120deg,rgba(2,23,15,0.8),rgba(5,63,45,0.65),rgba(8,31,23,0.8))] p-8">
        <h3 className="text-3xl font-semibold text-white">Start your transformation with HOW today.</h3>
        <p className="mt-3 max-w-3xl text-sm text-emerald-100/85">
          Whether your goal is fat loss, maintenance, muscle gain, or simply better energy,
          HOW gives you a structured, modern system to stay on track.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/profile" className="rounded-full bg-amber-300 px-6 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-amber-200">
            Create My Plan
          </Link>
          <Link href="/contact" className="rounded-full border border-emerald-200/40 px-6 py-2.5 text-sm font-semibold text-emerald-50 hover:border-emerald-100/70">
            Contact Team HOW
          </Link>
        </div>
      </section>
    </main>
  );
}
