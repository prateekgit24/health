export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <section className="app-surface rounded-2xl p-6">
        <h1 className="text-3xl font-semibold text-emerald-100">Privacy Policy</h1>
        <p className="mt-3 text-sm text-emerald-100/85">Last updated: April 5, 2026</p>
        <div className="mt-4 space-y-3 text-sm text-emerald-100/90">
          <p>
            We collect profile and activity data needed to provide recommendations, calculators,
            health summaries, badges, and optional comparison features.
          </p>
          <p>
            Friend comparison is privacy-controlled. Data is shown only when users explicitly enable comparison sharing.
          </p>
          <p>
            We use trusted third-party providers (including Firebase and Google APIs) for authentication,
            storage, and health data sync where user consent is provided.
          </p>
          <p>
            We do not claim to provide medical diagnosis. HOW is an informational wellness platform.
          </p>
          <p>
            For data access, correction, or deletion requests, email help@cosmics.software from your registered account.
          </p>
        </div>
      </section>
    </main>
  );
}
