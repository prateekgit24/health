export default function HelpPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <section className="app-surface rounded-2xl p-6">
        <h1 className="text-3xl font-semibold text-primary-100">Help</h1>
        <p className="mt-3 text-sm text-primary-100/85">Quick start guide:</p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-primary-100/90">
          <li>Create your profile with basic details and save.</li>
          <li>Accept Terms and Conditions on first profile creation popup.</li>
          <li>Connect Google Health to sync movement metrics.</li>
          <li>Use Nutrition Explorer to compare foods and improve meal quality.</li>
          <li>Visit Friends page for requests, leaderboard, badges, and percentile rank.</li>
          <li>Use calculators weekly and tune your targets based on progress.</li>
        </ol>
        <div className="mt-5 rounded-xl border border-primary-200/20 bg-primary-950/35 p-4">
          <h2 className="text-lg font-semibold text-secondary-200">Troubleshooting</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-primary-100/90">
            <li>If sync data is missing, reconnect Google Health and refresh status.</li>
            <li>If profile save fails, re-login and try again.</li>
            <li>If compare tables are empty, confirm comparison sharing is enabled in profile settings.</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
