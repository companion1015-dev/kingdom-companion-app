'use client'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'

// Real fix: the footer has linked to /privacy since early in the project,
// but the page never existed -- a genuine 404, same gap as /contact was.
// This reflects what the app actually does and actually collects, not
// generic boilerplate -- but it is a draft. It should get a real legal
// review before being relied on as a binding policy, and that note is
// left visible on the page itself rather than hidden.

export default function PrivacyPage() {
  const lastUpdated = 'August 2026'

  return (
    <div className="min-h-screen bg-cream dark:bg-navy-dark-gradient">
      <Navigation />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-serif text-navy dark:text-cream mb-2">Privacy Policy</h1>
        <p className="text-charcoal/40 dark:text-cream/40 font-body text-xs mb-8">Last updated: {lastUpdated}</p>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8">
          <p className="text-xs font-body text-amber-800 leading-relaxed">
            <strong>Draft notice:</strong> this policy accurately describes what Kingdom Companion actually collects and does today. It has not yet been reviewed by a lawyer, and should be before being relied upon as a final, binding policy.
          </p>
        </div>

        <div className="bg-white dark:bg-navy-dark rounded-2xl border border-navy/8 p-6 sm:p-8 space-y-6 text-sm text-charcoal/70 dark:text-cream/70 font-body leading-relaxed">

          <section>
            <h2 className="font-display text-lg font-semibold text-navy dark:text-cream mb-2">1. Who we are</h2>
            <p>Kingdom Companion (&ldquo;we&rdquo;, &ldquo;us&rdquo;) provides Bible reading, AI insight, devotionals, a prayer journal, and community features. This policy explains what information we collect when you use the app, why, and what choices you have. We are not a religious organization or charity.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-navy dark:text-cream mb-2">2. Information we collect</h2>
            <p className="mb-2"><strong className="text-navy dark:text-cream">Account information:</strong> your email address and a securely hashed password when you register. We never store your password in plain text.</p>
            <p className="mb-2"><strong className="text-navy dark:text-cream">Content you create:</strong> prayer journal entries, Bible highlights and notes, Prayer Wall posts, AI Companion conversations, and any messages you send us through the Contact form.</p>
            <p className="mb-2"><strong className="text-navy dark:text-cream">Voluntary contribution information:</strong> if you choose to support app maintenance, payments are processed directly by Stripe or PayPal. We never see or store your full card details &mdash; we store the amount, date, and selected purpose only.</p>
            <p><strong className="text-navy dark:text-cream">Usage information:</strong> approximate country (used only to show relevant currency and payment options), device type, and general app usage, to help us understand what is and is not working. We do not sell your data.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-navy dark:text-cream mb-2">3. How we use your information</h2>
            <p>To provide and improve the app, keep your account secure, respond to support requests, and process voluntary contributions toward server and development costs. We do not sell your personal information to anyone, ever.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-navy dark:text-cream mb-2">4. Third-party services we use</h2>
            <p className="mb-2">Certain features rely on outside services, each processing only what is necessary for that specific feature:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-navy dark:text-cream">Anthropic (Claude)</strong> &mdash; powers the AI Companion. Your messages to the AI Companion are sent to Anthropic to generate a response.</li>
              <li><strong className="text-navy dark:text-cream">Stripe and PayPal</strong> &mdash; process payments. We never receive or store your full card details.</li>
              <li><strong className="text-navy dark:text-cream">Resend</strong> &mdash; sends account emails (verification, password reset).</li>
              <li><strong className="text-navy dark:text-cream">YouVersion and bible.helloao.org</strong> &mdash; provide Bible text, commentary, and search. These requests do not include your personal identity.</li>
              <li><strong className="text-navy dark:text-cream">Supabase</strong> &mdash; hosts our database. <strong className="text-navy dark:text-cream">Vercel</strong> &mdash; hosts the application itself.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-navy dark:text-cream mb-2">5. Prayer Wall and community content</h2>
            <p className="mb-2">When you post to the Prayer Wall, your chosen privacy setting &mdash; Private, Anonymous, or Community &mdash; controls who can see it. Anonymous and Community posts are, by design, visible to other users.</p>
            <p>Please do not include personal details such as a full name, phone number, address, or photos of others. All Prayer Wall posts are reviewed before being made visible.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-navy dark:text-cream mb-2">6. Your rights</h2>
            <p>You may request a copy of your data, ask us to correct it, or ask us to delete your account and associated data, by contacting us (Section 11). We will delete your account and data within 30 days of a verified request, except where retention is required by law.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-navy dark:text-cream mb-2">7. Children&rsquo;s privacy</h2>
            <p>Kingdom Companion is intended for users age 13 and older. We do not knowingly collect personal information from children under 13. If you are a parent and believe a child has provided us with personal information, please contact us so we can remove it.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-navy dark:text-cream mb-2">8. UAE compliance notice</h2>
            <p>For users in the United Arab Emirates: this app is intended for personal study only. We comply with UAE Federal Decree-Law No. 26 of 2025 on Child Digital Safety.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-navy dark:text-cream mb-2">9. Security</h2>
            <p>We use industry-standard measures (encrypted connections, hashed passwords, access controls) to protect your information. No system is perfectly secure, and we cannot guarantee absolute security.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-navy dark:text-cream mb-2">10. Changes to this policy</h2>
            <p>We may update this policy as the app changes. We will update the &ldquo;Last updated&rdquo; date above when we do.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-navy dark:text-cream mb-2">11. Contact us</h2>
            <p>Questions about this policy or your data can be sent through our <a href="/contact" className="text-gold hover:text-gold-dark underline">Contact page</a>.</p>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  )
}