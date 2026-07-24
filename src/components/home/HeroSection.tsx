'use client'
import { useState, useRef } from 'react'
import { ArrowRight, Sparkles, BookOpen } from 'lucide-react'
import { dailyVerse, emotions } from '@/data/mock'

export default function HeroSection() {
  const [input, setInput]       = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleEmotionClick = (id: string) => {
    setSelected(id)
    const emotion = emotions.find(e => e.id === id)
    if (emotion) {
      setInput(`I am feeling ${emotion.label.toLowerCase()} today.`)
      inputRef.current?.focus()
    }
  }

  const handleSubmit = async () => {
    if (!input.trim()) return
    setLoading(true)
    // Placeholder — will connect to /api/v1/ai/companion
    await new Promise(r => setTimeout(r, 800))
    setLoading(false)
    alert('AI Companion coming in Phase 3. For now, your input has been received.')
  }

  return (
    <section
      className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-hero-gradient"
      aria-labelledby="hero-heading"
    >
      {/* Subtle background texture */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}
      />

      {/* Gold gradient orb — signature design element */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.06]"
        style={{ background: 'radial-gradient(circle, #C9A84C 0%, transparent 70%)' }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 w-full">

        {/* Daily verse badge */}
        <div className="flex justify-center mb-10 animate-fade-in">
          <a
            href="/bible"
            className="inline-flex items-center gap-2.5 glass rounded-full px-5 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/12 transition-all group"
          >
            <BookOpen className="w-3.5 h-3.5 text-gold" />
            <span className="font-display italic text-white/70">&ldquo;{dailyVerse.text.slice(0, 55)}…&rdquo;</span>
            <span className="text-gold/80 text-xs font-body">{dailyVerse.reference}</span>
            <ArrowRight className="w-3.5 h-3.5 text-white/40 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>

        {/* Primary heading */}
        <div className="text-center mb-4 animate-slide-up" style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}>
          <h1 id="hero-heading" className="font-display text-5xl sm:text-6xl lg:text-7xl font-light text-white leading-tight tracking-wide">
            How are you feeling
            <span className="block italic font-light gold-text">today?</span>
          </h1>
        </div>

        <p className="text-center text-white/55 font-body text-base sm:text-lg mb-10 animate-slide-up" style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}>
          Share what's on your heart — receive Scripture, reflection, and prayer.
        </p>

        {/* Emotion input card — signature element */}
        <div
          className="rounded-2xl p-6 sm:p-8 animate-glow-pulse animate-slide-up mb-8"
          style={{
            animationDelay: '0.3s',
            animationFillMode: 'forwards',
            background: 'rgba(255,255,255,0.07)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(201,168,76,0.20)',
            boxShadow: '0 8px 48px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          {/* Emotion chips */}
          <div className="flex flex-wrap gap-2 mb-5">
            {emotions.map(emotion => (
              <button
                key={emotion.id}
                onClick={() => handleEmotionClick(emotion.id)}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body transition-all duration-200
                  border bg-gradient-to-r ${emotion.color} ${emotion.border}
                  ${selected === emotion.id
                    ? 'text-white border-gold/60 ring-1 ring-gold/40 scale-105'
                    : 'text-white/70 hover:text-white hover:scale-105 hover:border-white/30'
                  }
                `}
                aria-pressed={selected === emotion.id}
              >
                <span>{emotion.icon}</span>
                <span>{emotion.label}</span>
              </button>
            ))}
          </div>

          {/* Text input */}
          <div className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Or describe what you're going through in your own words… I feel anxious about tomorrow. I don't know what to pray. My heart is heavy."
              rows={3}
              className="w-full bg-transparent text-white placeholder-white/30 font-body text-sm resize-none border-0 outline-none leading-relaxed"
              style={{ caretColor: '#C9A84C' }}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit() }}
            />
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
              <span className="text-xs text-white/25 font-body">⌘ + Enter to send</span>
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || loading}
                className={`
                  inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200
                  ${input.trim() && !loading
                    ? 'bg-gold hover:bg-gold-light text-navy shadow-lg shadow-gold/20 hover:scale-105'
                    : 'bg-white/10 text-white/30 cursor-not-allowed'
                  }
                `}
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {loading ? 'Finding Scripture…' : 'Receive encouragement'}
              </button>
            </div>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 animate-fade-in" style={{ animationDelay: '0.5s', opacity: 0, animationFillMode: 'forwards' }}>
          {['Always free', 'No account required', 'Scripture-centred', 'No advertisements'].map(item => (
            <span key={item} className="text-xs text-white/35 font-body flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-gold/50 inline-block" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-30">
        <div className="w-5 h-8 rounded-full border border-white/30 flex items-start justify-center pt-1.5">
          <div className="w-1 h-2 rounded-full bg-white/60" />
        </div>
      </div>
    </section>
  )
}
