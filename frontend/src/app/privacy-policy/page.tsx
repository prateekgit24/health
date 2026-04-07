export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <section className="app-surface rounded-2xl p-6">
        <h1 className="text-3xl font-semibold text-primary-100">Privacy Policy</h1>
        <p className="mt-3 text-sm text-primary-100/85">Last updated: April 6, 2026</p>
        <div className="mt-6 space-y-6 text-sm text-primary-100/90 leading-relaxed">
          <section>
            <h2 className="text-xl font-medium text-primary-50 mb-2">1. Introduction</h2>
            <p>
              HOW (Health Over Wealth) respects your privacy and is committed to protecting your personal data. 
              This policy explains how we collect, use, store, and protect your information when you use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-primary-50 mb-2">2. Information We Collect</h2>
            <p>We collect information necessary to provide you with meaningful health and fitness insights:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Account information (email, name, authentication details).</li>
              <li>Profile metrics (age, height, weight, activity level, fitness goals).</li>
              <li>Fitness and activity insights synchronized via Google Health APIs, limited to steps, calories burned, distance, active minutes, and heart points.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-secondary-200 mb-2">3. Google API Limited Use Policy</h2>
            <p>
              HOW&apos;s use and transfer to any other app of information received from Google APIs will adhere to the 
              <strong> <a href="https://developers.google.com/terms/api-services-user-data-policy" className="underline hover:text-secondary-100" target="_blank" rel="noreferrer">Google API Services User Data Policy</a></strong>, 
              including the Limited Use requirements. Specifically:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>No Data Sales:</strong> We will not transfer or sell user data to third parties like advertising platforms, data brokers, or any information resellers.</li>
              <li><strong>No Ads:</strong> We will not use your Google Health data for serving ads, retargeting, personalized, or interest-based advertising.</li>
              <li><strong>Secure Access:</strong> Humans cannot read your synchronized data unless we aggregate and anonymize it for security purposes, or we are required to comply with applicable laws.</li>
              <li><strong>Strict Scope:</strong> We only request the minimum required scopes—specifically step_count, calories, distance, and activity minutes—to power your profile insights and calculators.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-primary-50 mb-2">4. Data Storage and Security</h2>
            <p>
              Your data is stored securely using Firebase cloud infrastructure. All data exchanged between your devices 
              and our servers is encrypted in transit. You retain the ability to delete your data at any time from your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-primary-50 mb-2">5. User Rights and Deletion</h2>
            <p>
              You have the right to access, rectify, or permanently delete your data. You can disconnect your Google Health 
              account directly from the Profile page. For full account and data removal, please contact our support team.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-primary-50 mb-2">Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or data handling, please contact us at: 
              <br />
              <strong>Email:</strong> help@cosmics.software
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
