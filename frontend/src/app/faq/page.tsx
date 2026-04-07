const items = [
  {
    q: "Is HOW free to use?",
    a: "Core planning and tracker features are available without any paid plan in this version.",
  },
  {
    q: "How are my health stats used?",
    a: "Your stats are used to generate your personal recommendations and comparisons when you explicitly opt in.",
  },
  {
    q: "Can I disable friend comparison?",
    a: "Yes. You can disable comparison sharing from your profile settings at any time.",
  },
  {
    q: "How often should I update my profile?",
    a: "A weekly update works well for most users, or whenever your weight/activity changes significantly.",
  },
  {
    q: "Do I need Google Health/Fit connected to use HOW?",
    a: "No. You can use profile, calculators, and nutrition features without sync. Health sync adds richer movement metrics.",
  },
  {
    q: "How does percentile rank work?",
    a: "When comparison sharing is enabled, your percentile rank is calculated among users with comparable shared metrics. Individual identities are not exposed.",
  },
  {
    q: "Can I request account or data deletion?",
    a: "Yes. Email help@cosmics.software from your registered account and we will process your request.",
  },
];

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gradient-to-b dark:from-[#000a07] dark:via-[#020f0b] dark:to-[#010b08]">
      <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-12">
          <div className="inline-block mb-4">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-300 bg-primary-100/60 dark:bg-primary-950/60 px-4 py-2 rounded-full">
              Frequently Asked
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            FAQ
          </h1>
          <p className="text-lg text-slate-600 dark:text-primary-100/85">
            Common questions and answers about HOW.
          </p>
        </div>

        <div className="space-y-4">
          {items.map((item) => (
            <article key={item.q} className="rounded-2xl border border-primary-200/40 dark:border-primary-300/20 bg-white dark:bg-primary-950/30 p-6 shadow-md dark:shadow-lg dark:shadow-primary-950/20 hover:shadow-lg dark:hover:shadow-xl transition-shadow">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">{item.q}</h2>
              <p className="text-slate-600 dark:text-primary-100/85 leading-relaxed">{item.a}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
