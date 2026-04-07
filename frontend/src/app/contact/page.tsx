export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gradient-to-b dark:from-[#000a07] dark:via-[#020f0b] dark:to-[#010b08]">
      <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-12">
          <div className="inline-block mb-4">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-300 bg-primary-100/60 dark:bg-primary-950/60 px-4 py-2 rounded-full">
              Get in Touch
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Contact Us
          </h1>
          <p className="text-lg text-slate-600 dark:text-primary-100/85">
            For support, bug reports, product feedback, and partnership inquiries, contact the HOW team directly.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 mb-8">
          <article className="rounded-2xl border border-primary-200/40 dark:border-primary-300/20 bg-white dark:bg-primary-950/30 p-8 shadow-md dark:shadow-lg dark:shadow-primary-950/20">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Support Email</h2>
            <p className="text-sm font-mono text-primary-600 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/60 p-3 rounded-lg">help@cosmics.software</p>
          </article>
          <article className="rounded-2xl border border-primary-200/40 dark:border-primary-300/20 bg-white dark:bg-primary-950/30 p-8 shadow-md dark:shadow-lg dark:shadow-primary-950/20">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Response Time</h2>
            <p className="text-slate-600 dark:text-primary-100/90">Usually within 1-2 business days.</p>
          </article>
        </div>

        <article className="rounded-2xl border border-primary-200/40 dark:border-primary-300/20 bg-gradient-to-br from-primary-50/60 to-white dark:from-primary-950/40 dark:to-primary-900/20 p-8 shadow-md dark:shadow-lg dark:shadow-primary-950/20">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-lg">For faster support, please include:</h3>
          <ul className="space-y-3">
            <li className="flex gap-3 text-slate-600 dark:text-primary-100/90">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-200 dark:bg-primary-900/60 text-primary-700 dark:text-primary-300 font-bold text-xs shrink-0">•</span>
              <span>Your account email used in HOW</span>
            </li>
            <li className="flex gap-3 text-slate-600 dark:text-primary-100/90">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-200 dark:bg-primary-900/60 text-primary-700 dark:text-primary-300 font-bold text-xs shrink-0">•</span>
              <span>Page where issue occurred</span>
            </li>
            <li className="flex gap-3 text-slate-600 dark:text-primary-100/90">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-200 dark:bg-primary-900/60 text-primary-700 dark:text-primary-300 font-bold text-xs shrink-0">•</span>
              <span>Screenshots and steps to reproduce</span>
            </li>
            <li className="flex gap-3 text-slate-600 dark:text-primary-100/90">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-200 dark:bg-primary-900/60 text-primary-700 dark:text-primary-300 font-bold text-xs shrink-0">•</span>
              <span>Browser/device details</span>
            </li>
          </ul>
        </article>
      </div>
    </main>
  );
}
