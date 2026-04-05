export default function TermsAndConditionsPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <section className="app-surface rounded-2xl p-6">
        <h1 className="text-3xl font-semibold text-emerald-100">Terms and Conditions</h1>
        <p className="mt-3 text-sm text-emerald-100/85">Last updated: April 5, 2026</p>
        <div className="mt-4 space-y-3 text-sm text-emerald-100/90">
          <p>
            HOW provides informational health and fitness guidance and does not replace professional medical advice,
            diagnosis, or treatment.
          </p>
          <p>
            By using this website, you agree to use the platform responsibly and provide accurate information where possible.
          </p>
          <p>
            You are responsible for consulting qualified medical professionals before making significant changes to
            diet, medication, or exercise routines.
          </p>
          <p>
            You may not misuse, reverse engineer, or abuse the platform, APIs, or account systems.
          </p>
          <p>
            We may update these terms periodically. Continued use after updates indicates acceptance of revised terms.
          </p>
        </div>
      </section>
    </main>
  );
}
