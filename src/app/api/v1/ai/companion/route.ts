import { NextRequest } from 'next/server'
import {
  BIBLE_COMPANION_SYSTEM_PROMPT, CONVERSATION_PROMPTS,
  detectCrisis, isSafeInput,
} from '@/modules/ai/prompts/system-prompt'
import { checkRateLimit, RATE_LIMITS, getRateLimitKey } from '@/lib/auth/rate-limit'
import { AiChatSchema } from '@/lib/validation/schemas'
import { verifyAccessToken } from '@/lib/auth/service'
import { prisma } from '@/lib/db/client'
import { z } from 'zod'


const MODEL = 'claude-sonnet-5'

const CRISIS_RESPONSE = `
I want you to know that you are deeply valued and not alone in this moment.

**Please reach out right now:**
- 🇬🇧 **Samaritans (UK):** 116 123 (free, 24/7)
- 🇺🇸 **988 Lifeline (US):** Call or text 988
- 🌍 **International:** [findahelpline.com](https://findahelpline.com)

**Scripture for this moment:**
**Psalm 34:18 (NIV)**
"The Lord is close to the brokenhearted and saves those who are crushed in spirit."

**Matthew 11:28 (NIV)**
"Come to me, all you who are weary and burdened, and I will give you rest."

God sees you in this moment. Please speak with someone who can help — a pastor, counsellor, or crisis line. You matter immensely.

*If you are in immediate danger, please call emergency services (999 in UK, 911 in US) now.*
`

type HistoryTurn = { role: 'user' | 'assistant'; content: string }

async function getAuthedUserId(req: NextRequest): Promise<string | null> {
  try {
    const authHeader  = req.headers.get('authorization')
    const cookieToken = req.cookies.get('access_token')?.value
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken
    if (!token) return null
    const payload = verifyAccessToken(token)
    return payload.type === 'access' ? payload.sub : null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const rateKey = getRateLimitKey('ai-companion', ip)
  const { allowed, retryAfter } = checkRateLimit(rateKey, RATE_LIMITS.AI)
  if (!allowed) {
    return new Response(
      JSON.stringify({ error: `Rate limit reached. Please wait ${retryAfter} seconds.` }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    )
  }

try {
    const body      = await req.json()
    const validated = AiChatSchema.parse(body)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clientHistory: HistoryTurn[] = Array.isArray((body as any).history) ? (body as any).history.slice(-20) : []

    if (!isSafeInput(validated.message)) {
      return new Response(JSON.stringify({ error: 'Input contains disallowed content.' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    if (detectCrisis(validated.message)) {
      return new Response(JSON.stringify({ type: 'crisis', content: CRISIS_RESPONSE }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }

    const userId = await getAuthedUserId(req)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any

    let conversationId = validated.conversation_id ?? null
    let priorTurns: HistoryTurn[] = clientHistory

    if (userId) {
      if (!conversationId) {
        const created = await db.aiConversation.create({
          data: { user_id: userId, conversation_type: validated.conversation_type, title: null },
          select: { id: true },
        })
        conversationId = created.id
      } else {
        const convo = await db.aiConversation.findUnique({ where: { id: conversationId }, select: { user_id: true } })
        if (!convo || convo.user_id !== userId) conversationId = null
      }
      if (conversationId) {
        const existing = await db.aiMessage.findMany({
          where: { conversation_id: conversationId },
          orderBy: { created_at: 'asc' },
          select: { sender: true, message: true },
        })
        priorTurns = existing
          .filter((m: { sender: string }) => m.sender === 'user' || m.sender === 'assistant')
          .map((m: { sender: string; message: string }) => ({ role: m.sender as 'user' | 'assistant', content: m.message }))

        await db.aiMessage.create({ data: { conversation_id: conversationId, sender: 'user', message: validated.message } })

        if (priorTurns.length === 0) {
          await db.aiConversation.update({
            where: { id: conversationId },
            data:  { title: validated.message.slice(0, 80) },
          })
        }
      }
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ type: 'fallback', content: generateFallbackResponse(validated.message), conversation_id: conversationId }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const systemPrompt = CONVERSATION_PROMPTS[validated.conversation_type] ?? BIBLE_COMPANION_SYSTEM_PROMPT
    const messages = [...priorTurns, { role: 'user' as const, content: validated.message }]
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model: MODEL, max_tokens: 2000, system: systemPrompt, messages, stream: true }),
    })

    if (!claudeResponse.ok || !claudeResponse.body) {
      const err = await claudeResponse.text()
      console.error('[AI Companion] Claude API error:', err)
      return new Response(
        JSON.stringify({ type: 'fallback', content: generateFallbackResponse(validated.message), conversation_id: conversationId }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const decoder = new TextDecoder()
    let fullText   = ''
    let lineBuffer = ''
    const convoIdForSave = conversationId

    const transform = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        controller.enqueue(chunk)
        lineBuffer += decoder.decode(chunk, { stream: true })
        const lines = lineBuffer.split('\n')
        lineBuffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const json = JSON.parse(line.slice(6))
            if (json.type === 'content_block_delta' && json.delta?.type === 'text_delta') {
              fullText += json.delta.text
            }
          } catch { /* partial/non-JSON line -- ignore */ }
        }
      },
      async flush() {
        if (convoIdForSave && fullText.trim()) {
          try {
            await db.aiMessage.create({ data: { conversation_id: convoIdForSave, sender: 'assistant', message: fullText } })
            await db.aiConversation.update({ where: { id: convoIdForSave }, data: { updated_at: new Date() } })
          } catch (e) {
            console.error('[AI Companion] Failed to save assistant message:', e)
          }
        }
      },
    })

    const stream = claudeResponse.body.pipeThrough(transform)
    return new Response(stream, {
      headers: {
        'Content-Type':          'text/event-stream',
        'Cache-Control':         'no-cache',
        'Connection':            'keep-alive',
        'X-Conversation-Id':     conversationId ?? '',
      },
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: 'Invalid request.' }), { status: 422, headers: { 'Content-Type': 'application/json' } })
    }
    console.error('[AI Companion] Error:', error)
    return new Response(JSON.stringify({ error: 'Something went wrong. Please try again.' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}

function generateFallbackResponse(input: string): string {
  const lower = input.toLowerCase()

  if (lower.includes('anxious') || lower.includes('worried') || lower.includes('fear')) {
    return `## Scriptures for You

**Philippians 4:6-7 (NIV)**
"Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus."

**Matthew 6:34 (NIV)**
"Therefore do not worry about tomorrow, for tomorrow will worry about itself. Each day has enough trouble of its own."

**Isaiah 41:10 (NIV)**
"So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand."

## Reflection

God's Word speaks powerfully to anxiety. In Philippians 4, Paul — writing from prison — teaches us that peace is not the absence of trouble but the presence of God in the midst of it. The instruction is beautifully practical: bring everything to God in prayer, with a heart of thanksgiving even for what He has already done.

Jesus Himself addresses worry in Matthew 6, reminding us that the God who clothes the lilies and feeds the sparrows cares infinitely more for you. Your anxieties are not too small for God's attention, nor too large for His power.

## Encouragement

Whatever is weighing on your heart today, you are not carrying it alone. God invites you to cast every care upon Him — not because your concerns don't matter, but because they matter deeply to Him. The peace He promises is a peace that passes all understanding.

## Guided Prayer

Heavenly Father, I come to You today with a heavy heart. You know every detail of what I am facing. I choose to trust You with this — not because I have all the answers, but because You are faithful. Give me Your peace that surpasses understanding. Guard my heart and my mind in Christ Jesus. Help me to take one step at a time, trusting You for each one. Amen.

## Your Next Step

Spend five quiet minutes reading Philippians 4:4-13. Let each verse sink in slowly. Consider writing down one thing you are grateful for today.

*This reflection is AI-generated to support your time with Scripture. It is not a substitute for the Bible, pastoral care, or professional support.*`
  }

  return `## Scriptures for You

**Psalm 46:1 (NIV)**
"God is our refuge and strength, an ever-present help in trouble."

**Jeremiah 29:11 (NIV)**
"For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future."

**Romans 8:28 (NIV)**
"And we know that in all things God works for the good of those who love him, who have been called according to his purpose."

## Reflection

Whatever you are carrying today, God's Word speaks directly into it. The Psalms remind us that God is not distant from our struggles — He is an ever-present help, closer than our very breath. The promise in Jeremiah was spoken to people in exile, in one of the darkest chapters of Israel's history, yet God's plans for them remained good. His plans for you are no different.

## Encouragement

You are seen. You are known. You are loved by the God who hung the stars and yet knows the number of hairs on your head. Bring whatever is on your heart to Him honestly — He can handle it.

## Guided Prayer

Lord, I come to You just as I am. You know everything I am carrying today. Help me to trust that You are working, even in the things I cannot see. Be my refuge and my strength. Give me grace for today and hope for tomorrow. In Jesus' name, Amen.

## Your Next Step

Open the Bible to Psalm 46 and read it slowly from beginning to end. Notice every place where God is described as present and active.

*This reflection is AI-generated to support your time with Scripture. It is not a substitute for the Bible, pastoral care, or professional support.*`
}
