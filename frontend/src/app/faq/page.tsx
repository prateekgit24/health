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
    <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <section className="app-surface rounded-2xl p-6">
        <h1 className="text-3xl font-semibold text-emerald-100">FAQ</h1>
        <div className="mt-5 space-y-3">
          {items.map((item) => (
            <article key={item.q} className="rounded-xl border border-emerald-200/20 bg-emerald-950/35 p-4">
              <h2 className="text-lg font-semibold text-amber-200">{item.q}</h2>
              <p className="mt-2 text-sm text-emerald-100/85">{item.a}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
