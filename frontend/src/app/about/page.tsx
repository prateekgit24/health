export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <section className="app-surface rounded-2xl p-6">
        <h1 className="text-3xl font-semibold text-emerald-100">About Us</h1>
        <p className="mt-3 text-sm text-emerald-100/85">
          HOW (Health Over Wealth) is built to make health and fitness decisions practical, measurable, and sustainable.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <article className="rounded-xl border border-emerald-200/20 bg-emerald-950/35 p-4">
            <h2 className="text-lg font-semibold text-amber-200">Our Mission</h2>
            <p className="mt-2 text-sm text-emerald-100/90">
              Help people improve health outcomes through better structure: profile planning, nutrition understanding,
              activity tracking, and simple weekly consistency.
            </p>
          </article>
          <article className="rounded-xl border border-emerald-200/20 bg-emerald-950/35 p-4">
            <h2 className="text-lg font-semibold text-amber-200">What Makes HOW Different</h2>
            <p className="mt-2 text-sm text-emerald-100/90">
              HOW combines calculators, guided summaries, social comparison controls, and practical data signals
              in one focused platform.
            </p>
          </article>
        </div>
        <p className="mt-4 text-sm text-emerald-100/85">
          We believe strong health is built through informed decisions repeated over time, not extreme short-term plans.
        </p>
      </section>
    </main>
  );
}
