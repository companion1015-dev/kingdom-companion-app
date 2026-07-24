// ─── DAILY ENCOURAGEMENT DATA ────────────────────────────────────────────────
// PRD §4.43: Each daily entry includes Scripture, reflection, prayer, challenge,
// reflection question, suggested reading, and estimated reading time.
// Content is managed via CMS in production — this seeds initial 30 days.

export type DailyEntry = {
  id:              number
  date?:           string           // ISO date string when scheduled
  verse:           { reference: string; text: string; translation: string }
  title:           string
  theme:           string
  reflection:      string
  prayer:          string
  challenge:       string
  reflectionQ:     string
  journalPrompt:   string
  suggestedReading:string
  readingTime:     number           // minutes
}

export const DAILY_ENTRIES: DailyEntry[] = [
  {
    id: 1, title: 'The God Who Sees You', theme: 'God\'s Presence',
    verse: { reference: 'Genesis 16:13', text: 'She gave this name to the LORD who spoke to her: "You are the God who sees me," for she said, "I have now seen the One who sees me."', translation: 'NIV' },
    reflection: 'Hagar was alone in the desert — rejected, afraid, and certain she had been forgotten. Yet it was in that desolate place that she encountered God, and she named Him El Roi: the God who sees.\n\nWe all have desert seasons. Moments when we feel invisible — overlooked by the people around us, perhaps even wondering whether God has noticed our pain. The story of Hagar speaks directly into those moments.\n\nGod did not send an angel to Hagar when she was comfortable. He met her when she was alone, afraid, and without hope. That is not a coincidence. That is the character of God — He is drawn to the broken places, the lonely places, the hidden places where we have stopped expecting anyone to find us.\n\nHe sees you today. Not a general, distant awareness — but a personal, attentive, caring gaze. He sees your situation with all its complexity. He sees the pain you have not yet put into words. He sees the hope you are afraid to express in case it is disappointed again.\n\nYou are not invisible. You are deeply, personally known.',
    prayer: 'Lord, there are days when I feel unseen and forgotten. Remind me today that You are El Roi — the God who sees me. See me in this moment. See what I am carrying. See what I am hoping for. Let the truth that You see me bring peace to my heart. Amen.',
    challenge: 'Write down one area of your life where you have felt unseen. Then write beside it: "God sees this."',
    reflectionQ: 'Where in your life do you most need to know that God sees you today?',
    journalPrompt: 'Describe a moment when you felt truly seen — by God or by another person. What did that feel like?',
    suggestedReading: 'Genesis 16:1-16', readingTime: 4,
  },
  {
    id: 2, title: 'Peace That Passes Understanding', theme: 'Peace',
    verse: { reference: 'Philippians 4:7', text: 'And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.', translation: 'NIV' },
    reflection: 'Paul wrote these words from prison. That context changes everything about how we read them.\n\nThis is not the peace of comfortable circumstances. This is not the peace of problems solved or fears removed. This is something altogether different — a peace that comes not from understanding your situation but from trusting the One who holds it.\n\nThe Greek word Paul uses for "guard" is a military term. The peace of God stands like a soldier at the gate of your heart and mind, protecting what enters. Anxiety knocks at the door. Despair presents its case. Fear makes its arguments. But the peace of God — which makes no rational sense given the circumstances — stands guard.\n\nThe key is in the verse that precedes it: prayer with thanksgiving. When we bring our anxieties to God and choose gratitude even in difficulty, we create the conditions for this inexplicable peace to stand watch over us.\n\nYou may not be able to think your way to peace today. But you can pray your way there.',
    prayer: 'Father, my mind is restless and my heart is troubled. I bring these anxieties to You now — every one of them. I choose to thank You even in this difficulty, because You are faithful and You are good. Stand guard over my heart and mind today with Your peace that I cannot explain but desperately need. In Jesus\' name, Amen.',
    challenge: 'Spend five minutes in prayer — not asking for anything, just thanking God for three specific things.',
    reflectionQ: 'What are you most anxious about today? Have you brought it specifically to God in prayer?',
    journalPrompt: 'Write your anxieties as a prayer. Turn each fear into a request and each request into an act of trust.',
    suggestedReading: 'Philippians 4:4-13', readingTime: 4,
  },
  {
    id: 3, title: 'Strength for the Weary', theme: 'Strength',
    verse: { reference: 'Isaiah 40:31', text: 'But those who hope in the LORD will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.', translation: 'NIV' },
    reflection: 'Notice the order in Isaiah 40:31. It begins with hope — not action, not effort, not performance. Before the eagle soars, before the runner runs, there is a person who waits and hopes in the Lord.\n\nIn a culture that rewards productivity and relentless effort, waiting feels like weakness. But Isaiah presents it as the very source of renewed strength. The Hebrew word translated "hope" can also mean "wait" — not passive resignation, but active expectation. It is the posture of someone who knows help is coming.\n\nAre you weary today? Genuinely, deeply tired — not just physically but spiritually, emotionally, in ways that sleep does not fix? This promise is for you. Not a promise that the difficulty will immediately end, but a promise that strength will be given for what you face.\n\nThe eagle does not generate its own lift. It finds the thermal — the rising warm air — and opens its wings. Your role is to open your wings to God. He provides the lift.',
    prayer: 'Lord, I am tired. Tired in ways I find difficult to explain. I choose to hope in You today — not in my own strength or ability to manage, but in You. Renew me. Lift me. Give me what I need for today. I open my wings. You provide the wind. Amen.',
    challenge: 'Rest intentionally today. Take ten minutes of genuine quiet — no phone, no task — and let yourself be still before God.',
    reflectionQ: 'In what area of your life are you trying to fly in your own strength rather than waiting on God?',
    journalPrompt: 'What does "hoping in the Lord" look like practically in your current season?',
    suggestedReading: 'Isaiah 40:28-31', readingTime: 3,
  },
  {
    id: 4, title: 'You Are Not Alone', theme: 'God\'s Presence',
    verse: { reference: 'Joshua 1:9', text: 'Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the LORD your God will be with you wherever you go.', translation: 'NIV' },
    reflection: 'Moses was gone. Joshua was facing the impossible task of leading millions of people into a land filled with fortified cities and experienced armies. The weight of that moment must have been extraordinary.\n\nGod\'s response was not a battle strategy. It was not a list of Joshua\'s qualifications. It was a promise: I will be with you wherever you go.\n\nThis is the consistent pattern of God\'s encouragement throughout Scripture. When the disciples were sent out, Jesus promised His presence. When Paul faced persecution, God said "I am with you." When we face our own versions of fortified cities — situations that feel impossible, challenges that exceed our ability — the promise is the same.\n\nThe command to be strong and courageous is not a call to manufacture feelings of confidence. It is a call to act on the truth of God\'s presence even when our feelings say otherwise. Courage is not the absence of fear — it is choosing to move forward because Someone greater than your fear walks with you.',
    prayer: 'Lord, I am facing things today that feel bigger than I am. I choose to believe Your promise — that You are with me wherever I go. Help me to act with courage not because I feel strong but because You are strong. Walk with me today. In Jesus\' name, Amen.',
    challenge: 'Identify one thing you have been avoiding out of fear. Take one small step toward it today.',
    reflectionQ: 'What situation in your life most needs you to act courageously rather than wait until you feel ready?',
    journalPrompt: 'Describe a time when you experienced God\'s presence in a difficult situation. What did it change?',
    suggestedReading: 'Joshua 1:1-9', readingTime: 3,
  },
  {
    id: 5, title: 'The Shepherd Who Knows Your Name', theme: 'God\'s Care',
    verse: { reference: 'John 10:14', text: '"I am the good shepherd; I know my sheep and my sheep know me."', translation: 'NIV' },
    reflection: 'In the ancient Near East, a shepherd knew every sheep individually. Not as a category — sheep — but as individuals with distinct personalities, tendencies, and needs. Some were bold, some were skittish, some were prone to wandering. The shepherd knew them all.\n\nJesus claims this kind of knowing. Not a general awareness that people exist, but a specific, personal, thorough knowledge of each person who belongs to Him. He knows your name. He knows your history. He knows the patterns of your heart — where you tend to stray, where you find fear, what makes you run.\n\nThe astonishing thing about this passage is the mutuality. "I know my sheep and my sheep know me." We are not merely known — we are invited into a relationship of knowing. The God who made the universe invites us to know Him in return.\n\nThis is what prayer is: the sheep learning the Shepherd\'s voice. The more we spend time with Him, the more familiar His voice becomes — distinguishable from the noise of fear, comparison, and doubt that competes for our attention.',
    prayer: 'Good Shepherd, thank You that You know me — fully and completely, and still You call me Your own. Teach me to know Your voice. Help me to recognise it above the noise of my own thoughts and fears. Lead me today in the paths that are right. I trust You. Amen.',
    challenge: 'Spend time in John 10 today. Read it slowly and let the image of Jesus as your Shepherd settle into your heart.',
    reflectionQ: 'How well do you know the Shepherd\'s voice? What practices help you hear it more clearly?',
    journalPrompt: 'Write about a time when you heard God clearly. What were the circumstances? What did He say?',
    suggestedReading: 'John 10:1-18', readingTime: 5,
  },
]

// Get today's entry — rotates based on day of year
export function getTodayEntry(): DailyEntry {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  )
  return DAILY_ENTRIES[dayOfYear % DAILY_ENTRIES.length]
}

// Get entry by offset from today (0 = today, -1 = yesterday, 1 = tomorrow)
export function getEntryByOffset(offset: number): DailyEntry {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  ) + offset
  const idx = ((dayOfYear % DAILY_ENTRIES.length) + DAILY_ENTRIES.length) % DAILY_ENTRIES.length
  return DAILY_ENTRIES[idx]
}