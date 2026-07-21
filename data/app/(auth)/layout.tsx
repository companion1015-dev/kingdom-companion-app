import Link from 'next/link'
import Image from 'next/image'

const verses = [
  { text: 'Come to me, all you who are weary and burdened, and I will give you rest.', ref: 'Matthew 11:28' },
  { text: 'Your word is a lamp for my feet, a light on my path.', ref: 'Psalm 119:105' },
  { text: 'For God so loved the world that he gave his one and only Son.', ref: 'John 3:16' },
]
const todayVerse = verses[new Date().getDate() % verses.length]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-cream">

      {/* Left — Scripture panel */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 flex-col justify-between p-12 bg-hero-gradient relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #C9A84C 0%, transparent 70%)' }}
        />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group relative z-10">
          <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-lg shadow-navy-dark/40 group-hover:shadow-gold/30 transition-shadow">
            <Image src="/images/logo.png" alt="Kingdom Companion" fill className="object-cover" sizes="48px" />
          </div>
          <div>
            <span className="block font-display text-lg font-semibold text-white">Kingdom Companion</span>
            <span className="text-xs text-gold/70 tracking-widest uppercase font-body">Growing Together in God's Kingdom</span>
          </div>
        </Link>

        {/* Daily verse */}
        <div className="relative z-10">
          <div className="absolute -top-8 -left-4 font-display text-[120px] leading-none text-white/05 select-none" aria-hidden>
            &ldquo;
          </div>
          <blockquote>
            <p className="font-display text-2xl xl:text-3xl font-light text-white leading-relaxed italic mb-4">
              &ldquo;{todayVerse.text}&rdquo;
            </p>
            <cite className="text-gold text-sm font-body font-medium not-italic">— {todayVerse.ref}</cite>
          </blockquote>
        </div>

        {/* Pillars from logo */}
        <div className="relative z-10 grid grid-cols-2 gap-x-8 gap-y-2">
          {['Always free', 'No advertisements', 'Scripture-centred', 'Your privacy protected'].map(item => (
            <span key={item} className="text-xs text-white/35 font-body flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-gold/40" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Right — Form panel */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16 xl:px-20">

        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-2.5 mb-10 lg:hidden">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-md">
            <Image src="/images/logo.png" alt="Kingdom Companion" fill className="object-cover" sizes="36px" />
          </div>
          <div>
            <span className="block font-display text-base font-semibold text-navy">Kingdom Companion</span>
            <span className="text-[9px] text-charcoal/40 tracking-widest uppercase font-body">Rooted in Truth · Built for Life</span>
          </div>
        </Link>

        <div className="max-w-[400px] w-full mx-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
