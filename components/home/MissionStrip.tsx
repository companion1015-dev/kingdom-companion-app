import Link from 'next/link'

export default function MissionStrip() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-navy relative overflow-hidden">
      {/* Background cross */}
      <div
        className="absolute inset-0 opacity-[0.025] flex items-center justify-center pointer-events-none select-none"
        aria-hidden="true"
      >
        <span className="font-display text-[400px] leading-none text-white">✝</span>
      </div>

      <div className="relative max-w-3xl mx-auto text-center">
        <p className="font-display text-xs tracking-[0.25em] uppercase text-gold/60 mb-4">Our Mission</p>
        <h2 className="font-display text-4xl sm:text-5xl font-light text-white leading-tight mb-6">
          A quiet place with<br />
          <span className="italic text-gold/90">God's Word</span>
        </h2>
        <p className="text-white/50 font-body text-base leading-relaxed mb-10 max-w-xl mx-auto">
          Kingdom Companion is a peaceful digital sanctuary — always free, Scripture-centred,
          and free from advertisements. No paywalls. No pressure. Just God's Word.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/bible"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gold hover:bg-gold-light text-navy font-body font-medium text-sm rounded-full transition-all duration-200 hover:scale-105"
          >
            📖 Open the Bible
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-white/20 hover:border-white/40 text-white hover:bg-white/8 font-body font-medium text-sm rounded-full transition-all duration-200"
          >
            Create free account
          </Link>
        </div>
      </div>
    </section>
  )
}
