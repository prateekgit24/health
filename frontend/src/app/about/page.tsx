export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gradient-to-b dark:from-[#000a07] dark:via-[#020f0b] dark:to-[#010b08]">
      <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-block mb-4">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-300 bg-primary-100/60 dark:bg-primary-950/60 px-4 py-2 rounded-full">
              About HOW
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            About Us
          </h1>
          <p className="text-lg text-slate-600 dark:text-primary-100/85">
            HOW (Health Over Wealth) is built to make health and fitness decisions practical, measurable, and sustainable.
          </p>
        </div>

        {/* Mission & Difference Grid */}
        <section className="grid gap-6 sm:grid-cols-2 mb-12">
          <article className="rounded-2xl border border-primary-200/40 dark:border-primary-300/20 bg-white dark:bg-primary-950/30 p-8 shadow-md dark:shadow-lg dark:shadow-primary-950/20">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Our Mission
            </h2>
            <p className="text-slate-600 dark:text-primary-100/90 leading-relaxed">
              Help people improve health outcomes through better structure: profile planning, nutrition understanding, activity tracking, and simple weekly consistency.
            </p>
          </article>

          <article className="rounded-2xl border border-primary-200/40 dark:border-primary-300/20 bg-white dark:bg-primary-950/30 p-8 shadow-md dark:shadow-lg dark:shadow-primary-950/20">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              What Makes HOW Different
            </h2>
            <p className="text-slate-600 dark:text-primary-100/90 leading-relaxed">
              HOW combines calculators, guided summaries, social comparison controls, and practical data signals in one focused platform.
            </p>
          </article>
        </section>

        {/* Core Philosophy */}
        <section className="rounded-2xl border border-primary-200/40 dark:border-primary-300/20 bg-gradient-to-br from-primary-50/60 to-white dark:from-primary-950/40 dark:to-primary-900/20 p-8 md:p-12 shadow-md dark:shadow-lg dark:shadow-primary-950/20">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Our Core Philosophy
          </h3>
          <p className="text-slate-600 dark:text-primary-100/85 leading-relaxed mb-4">
            We believe strong health is built through informed decisions repeated over time, not extreme short-term plans.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div>
              <div className="text-2xl mb-3">📊</div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">Data-Driven</h4>
              <p className="text-sm text-slate-600 dark:text-primary-100/80">
                Real metrics and calculations replace generic advice.
              </p>
            </div>
            <div>
              <div className="text-2xl mb-3">🎯</div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">Profile-First</h4>
              <p className="text-sm text-slate-600 dark:text-primary-100/80">
                Your unique body and habits determine your targets.
              </p>
            </div>
            <div>
              <div className="text-2xl mb-3">🔄</div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">Consistency</h4>
              <p className="text-sm text-slate-600 dark:text-primary-100/80">
                Weekly progress signals keep you motivated.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
