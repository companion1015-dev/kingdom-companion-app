// One-off content fix: the Miracle Journey 365-day pack's guided_prayer
// field was byte-identical across all 365 entries (a single hardcoded
// prayer reused every day). Replaces it with a rotation through 30
// distinct, independently-written prayers (by day_number), so nearby days
// never repeat and the cycle only recurs roughly monthly -- consistent
// with the fix applied to /api/v1/daily's fallback content pool.
// Run with: node prisma/fix-miracle-journey-guided-prayers.mjs

import 'dotenv/config'
import { readFileSync, writeFileSync } from 'node:fs'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const GUIDED_PRAYERS = [
  "Lord Jesus, form Your character in me. Give me wisdom to recognize what You are teaching, courage to obey what You show me, and grace to remain faithful when progress feels slow. Help me live today's truth in a practical way and use my life to bless others. Amen.",
  "Father, thank You for meeting me in this moment exactly as I am. Open my heart to receive what You want to teach me today, and give me the courage to act on it rather than just admire it. Let today's truth take root and bear fruit in how I treat others. Amen.",
  "Lord, quiet the noise in my mind so I can truly hear You. Give me a teachable spirit, willing hands, and a patient heart as I work out what You're forming in me. Let today be one more faithful step, not a finished destination. Amen.",
  "Jesus, I don't want to just know this truth -- I want to live it. Give me eyes to see where it applies today, strength to follow through, and humility to accept correction along the way. Use what You build in me to serve someone else. Amen.",
  "Father, I bring You my honest self today -- the parts that are growing and the parts still resistant to change. Meet me in both. Shape my character gently but persistently, and let today's obedience, however small, be a genuine act of worship. Amen.",
  "Lord, I confess it's easier to agree with truth than to live it. Give me courage today to close that gap -- to let what I believe actually shape what I do. Keep me faithful in the small, unseen choices no one else will notice. Amen.",
  "God, thank You for patiently working in me even when I'm slow to change. Help me cooperate with what You're doing rather than resist it. Give me clarity about today's next step, and the willingness to actually take it. Amen.",
  "Father, form in me a heart that responds to You quickly, not reluctantly. Where I've been holding back, give me courage to move forward. Let today's obedience be simple, genuine, and rooted in trust rather than fear. Amen.",
  "Lord Jesus, I want today's truth to reach further than my thoughts -- into my habits, my words, and how I treat the people around me. Give me practical wisdom to live it out, and grace when I fall short of it. Amen.",
  "Father, You know exactly where I'm resistant to growth. Soften that place today. Give me the humility to be corrected and the courage to keep going even when change feels slow or uncomfortable. Let my life reflect what You're teaching me. Amen.",
  "Lord, help me stop measuring today only by how I feel and start measuring it by whether I actually obeyed. Give me strength for the follow-through, not just the good intention. Use today's faithfulness to bless someone else's day too. Amen.",
  "God, I want to be shaped by You more than by my circumstances or my moods. Teach me today's lesson well, and give me the discipline to practice it even after the feeling of inspiration fades. Keep my heart soft toward You. Amen.",
  "Father, thank You for not giving up on my growth even when it's uneven. Meet me in today's specific challenge with wisdom I don't naturally have, and let my response to it be shaped by who You are, not by pressure or fear. Amen.",
  "Lord Jesus, give me a heart that welcomes correction instead of defending itself. Show me clearly what today's truth is asking of me, and give me the courage to actually do it, even if it costs me comfort or convenience. Amen.",
  "Father, I want my life to be consistent -- what I believe matching what I do. Close the gap between the two today. Give me practical wisdom for the specific situations I'll face, and grace for the moments I still get it wrong. Amen.",
  "Lord, teach me to treat today's truth as more than information -- as an invitation to actually change. Give me courage for the follow-through and humility to keep learning. Let today's small obedience matter as much as I know it does to You. Amen.",
  "God, You've been patient with my process, and I thank You for that. Give me renewed focus today to actually apply what I'm learning rather than let it pass by unused. Shape my character through today's ordinary moments. Amen.",
  "Father, I don't want to just admire truth from a distance -- I want to live inside it. Give me discernment for today's specific decisions, and strength to choose faithfully even when it's the harder option. Use my obedience to bless others. Amen.",
  "Lord Jesus, thank You for meeting me exactly where my growth currently stands, not where I wish it already was. Give me patience with the process and diligence in today's practice. Let what You form in me overflow toward the people around me. Amen.",
  "Father, give me a willing heart today -- quick to listen, quick to obey, slow to make excuses. Show me clearly what faithfulness looks like in my actual circumstances, and give me courage to live it out fully. Amen.",
  "Lord, I want today's lesson to become tomorrow's habit. Help me practice it deliberately rather than hope it happens automatically. Give me grace for the moments I forget, and renewed resolve each time I remember. Amen.",
  "God, thank You for the specific truth You've placed in front of me today. Help me not overthink it into inaction, but simply and faithfully live it out. Let it shape how I treat the people I'll encounter today. Amen.",
  "Father, form in me the kind of character that holds up under pressure, not just in easy moments. Give me today's portion of wisdom and courage, and let my obedience be genuine rather than performed for an audience. Amen.",
  "Lord Jesus, I release my excuses to You today. Give me clarity about what You're asking of me, and give me the follow-through to actually do it. Let today be one honest, faithful step forward, however small it looks. Amen.",
  "Father, thank You for teaching me even in the ordinary, unremarkable parts of today. Help me not dismiss small obedience as unimportant. Shape my character patiently, and let today's faithfulness bless someone who needs it. Amen.",
  "Lord, give me discernment to see where today's truth actually applies in my life, not just in theory. Strengthen my resolve to live it out, and keep my heart humble enough to be corrected along the way. Amen.",
  "God, I want to grow in a way that's real, not just visible. Work in the quiet, unseen places of my character today. Give me courage for obedience that costs something, and grace for the parts of me still catching up. Amen.",
  "Father, help me carry today's truth beyond this moment of reflection and into how I actually live for the rest of the day. Give me practical wisdom, patient endurance, and a heart that keeps choosing You. Amen.",
  "Lord Jesus, thank You for continuing to form me even when the process is slow and unglamorous. Give me today's needed wisdom and courage, and let my life -- however imperfectly -- point back to Your faithfulness. Amen.",
  "Father, meet me today in the specific place I need to grow. Give me humility to see it clearly, courage to address it honestly, and grace to keep moving forward even when it's difficult. Use today to shape me for what's ahead. Amen.",
]

const SEED_PATH = new URL('./seed-data/kingdom-companion-miracle-journey-365.json', import.meta.url)
const entries = JSON.parse(readFileSync(SEED_PATH))
if (entries.length !== 365) throw new Error(`Expected 365 entries, found ${entries.length}`)

for (const e of entries) {
  e.guided_prayer = GUIDED_PRAYERS[(e.day_number - 1) % GUIDED_PRAYERS.length]
}
writeFileSync(SEED_PATH, JSON.stringify(entries, null, 2) + '\n')
console.log(`Updated guided_prayer for ${entries.length} entries in seed JSON.`)

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const series = await prisma.devotionalSeries.findUnique({ where: { slug: 'kingdom-companion-miracle-journey' } })
if (!series) {
  console.log('No matching devotionalSeries row found in DB -- seed JSON updated only.')
  process.exit(0)
}

let updated = 0
for (const e of entries) {
  await prisma.devotionalEntry.update({
    where: { devotional_series_id_day_number: { devotional_series_id: series.id, day_number: e.day_number } },
    data: { guided_prayer: e.guided_prayer },
  })
  updated++
}
console.log(`Updated guided_prayer for ${updated} devotionalEntry rows in DB.`)
await prisma.$disconnect()
