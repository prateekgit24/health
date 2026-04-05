export default function ContactPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <section className="app-surface rounded-2xl p-6">
        <h1 className="text-3xl font-semibold text-emerald-100">Contact Us</h1>
        <p className="mt-3 text-sm text-emerald-100/85">
          For support, bug reports, product feedback, and partnership inquiries, contact the HOW team directly.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <article className="rounded-xl border border-emerald-200/20 bg-emerald-950/35 p-4">
            <h2 className="text-lg font-semibold text-amber-200">Support Email</h2>
            <p className="mt-2 text-sm text-emerald-100/90">help@cosmics.software</p>
          </article>
          <article className="rounded-xl border border-emerald-200/20 bg-emerald-950/35 p-4">
            <h2 className="text-lg font-semibold text-amber-200">Response Time</h2>
            <p className="mt-2 text-sm text-emerald-100/90">Usually within 1-2 business days.</p>
          </article>
        </div>
        <div className="mt-4 rounded-xl border border-emerald-200/20 bg-emerald-950/35 p-4 text-sm text-emerald-100/90">
          <p className="font-semibold text-emerald-100">For faster support, include:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Your account email used in HOW</li>
            <li>Page where issue occurred</li>
            <li>Screenshots and steps to reproduce</li>
            <li>Browser/device details</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
