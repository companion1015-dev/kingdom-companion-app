'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Send, Sparkles, RefreshCw, BookOpen, Copy, ChevronDown, WifiOff } from 'lucide-react'
import { emotions } from '@/data/mock'

type Message = {
  id:      string
  role:    'user' | 'assistant'
  content: string
  type?:   'crisis' | 'fallback' | 'streaming' | 'normal'
}

type ConversationType = 'General Questions' | 'Bible Study' | 'Prayer Assistant' | 'Devotional' | 'Character Study' | 'Topic Study'

const CONVERSATION_TYPES: ConversationType[] = [
  'General Questions', 'Bible Study', 'Prayer Assistant',
  'Devotional', 'Character Study', 'Topic Study',
]

// Parse markdown-like response into sections
function parseAIResponse(content: string) {
  const sections = {
    scriptures:    '',
    reflection:    '',
    encouragement: '',
    prayer:        '',
    nextStep:      '',
    disclaimer:    '',
    raw:           content,
  }

  const scriptureMatch    = content.match(/## Scriptures? for You\n([\s\S]*?)(?=\n## |\n\*This|$)/i)
  const reflectionMatch   = content.match(/## Reflection\n([\s\S]*?)(?=\n## |\n\*This|$)/i)
  const encourageMatch    = content.match(/## Encouragement\n([\s\S]*?)(?=\n## |\n\*This|$)/i)
  const prayerMatch       = content.match(/## Guided Prayer\n([\s\S]*?)(?=\n## |\n\*This|$)/i)
  const nextStepMatch     = content.match(/## Your Next Step\n([\s\S]*?)(?=\n## |\n\*This|$)/i)
  const disclaimerMatch   = content.match(/\*This reflection[\s\S]*?\*/i)

  if (scriptureMatch)  sections.scriptures    = scriptureMatch[1].trim()
  if (reflectionMatch) sections.reflection    = reflectionMatch[1].trim()
  if (encourageMatch)  sections.encouragement = encourageMatch[1].trim()
  if (prayerMatch)     sections.prayer        = prayerMatch[1].trim()
  if (nextStepMatch)   sections.nextStep      = nextStepMatch[1].trim()
  if (disclaimerMatch) sections.disclaimer    = disclaimerMatch[0]

  return sections
}

// Render text with basic markdown (bold, italic, verse quotes)
function RenderText({ text, className = '' }: { text: string; className?: string }) {
  const lines = text.split('\n').filter(Boolean)
  return (
    <div className={className}>
      {lines.map((line, i) => {
        // Bible verse format: **Reference** → gold bold
        if (line.startsWith('**') && line.includes('(') && line.includes(')') && line.endsWith('**')) {
          return <p key={i} className="text-gold font-body font-semibold text-sm mb-1 mt-3">{line.replace(/\*\*/g, '')}</p>
        }
        // Quoted verse text
        if (line.startsWith('"') && line.endsWith('"')) {
          return <p key={i} className="font-display italic text-navy text-base leading-relaxed mb-3 pl-3 border-l-2 border-gold/40">{line}</p>
        }
        // Bold text
        const boldParsed = line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
          j % 2 === 1 ? <strong key={j} className="font-semibold text-navy">{part}</strong> : part
        )
        return <p key={i} className="text-charcoal/70 font-body text-sm leading-relaxed mb-2">{boldParsed}</p>
      })}
    </div>
  )
}

// Section card for structured AI response
function ResponseSection({ icon, title, content, accent = false }: {
  icon: string; title: string; content: string; accent?: boolean
}) {
  const [expanded, setExpanded] = useState(true)
  if (!content) return null
  return (
    <div className={`rounded-2xl overflow-hidden mb-3 border ${accent ? 'border-gold/20 bg-gold/4' : 'border-navy/8 bg-white'}`}>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-lg">{icon}</span>
          <span className={`text-xs font-body font-semibold tracking-widest uppercase ${accent ? 'text-gold/80' : 'text-navy/50'}`}>{title}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-charcoal/30 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="px-5 pb-5">
          <RenderText text={content} />
        </div>
      )}
    </div>
  )
}

export default function AICompanion() {
  const [messages,   setMessages]  = useState<Message[]>([])
  const [input,      setInput]     = useState('')
  const [loading,    setLoading]   = useState(false)
  const [convType,   setConvType]  = useState<ConversationType>('General Questions')
  const [isOffline,  setIsOffline] = useState(false)
  const [toast,      setToast]     = useState<string | null>(null)
  const textareaRef  = useRef<HTMLTextAreaElement>(null)
  const bottomRef    = useRef<HTMLDivElement>(null)
  const abortRef     = useRef<AbortController | null>(null)

  useEffect(() => {
    setIsOffline(!navigator.onLine)
    const on  = () => setIsOffline(false)
    const off = () => setIsOffline(true)
    window.addEventListener('online',  on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const handleEmotionClick = (emotion: typeof emotions[0]) => {
    setInput(`I am feeling ${emotion.label.toLowerCase()} today.`)
    textareaRef.current?.focus()
  }

  const handleSubmit = useCallback(async () => {
    const message = input.trim()
    if (!message || loading) return
    if (isOffline) { showToast('AI requires an internet connection'); return }

    setInput('')
    setLoading(true)

    // Add user message
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: message }
    setMessages(prev => [...prev, userMsg])

    // Placeholder for streaming response
    const assistantId = `ai-${Date.now()}`
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', type: 'streaming' }])

    try {
      abortRef.current = new AbortController()

      const res = await fetch('/api/v1/ai/companion', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message, conversation_type: convType, translation: 'NIV' }),
        signal:  abortRef.current.signal,
      })

      if (!res.ok) throw new Error('Request failed')

      const contentType = res.headers.get('content-type') ?? ''

      // Non-streaming response (crisis, fallback, or JSON error)
      if (contentType.includes('application/json')) {
        const data = await res.json()
        setMessages(prev => prev.map(m =>
          m.id === assistantId
            ? { ...m, content: data.content ?? data.error ?? 'Something went wrong.', type: data.type ?? 'normal' }
            : m
        ))
        setLoading(false)
        return
      }

      // Stream response
      const reader  = res.body?.getReader()
      const decoder = new TextDecoder()
      let   full    = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          // Parse SSE data lines from Claude's streaming format
          const lines = chunk.split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const json = JSON.parse(line.slice(6))
                // Extract text delta from Claude streaming format
                if (json.type === 'content_block_delta' && json.delta?.type === 'text_delta') {
                  full += json.delta.text
                  setMessages(prev => prev.map(m =>
                    m.id === assistantId ? { ...m, content: full } : m
                  ))
                }
              } catch { /* skip malformed chunks */ }
            }
          }
        }
      }

      // Finalise message
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, type: 'normal' } : m
      ))

    } catch (error) {
      if ((error as Error).name === 'AbortError') return
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: 'Something went wrong. Please try again.', type: 'normal' }
          : m
      ))
    } finally {
      setLoading(false)
    }
  }, [input, loading, isOffline, convType])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
  }

  const handleCopy = (content: string) => {
    navigator.clipboard?.writeText(content).then(() => showToast('Copied to clipboard'))
  }

  const handleReset = () => {
    abortRef.current?.abort()
    setMessages([])
    setInput('')
    setLoading(false)
  }

  const isEmptyState = messages.length === 0

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-navy/8 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-sm shrink-0">
              <Image src="/images/logo.png" alt="" fill className="object-cover" sizes="36px" />
            </div>
            <div>
              <h1 className="font-display text-base font-semibold text-navy leading-tight">AI Spiritual Companion</h1>
              <p className="text-xs text-charcoal/40 font-body">Scripture-centred guidance</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Conversation type selector */}
            <div className="relative hidden sm:block">
              <select
                value={convType}
                onChange={e => setConvType(e.target.value as ConversationType)}
                className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border border-navy/12 bg-navy/4 text-navy/60 text-xs font-body outline-none focus:ring-2 focus:ring-gold/30 cursor-pointer"
              >
                {CONVERSATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-navy/40 pointer-events-none" />
            </div>
            {messages.length > 0 && (
              <button
                onClick={handleReset}
                className="p-2 text-charcoal/40 hover:text-navy rounded-lg hover:bg-navy/5 transition-colors"
                aria-label="New conversation"
                title="Start new conversation"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Offline banner */}
      {isOffline && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2.5 flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5 text-amber-600" />
          <p className="text-xs font-body text-amber-700">AI features require an internet connection.</p>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 pb-48">

          {/* Empty state */}
          {isEmptyState && (
            <div className="text-center mb-8">
              {/* Hero */}
              <div className="relative w-20 h-20 rounded-3xl overflow-hidden mx-auto mb-5 shadow-lg"
                style={{ boxShadow: '0 8px 32px rgba(201,168,76,0.2)' }}>
                <Image src="/images/logo.png" alt="Kingdom Companion" fill className="object-cover" sizes="80px" />
              </div>
              <h2 className="font-display text-2xl font-light text-navy mb-2">
                How are you feeling today?
              </h2>
              <p className="text-charcoal/50 font-body text-sm mb-8 max-w-sm mx-auto leading-relaxed">
                Share what&rsquo;s on your heart and receive Scripture, reflection, and prayer — grounded in God&rsquo;s Word.
              </p>

              {/* Emotion chips */}
              <div className="flex flex-wrap gap-2 justify-center mb-6 max-w-lg mx-auto">
                {emotions.slice(0, 10).map(emotion => (
                  <button
                    key={emotion.id}
                    onClick={() => handleEmotionClick(emotion)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-body transition-all hover:scale-105 bg-gradient-to-r ${emotion.color} ${emotion.border} text-charcoal/70 hover:text-navy`}
                  >
                    <span>{emotion.icon}</span>
                    <span>{emotion.label}</span>
                  </button>
                ))}
              </div>

              {/* Example prompts */}
              <div className="grid sm:grid-cols-2 gap-2 max-w-lg mx-auto text-left">
                {[
                  { prompt: "I feel anxious about tomorrow.", icon: "🌊" },
                  { prompt: "I don't know how to forgive someone.", icon: "🤝" },
                  { prompt: "What does the Bible say about fear?", icon: "📖" },
                  { prompt: "Please help me pray for my marriage.", icon: "🙏" },
                ].map(({ prompt, icon }) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="flex items-start gap-2.5 p-3.5 rounded-xl border border-navy/8 hover:border-gold/30 bg-cream hover:bg-gold/4 text-left transition-all group"
                  >
                    <span className="text-base mt-0.5">{icon}</span>
                    <span className="text-xs font-body text-charcoal/60 group-hover:text-navy leading-relaxed">{prompt}</span>
                  </button>
                ))}
              </div>

              {/* Safety note */}
              <p className="text-xs text-charcoal/30 font-body mt-8 max-w-sm mx-auto leading-relaxed italic">
                The AI Companion provides Scripture-based reflection. It does not replace pastoral care, counselling, or medical advice.
              </p>
            </div>
          )}

          {/* Message thread */}
          {messages.map(message => (
            <div key={message.id} className={`mb-6 ${message.role === 'user' ? 'flex justify-end' : ''}`}>

              {/* User message */}
              {message.role === 'user' && (
                <div className="max-w-sm">
                  <div className="bg-navy text-white px-4 py-3 rounded-2xl rounded-tr-sm font-body text-sm leading-relaxed">
                    {message.content}
                  </div>
                </div>
              )}

              {/* AI response */}
              {message.role === 'assistant' && (
                <div className="w-full">
                  {/* Streaming indicator */}
                  {message.type === 'streaming' && !message.content && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-cream rounded-2xl border border-navy/8 w-fit">
                      <div className="flex gap-1">
                        {[0,1,2].map(i => (
                          <div key={i} className="w-2 h-2 rounded-full bg-navy/30 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                      <span className="text-xs text-charcoal/40 font-body">Finding Scripture…</span>
                    </div>
                  )}

                  {/* Streaming content (raw text while streaming) */}
                  {message.type === 'streaming' && message.content && (
                    <div className="bg-cream rounded-2xl border border-navy/8 p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-3.5 h-3.5 text-gold animate-pulse" />
                        <span className="text-xs text-gold font-body font-medium">Receiving Scripture…</span>
                      </div>
                      <p className="text-sm text-charcoal/70 font-body leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    </div>
                  )}

                  {/* Crisis response */}
                  {message.type === 'crisis' && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">❤️</span>
                        <span className="text-sm font-body font-semibold text-red-700">You are not alone</span>
                      </div>
                      <RenderText text={message.content} className="text-red-900" />
                    </div>
                  )}

                  {/* Complete structured response */}
                  {(message.type === 'normal' || message.type === 'fallback') && message.content && (
                    <div className="space-y-1">
                      {/* AI source label */}
                      <div className="flex items-center gap-1.5 mb-3">
                        <div className="relative w-5 h-5 rounded-md overflow-hidden">
                          <Image src="/images/logo.png" alt="" fill className="object-cover" sizes="20px" />
                        </div>
                        <span className="text-xs text-charcoal/35 font-body">AI Spiritual Companion</span>
                        <span className="text-xs text-charcoal/20 font-body">·</span>
                        <span className="text-xs text-charcoal/30 font-body">Always verify with Scripture</span>
                      </div>

                      {(() => {
                        const parsed = parseAIResponse(message.content)
                        const hasStructure = parsed.scriptures || parsed.reflection

                        if (!hasStructure) {
                          // Plain text fallback
                          return (
                            <div className="bg-cream rounded-2xl border border-navy/8 p-5">
                              <RenderText text={message.content} />
                            </div>
                          )
                        }

                        return (
                          <>
                            <ResponseSection icon="📖" title="Scriptures for You" content={parsed.scriptures} accent />
                            <ResponseSection icon="✍️" title="Reflection"         content={parsed.reflection} />
                            <ResponseSection icon="💛" title="Encouragement"      content={parsed.encouragement} />
                            <ResponseSection icon="🙏" title="Guided Prayer"      content={parsed.prayer} accent />
                            <ResponseSection icon="👣" title="Your Next Step"     content={parsed.nextStep} />

                            {/* Actions */}
                            <div className="flex items-center gap-3 mt-2 px-1">
                              <button
                                onClick={() => handleCopy(message.content)}
                                className="flex items-center gap-1.5 text-xs text-charcoal/35 hover:text-navy font-body transition-colors"
                              >
                                <Copy className="w-3 h-3" /> Copy
                              </button>
                              <a href="/bible" className="flex items-center gap-1.5 text-xs text-charcoal/35 hover:text-gold font-body transition-colors">
                                <BookOpen className="w-3 h-3" /> Open Bible
                              </a>
                              <span className="flex-1" />
                              {parsed.disclaimer && (
                                <p className="text-[10px] text-charcoal/25 font-body italic">{parsed.disclaimer}</p>
                              )}
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area — sticky bottom */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-navy/8 shadow-lg shadow-navy/4">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div
            className="rounded-2xl border transition-all duration-200"
            style={{
              border:  '1px solid rgba(201,168,76,0.25)',
              background: 'rgba(250,247,242,0.8)',
              boxShadow: '0 0 20px rgba(201,168,76,0.08)',
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="How are you feeling? What's on your heart? Ask about Scripture, request prayer…"
              rows={3}
              className="w-full bg-transparent px-4 pt-3.5 pb-2 text-navy font-body text-sm resize-none outline-none placeholder-charcoal/30 leading-relaxed"
              style={{ caretColor: '#C9A84C' }}
              disabled={loading || isOffline}
            />
            <div className="flex items-center justify-between px-4 pb-3">
              <span className="text-xs text-charcoal/25 font-body">⌘ + Enter to send</span>
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || loading || isOffline}
                className={`
                  flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-body font-semibold transition-all duration-200
                  ${input.trim() && !loading && !isOffline
                    ? 'bg-navy hover:bg-navy-light text-white shadow-md shadow-navy/20 hover:scale-105'
                    : 'bg-charcoal/8 text-charcoal/30 cursor-not-allowed'
                  }
                `}
              >
                {loading
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Sparkles className="w-4 h-4" />
                }
                {loading ? 'Finding Scripture…' : 'Receive Encouragement'}
              </button>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-4 mt-2.5">
            {['Scripture-first', 'AI-assisted reflection', 'Never replaces the Bible'].map(item => (
              <span key={item} className="text-[10px] text-charcoal/25 font-body flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-gold/30" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-36 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-navy text-white text-sm font-body font-medium rounded-full shadow-xl animate-fade-in" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}