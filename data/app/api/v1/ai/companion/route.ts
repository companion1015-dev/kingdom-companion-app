import { NextRequest } from 'next/server'
import {
  BIBLE_COMPANION_SYSTEM_PROMPT, CONVERSATION_PROMPTS,
  detectCrisis, isSafeInput,
} from '@/modules/ai/prompts/system-prompt'
import { checkRateLimit, RATE_LIMITS, getRateLimitKey } from '@/lib/auth/rate-limit'
import { rateLimitResponse, errorResponse } from '@/lib/api-response'
import { AiChatSchema } from '@/lib/validation/schemas'
import { z } from 'zod'

export const runtime = 'edge' // Use Edge runtime for streaming

// Crisis resources appended when crisis is detected
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

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'

  // Rate limiting — ASD §5.27: 30 AI requests per hour
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

    // Input safety check — reject prompt injection attempts
    if (!isSafeInput(validated.message)) {
      return new Response(
        JSON.stringify({ error: 'Input contains disallowed content.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Crisis detection — return immediate compassionate response
    if (detectCrisis(validated.message)) {
      return new Response(
        JSON.stringify({ type: 'crisis', content: CRISIS_RESPONSE }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check for Anthropic API key
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicKey) {
      // Return a thoughtful fallback when API is not configured
      return new Response(
        JSON.stringify({
          type: 'fallback',
          content: generateFallbackResponse(validated.message),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Select system prompt based on conversation type
    const systemPrompt = CONVERSATION_PROMPTS[validated.conversation_type]
      ?? BIBLE_COMPANION_SYSTEM_PROMPT

    // Build message history
    const messages = [{ role: 'user', content: validated.message }]

    // Call Anthropic Claude API with streaming
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':            'application/json',
        'x-api-key':               anthropicKey,
        'anthropic-version':       '2023-06-01',
        'anthropic-beta':          'messages-2023-12-15',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens: 2000,
        system:     systemPrompt,
        messages,
        stream:     true,
      }),
    })

    if (!claudeResponse.ok) {
      const err = await claudeResponse.text()
      console.error('[AI Companion] Claude API error:', err)
      return new Response(
        JSON.stringify({ type: 'fallback', content: generateFallbackResponse(validated.message) }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Stream the response directly to the client
    return new Response(claudeResponse.body, {
      headers: {
        'Content-Type':  'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection':    'keep-alive',
      },
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Invalid request.' }),
        { status: 422, headers: { 'Content-Type': 'application/json' } }
      )
    }
    console.error('[AI Companion] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Something went wrong. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// Thoughtful fallback when AI is not yet configured
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
