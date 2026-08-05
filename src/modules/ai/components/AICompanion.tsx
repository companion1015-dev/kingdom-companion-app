'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Send, Sparkles, RefreshCw, BookOpen, Copy, ChevronDown, WifiOff, History, Plus, Trash2, X } from 'lucide-react'
import { emotions } from '@/data/mock'

type Message = {
  id:      string
  role:    'user' | 'assistant'
  content: string
  type?:   'crisis' | 'fallback' | 'streaming' | 'normal'
}

type Conversation = {
  id: string
  title: string | null
  conversation_type: string
  created_at: string
  updated_at: string
  message_count?: number
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
          return <p key={i} className="font-display italic text-navy dark:text-cream text-base leading-relaxed mb-3 pl-3 border-l-2 border-gold/40">{line}</p>
        }
        // Bold text
        const boldParsed = line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
          j % 2 === 1 ? <strong key={j} className="font-semibold text-navy dark:text-cream">{part}</strong> : part
        )
        return <p key={i} className="text-charcoal/70 dark:text-cream/70 font-body text-sm leading-relaxed mb-2">{boldParsed}</p>
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
    <div className={`rounded-2xl overflow-hidden mb-3 border ${accent ? 'border-gold/20 bg-gold/4' : 'border-navy/8 bg-white dark:bg-navy-dark'}`}>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-lg">{icon}</span>
          <span className={`text-xs font-body font-semibold tracking-widest uppercase ${accent ? 'text-gold/80' : 'text-navy/50 dark:text-cream/50'}`}>{title}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-charcoal/30 dark:text-cream/30 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="px-5 pb-5">
          <RenderText text={content} />
        </div>
      )}
    </div>
  )
}

function groupConversationsByDate(conversations: Conversation[]): { label: string; items: Conversation[] }[] {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000)
  const sevenDaysAgo = new Date(startOfToday.getTime() - 7 * 86400000)

  const groups: Record<string, Conversation[]> = { Today: [], Yesterday: [], 'Previous 7 Days': [], Older: [] }
  for (const c of conversations) {
    const updated = new Date(c.updated_at)
    if (updated >= startOfToday) groups.Today.push(c)
    else if (updated >= startOfYesterday) groups.Yesterday.push(c)
    else if (updated >= sevenDaysAgo) groups['Previous 7 Days'].push(c)
    else groups.Older.push(c)
  }
  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }))
}

export default function AICompanion() {
  const [messages,   setMessages]  = useState<Message[]>([])
  const [input,      setInput]     = useState('')
  const [loading,    setLoading]   = useState(false)
  const [convType,   setConvType]  = useState<ConversationType>('General Questions')
  const [isOffline,  setIsOffline] = useState(false)
  const [toast,      setToast]     = useState<string | null>(null)
  // Conversation history sidebar -- real persistence, only available when
  // signed in (guests keep the existing single-session, un-persisted chat).
  const [authed,          setAuthed]          = useState(false)
  const [conversations,   setConversations]   = useState<Conversation[]>([])
  const [activeConvoId,   setActiveConvoId]   = useState<string | null>(null)
  const [showSidebar,     setShowSidebar]     = useState(false)
  const [loadingConvo,    setLoadingConvo]    = useState(false)
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

  // Pre-fill from a homepage handoff (e.g. the emotion selector on "/" now
  // genuinely routes here with the chosen feeling, instead of the old
  // alert() placeholder). Left for the user to review and send themselves
  // rather than auto-submitting on their behalf.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const prefill = params.get('message')
    if (prefill) {
      setInput(prefill)
      textareaRef.current?.focus()
      window.history.replaceState({}, '', window.location.pathname)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/ai/conversations', { credentials: 'include' })
      if (res.status === 401) { setAuthed(false); return }
      const data = await res.json()
      if (data.success) { setAuthed(true); setConversations(data.data) }
    } catch { /* stay in guest mode on any network failure */ }
  }, [])

  useEffect(() => { loadConversations() }, [loadConversations])

  const selectConversation = async (id: string) => {
    setLoadingConvo(true)
    try {
      const res  = await fetch(`/api/v1/ai/conversations/${id}`, { credentials: 'include' })
      const data = await res.json()
      if (data.success) {
        setActiveConvoId(id)
        setMessages(data.data.messages.map((m: { id: string; sender: string; message: string }) => ({
          id: m.id, role: m.sender === 'user' ? 'user' : 'assistant', content: m.message, type: 'normal',
        })))
        setShowSidebar(false)
      }
    } catch { showToast('Unable to load that conversation') }
    finally { setLoadingConvo(false) }
  }

  const startNewConversation = () => {
    setActiveConvoId(null)
    setMessages([])
    setInput('')
    setShowSidebar(false)
  }

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this conversation? This cannot be undone.')) return
    try {
      await fetch(`/api/v1/ai/conversations/${id}`, { method: 'DELETE', credentials: 'include' })
      setConversations(prev => prev.filter(c => c.id !== id))
      if (activeConvoId === id) startNewConversation()
    } catch { showToast('Unable to delete conversation') }
  }

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
        body:    JSON.stringify({
          message, conversation_type: convType, translation: 'BSB',
          conversation_id: activeConvoId ?? undefined,
          history: authed ? undefined : messages
            .filter(m => m.type !== 'streaming')
            .map(m => ({ role: m.role, content: m.content })),
        }),
        signal:  abortRef.current.signal,
      })

      const returnedConvoId = res.headers.get('X-Conversation-Id')
      if (returnedConvoId && returnedConvoId !== activeConvoId) {
        setActiveConvoId(returnedConvoId)
        if (authed) loadConversations()
      }

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
    setActiveConvoId(null)
  }

  const isEmptyState = messages.length === 0

  return (
    <div className="min-h-screen bg-white dark:bg-navy-dark flex flex-col">

      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-navy-dark backdrop-blur-md border-b border-navy/8 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-sm shrink-0">
              <Image src="/images/logo.png" alt="" fill className="object-cover" sizes="36px" />
            </div>
            <div>
              <h1 className="font-display text-base font-semibold text-navy dark:text-cream leading-tight">AI Spiritual Companion</h1>
              <p className="text-xs text-charcoal/40 dark:text-cream/40 font-body">Scripture-centred guidance</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {authed && (
              <button
                onClick={() => setShowSidebar(true)}
                className="p-2 text-charcoal/40 dark:text-cream/40 hover:text-navy dark:text-cream rounded-lg hover:bg-navy/5 transition-colors"
                aria-label="Conversation history"
                title="Conversation history"
              >
                <History className="w-4 h-4" />
              </button>
            )}
            {/* Conversation type selector */}
            <div className="relative hidden sm:block">
              <select
                value={convType}
                onChange={e => setConvType(e.target.value as ConversationType)}
                className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border border-navy/12 bg-navy/4 text-navy/60 dark:text-cream/60 text-xs font-body outline-none focus:ring-2 focus:ring-gold/30 cursor-pointer"
              >
                {CONVERSATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-navy/40 dark:text-cream/40 pointer-events-none" />
            </div>
            {messages.length > 0 && (
              <button
                onClick={handleReset}
                className="p-2 text-charcoal/40 dark:text-cream/40 hover:text-navy dark:text-cream rounded-lg hover:bg-navy/5 transition-colors"
                aria-label="New conversation"
                title="Start new conversation"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {showSidebar && (
        <>
          <div className="fixed inset-0 z-40 bg-navy/20 backdrop-blur-sm" onClick={() => setShowSidebar(false)} />
          <div className="fixed left-0 top-0 bottom-0 z-50 w-80 max-w-[85vw] bg-white dark:bg-navy-dark shadow-2xl shadow-navy/20 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-navy/8">
              <h2 className="font-display text-base font-semibold text-navy dark:text-cream">Conversations</h2>
              <button onClick={() => setShowSidebar(false)} className="p-2 text-charcoal/40 dark:text-cream/40 hover:text-navy dark:text-cream rounded-lg hover:bg-navy/5" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3">
              <button
                onClick={startNewConversation}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-navy hover:bg-navy-light text-white text-sm font-body font-semibold transition-all"
              >
                <Plus className="w-4 h-4" /> New Conversation
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-4">
              {conversations.length === 0 && (
                <p className="text-xs text-charcoal/35 dark:text-cream/35 font-body text-center py-8">No conversations yet</p>
              )}
              {groupConversationsByDate(conversations).map(group => (
                <div key={group.label} className="mb-4">
                  <p className="text-xs font-body font-semibold text-charcoal/35 dark:text-cream/35 tracking-wider uppercase px-2 mb-1.5">{group.label}</p>
                  {group.items.map(c => (
                    <button
                      key={c.id}
                      onClick={() => selectConversation(c.id)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left transition-colors group ${activeConvoId === c.id ? 'bg-navy/8' : 'hover:bg-navy/4'}`}
                    >
                      <span className="text-sm font-body text-navy/75 dark:text-cream/75 truncate">{c.title ?? 'New Conversation'}</span>
                      <span
                        onClick={e => deleteConversation(c.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-charcoal/30 dark:text-cream/30 hover:text-red-500 transition-all shrink-0"
                        role="button"
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

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
              <h2 className="font-display text-2xl font-light text-navy dark:text-cream mb-2">
                How are you feeling today?
              </h2>
              <p className="text-charcoal/50 dark:text-cream/50 font-body text-sm mb-8 max-w-sm mx-auto leading-relaxed">
                Share what&rsquo;s on your heart and receive Scripture, reflection, and prayer — grounded in God&rsquo;s Word.
              </p>

              {/* Emotion chips */}
              <div className="flex flex-wrap gap-2 justify-center mb-6 max-w-lg mx-auto">
                {emotions.slice(0, 10).map(emotion => (
                  <button
                    key={emotion.id}
                    onClick={() => handleEmotionClick(emotion)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-body transition-all hover:scale-105 bg-gradient-to-r ${emotion.color} ${emotion.border} text-charcoal/70 dark:text-cream/70 hover:text-navy dark:text-cream`}
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
                    className="flex items-start gap-2.5 p-3.5 rounded-xl border border-navy/8 hover:border-gold/30 bg-cream dark:bg-navy-dark hover:bg-gold/4 text-left transition-all group"
                  >
                    <span className="text-base mt-0.5">{icon}</span>
                    <span className="text-xs font-body text-charcoal/60 dark:text-cream/60 group-hover:text-navy dark:text-cream leading-relaxed">{prompt}</span>
                  </button>
                ))}
              </div>

              {/* Safety note */}
              <p className="text-xs text-charcoal/30 dark:text-cream/30 font-body mt-8 max-w-sm mx-auto leading-relaxed italic">
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
                    <div className="flex items-center gap-2 px-4 py-3 bg-cream dark:bg-navy-dark rounded-2xl border border-navy/8 w-fit">
                      <div className="flex gap-1">
                        {[0,1,2].map(i => (
                          <div key={i} className="w-2 h-2 rounded-full bg-navy/30 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                      <span className="text-xs text-charcoal/40 dark:text-cream/40 font-body">Finding Scripture…</span>
                    </div>
                  )}

                  {/* Streaming content (raw text while streaming) */}
                  {message.type === 'streaming' && message.content && (
                    <div className="bg-cream dark:bg-navy-dark rounded-2xl border border-navy/8 p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-3.5 h-3.5 text-gold animate-pulse" />
                        <span className="text-xs text-gold font-body font-medium">Receiving Scripture…</span>
                      </div>
                      <p className="text-sm text-charcoal/70 dark:text-cream/70 font-body leading-relaxed whitespace-pre-wrap">{message.content}</p>
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
                        <span className="text-xs text-charcoal/35 dark:text-cream/35 font-body">AI Spiritual Companion</span>
                        <span className="text-xs text-charcoal/20 dark:text-cream/20 font-body">·</span>
                        <span className="text-xs text-charcoal/30 dark:text-cream/30 font-body">Always verify with Scripture</span>
                      </div>

                      {(() => {
                        const parsed = parseAIResponse(message.content)
                        const hasStructure = parsed.scriptures || parsed.reflection

                        if (!hasStructure) {
                          // Plain text fallback
                          return (
                            <div className="bg-cream dark:bg-navy-dark rounded-2xl border border-navy/8 p-5">
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
                                className="flex items-center gap-1.5 text-xs text-charcoal/35 dark:text-cream/35 hover:text-navy dark:text-cream font-body transition-colors"
                              >
                                <Copy className="w-3 h-3" /> Copy
                              </button>
                              <a href="/bible" className="flex items-center gap-1.5 text-xs text-charcoal/35 dark:text-cream/35 hover:text-gold font-body transition-colors">
                                <BookOpen className="w-3 h-3" /> Open Bible
                              </a>
                              <span className="flex-1" />
                              {parsed.disclaimer && (
                                <p className="text-[10px] text-charcoal/25 dark:text-cream/25 font-body italic">{parsed.disclaimer}</p>
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
      <div className="sticky bottom-0 bg-white/95 dark:bg-navy-dark backdrop-blur-md border-t border-navy/8 shadow-lg shadow-navy/4">
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
              className="w-full bg-transparent px-4 pt-3.5 pb-2 text-navy dark:text-cream font-body text-sm resize-none outline-none placeholder-charcoal/30 leading-relaxed"
              style={{ caretColor: '#C9A84C' }}
              disabled={loading || isOffline}
            />
            <div className="flex items-center justify-between px-4 pb-3">
              <span className="text-xs text-charcoal/25 dark:text-cream/25 font-body">⌘ + Enter to send</span>
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || loading || isOffline}
                className={`
                  flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-body font-semibold transition-all duration-200
                  ${input.trim() && !loading && !isOffline
                    ? 'bg-navy hover:bg-navy-light text-white shadow-md shadow-navy/20 hover:scale-105'
                    : 'bg-charcoal/8 text-charcoal/30 dark:text-cream/30 cursor-not-allowed'
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
              <span key={item} className="text-[10px] text-charcoal/25 dark:text-cream/25 font-body flex items-center gap-1">
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