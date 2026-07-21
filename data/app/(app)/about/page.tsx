import Link from 'next/link'
import { BookOpen, Sparkles, ShieldCheck, HeartHandshake } from 'lucide-react'
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'

// PRD §4.65a — About page. Static content only, drawn from facts already
// established in the Constitution and PRD — nothing here is invented.
// Team section resolved to Option D (document 15): honest, no fabricated
// names/roles. Tagline: preserving the existing active application
// convention ("Scripture · Peace · Purpose") per this session's explicit
// instruction, since the brand tagline is still an open product decision —
// ASSUMPTION — REQUIRES PRODUCT DECISION, not resolved by this page.

export const metadata = { title: 'About — Kingdom Companion' }

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-cream-gradient">
      <Navigation />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-serif text-navy mb-1">About Kingdom Companion</h1>
        <p className="text-gold-dark italic mb-10">Scripture · Peace · Purpose</p>

        <section className="mb-10">
          <h2 className="text-sm font-medium uppercase tracking-wide text-navy/40 mb-3">What Kingdom Companion Is</h2>
          <p className="text-navy/80 leading-relaxed">
            Kingdom Companion is a free, faith-centred Progressive Web App that helps people
            encounter God&rsquo;s Word through Scripture reading, AI-assisted study, prayer,
            devotionals, and guided spiritual growth &mdash; accessible across mobile and
            desktop, online or offline.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-sm font-medium uppercase tracking-wide text-navy/40 mb-3">Our Mission</h2>
          <p className="text-navy/80 leading-relaxed">
            To provide a peaceful digital sanctuary where people can read the Bible, receive
            biblically grounded encouragement, and grow in their relationship with God.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-sm font-medium uppercase tracking-wide text-navy/40 mb-3">Our Vision</h2>
          <p className="text-navy/80 leading-relaxed">
            To create the world&rsquo;s most trusted, peaceful, and Scripture-centred digital
            companion &mdash; helping people encounter God&rsquo;s Word, receive biblical
            encouragement, develop consistent devotional habits, and grow in their faith every day.
          </p>
        </section>

        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          <div className="p-5 rounded-xl bg-white border border-navy/8">
            <BookOpen className="w-5 h-5 text-gold-dark mb-2" />
            <h3 className="font-serif text-navy mb-1">The Role of Scripture</h3>
            <p className="text-sm text-navy/60 leading-relaxed">
              Scripture is the foundation and highest authority of the app. It is never edited,
              altered, or fabricated, and always appears clearly distinguished from AI commentary.
            </p>
          </div>
          <div className="p-5 rounded-xl bg-white border border-navy/8">
            <Sparkles className="w-5 h-5 text-gold-dark mb-2" />
            <h3 className="font-serif text-navy mb-1">The Role of AI</h3>
            <p className="text-sm text-navy/60 leading-relaxed">
              Our AI exists to support Scripture, never to replace it, pastoral care, or
              professional advice. The Bible is the Authority. AI is the Companion.
            </p>
          </div>
          <div className="p-5 rounded-xl bg-white border border-navy/8">
            <ShieldCheck className="w-5 h-5 text-gold-dark mb-2" />
            <h3 className="font-serif text-navy mb-1">Free &amp; Private</h3>
            <p className="text-sm text-navy/60 leading-relaxed">
              Core Scripture and spiritual features are always free. Your Prayer Journal is
              private by design &mdash; no one else can ever see it.
            </p>
          </div>
          <div className="p-5 rounded-xl bg-white border border-navy/8">
            <HeartHandshake className="w-5 h-5 text-gold-dark mb-2" />
            <h3 className="font-serif text-navy mb-1">Voluntary Support</h3>
            <p className="text-sm text-navy/60 leading-relaxed">
              Kingdom Companion remains free for everyone. Optional donations help cover
              hosting, development, and accessibility &mdash; never required to use the app.
            </p>
          </div>
        </div>

        <section className="mb-10">
          <h2 className="text-sm font-medium uppercase tracking-wide text-navy/40 mb-3">Who&rsquo;s Behind This</h2>
          <p className="text-navy/80 leading-relaxed">
            Kingdom Companion is currently being developed and operated by a small founding team.
          </p>
        </section>

        <section className="p-5 rounded-xl bg-navy/5">
          <p className="text-navy/70 text-sm">
            Questions, feedback, or need help? Visit{' '}
            <Link href="/support" className="text-gold-dark hover:underline">Help &amp; Support</Link>.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
