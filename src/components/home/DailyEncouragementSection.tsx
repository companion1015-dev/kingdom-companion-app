import Link from 'next/link'
import { ArrowRight, Sunrise } from 'lucide-react'
import { dailyEncouragement } from '@/data/mock'

export default function DailyEncouragementSection() {
  return (
    <section
      className="py-20 px-4 sm:px-6 lg:px-8 bg-navy"
      aria-labelledby="daily-heading"
    >
      <div className="max-w-4xl mx-auto">

        {/* Section label */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center gap-2 text-gold/80">
            <Sunrise className="w-4 h-4" />
            <span className="text-xs font-body font-medium tracking-widest uppercase">Daily Encouragement</span>
          </div>
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-white/30 font-body">{dailyEncouragement.date}</span>
        </div>

        {/* Main card */}
        <div
          className="rounded-2xl p-8 sm:p-10 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(27,58,92,0.6) 100%)',
            border: '1px solid rgba(201,168,76,0.15)',
          }}
        >
          {/* Decorative quote mark */}
          <span
            className="absolute top-6 right-8 font-display text-[120px] leading-none text-white/03 select-none pointer-events-none"
            aria-hidden="true"
          >
            "
          </span>

          {/* Verse */}
          <div className="mb-7">
            <p className="font-display text-2xl sm:text-3xl font-light text-white leading-relaxed italic mb-3">
              &ldquo;{dailyEncouragement.verse.text}&rdquo;
            </p>
            <p className="text-gold text-sm font-body font-medium">
              — {dailyEncouragement.verse.reference} <span className="text-white/30">({dailyEncouragement.verse.translation})</span>
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent mb-7" />

          {/* Reflection */}
          <p className="text-white/65 font-body text-base leading-relaxed mb-4">
            {dailyEncouragement.reflection}
          </p>

          {/* Prayer snippet */}
          <p className="text-white/45 font-display italic text-sm leading-relaxed mb-7 pl-4 border-l-2 border-gold/30">
            {dailyEncouragement.prayer}
          </p>

          {/* Challenge */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/8 mb-8">
            <span className="text-base mt-0.5">📖</span>
            <div>
              <span className="text-xs text-gold/70 font-body font-medium tracking-wider uppercase block mb-1">Today's Challenge</span>
              <p className="text-white/70 text-sm font-body">{dailyEncouragement.challenge}</p>
            </div>
          </div>

          {/* CTA */}
          <Link
            href="/daily"
            className="inline-flex items-center gap-2 text-gold hover:text-gold-light font-body text-sm font-medium transition-colors group"
          >
            Read today's full devotional
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  )
}
