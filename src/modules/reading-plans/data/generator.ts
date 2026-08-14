// Auto-generated data + logic for the Kingdom Companion 365-Day Reading Plan.
// Ported from the Python prototype that was QC-validated (365 days, zero gaps/
// duplicates across all 1189 Bible chapters, no verse text reproduced).

type CanonBook = [string, string, number] // [name, book_id, chapterCount]
type MonthDef = {
  month: number; weeks: number; title: string; theme: string;
  objective: string; keyScripture: string; goal: string;
}
type WeekDef = [number, number, string, string, string, string] // [week, month, title, scriptureFocus, objective, challenge]

const CANON: CanonBook[] = [["Genesis", "GEN", 50], ["Exodus", "EXO", 40], ["Leviticus", "LEV", 27], ["Numbers", "NUM", 36], ["Deuteronomy", "DEU", 34], ["Joshua", "JOS", 24], ["Judges", "JDG", 21], ["Ruth", "RUT", 4], ["1 Samuel", "1SA", 31], ["2 Samuel", "2SA", 24], ["1 Kings", "1KI", 22], ["2 Kings", "2KI", 25], ["1 Chronicles", "1CH", 29], ["2 Chronicles", "2CH", 36], ["Ezra", "EZR", 10], ["Nehemiah", "NEH", 13], ["Esther", "EST", 10], ["Job", "JOB", 42], ["Psalms", "PSA", 150], ["Proverbs", "PRO", 31], ["Ecclesiastes", "ECC", 12], ["Song of Songs", "SNG", 8], ["Isaiah", "ISA", 66], ["Jeremiah", "JER", 52], ["Lamentations", "LAM", 5], ["Ezekiel", "EZK", 48], ["Daniel", "DAN", 12], ["Hosea", "HOS", 14], ["Joel", "JOL", 3], ["Amos", "AMO", 9], ["Obadiah", "OBA", 1], ["Jonah", "JON", 4], ["Micah", "MIC", 7], ["Nahum", "NAM", 3], ["Habakkuk", "HAB", 3], ["Zephaniah", "ZEP", 3], ["Haggai", "HAG", 2], ["Zechariah", "ZEC", 14], ["Malachi", "MAL", 4], ["Matthew", "MAT", 28], ["Mark", "MRK", 16], ["Luke", "LUK", 24], ["John", "JHN", 21], ["Acts", "ACT", 28], ["Romans", "ROM", 16], ["1 Corinthians", "1CO", 16], ["2 Corinthians", "2CO", 13], ["Galatians", "GAL", 6], ["Ephesians", "EPH", 6], ["Philippians", "PHP", 4], ["Colossians", "COL", 4], ["1 Thessalonians", "1TH", 5], ["2 Thessalonians", "2TH", 3], ["1 Timothy", "1TI", 6], ["2 Timothy", "2TI", 4], ["Titus", "TIT", 3], ["Philemon", "PHM", 1], ["Hebrews", "HEB", 13], ["James", "JAS", 5], ["1 Peter", "1PE", 5], ["2 Peter", "2PE", 3], ["1 John", "1JN", 5], ["2 John", "2JN", 1], ["3 John", "3JN", 1], ["Jude", "JUD", 1], ["Revelation", "REV", 22]]

export const MONTHS: MonthDef[] = [
  { "month": 1, "weeks": 4, "title": "Encounter & Foundation", "theme": "Meeting God and building a foundation on His Word", "objective": "Establish a daily rhythm of Scripture reading and encounter the Gospel afresh.", "keyScripture": "Psalm 119:105", "goal": "The reader begins to see Scripture as a living encounter with God, not an obligation." },
  { "month": 2, "weeks": 4, "title": "Identity in Christ", "theme": "Discovering who you are because of who God says you are", "objective": "Replace performance-based identity with a Christ-secured identity.", "keyScripture": "2 Corinthians 5:17", "goal": "The reader can articulate their identity in Christ apart from circumstances or performance." },
  { "month": 3, "weeks": 5, "title": "Trust & Faith", "theme": "Learning to trust God's character even when His plan is unclear", "objective": "Build confidence in God's faithfulness through the record of Scripture.", "keyScripture": "Proverbs 3:5-6", "goal": "The reader trusts God's character in present uncertainty, not just in hindsight." },
  { "month": 4, "weeks": 4, "title": "A Life of Prayer", "theme": "Developing an honest, consistent conversation with God", "objective": "Move from occasional prayer to a sustained rhythm of prayer.", "keyScripture": "1 Thessalonians 5:17", "goal": "The reader prays with greater honesty, consistency and dependence on God." },
  { "month": 5, "weeks": 4, "title": "Christlike Character", "theme": "Being shaped into the likeness of Christ from the inside out", "objective": "Grow in the fruit of the Spirit through daily, practical application.", "keyScripture": "Galatians 5:22-23", "goal": "The reader notices real, Spirit-formed changes in temperament and reactions." },
  { "month": 6, "weeks": 5, "title": "Wisdom & Discernment", "theme": "Learning to see life and decisions the way God sees them", "objective": "Develop practical wisdom for decisions, speech and daily living.", "keyScripture": "James 1:5", "goal": "The reader makes decisions shaped by biblical wisdom rather than impulse or culture." },
  { "month": 7, "weeks": 4, "title": "Relationships & Community", "theme": "Loving others the way Christ has loved us", "objective": "Apply biblical love, forgiveness and community to real relationships.", "keyScripture": "John 13:34-35", "goal": "The reader takes practical steps toward healthier, more Christlike relationships." },
  { "month": 8, "weeks": 4, "title": "Holiness & Renewal", "theme": "Facing sin honestly and walking in ongoing renewal", "objective": "Practise honest confession and daily dependence on the Spirit.", "keyScripture": "Romans 12:2", "goal": "The reader develops honest self-examination without shame-driven guilt." },
  { "month": 9, "weeks": 5, "title": "Purpose & Calling", "theme": "Discovering how God has uniquely equipped and called you", "objective": "Connect daily work, gifts and time to a sense of God-given purpose.", "keyScripture": "Ephesians 2:10", "goal": "The reader sees their daily life and work as meaningful kingdom participation." },
  { "month": 10, "weeks": 4, "title": "Serving Others", "theme": "Living with a servant's heart in ordinary life", "objective": "Practise generosity, compassion and service in tangible ways.", "keyScripture": "Mark 10:45", "goal": "The reader takes at least one concrete step of service each week." },
  { "month": 11, "weeks": 4, "title": "Mission & the Nations", "theme": "Carrying God's heart for the lost and the world", "objective": "Grow in courage and clarity to share faith and pray for the nations.", "keyScripture": "Matthew 28:19-20", "goal": "The reader takes one real step toward being a witness in their own context." },
  { "month": 12, "weeks": 5, "title": "Maturity & the Lifelong Walk", "theme": "Finishing the year strong and building a sustainable, lifelong walk", "objective": "Consolidate a year of growth into lasting habits and a plan for ongoing discipleship.", "keyScripture": "Hebrews 12:1-2", "goal": "The reader leaves the year with sustainable rhythms, not a finished checklist." }
]

const WEEKS: WeekDef[] = [[1, 1, "Why God's Word Matters", "Psalm 119:1-16", "Understand why daily Scripture matters more than daily information.", "Read before checking your phone each morning this week."], [2, 1, "Meeting Jesus in the Gospel", "John 1:1-18", "See the Gospel afresh as good news, not background knowledge.", "Tell one person one thing you learned about Jesus this week."], [3, 1, "The Story of Redemption", "Genesis 3; Romans 5:12-21", "Understand the Bible as one unified story of redemption.", "Summarise the Bible's story in three sentences to someone else."], [4, 1, "Beginning a Life of Faith", "Hebrews 11:1-6", "Take honest stock of where your faith currently stands.", "Write down one step of faith you will take this month."], [5, 2, "Made in God's Image", "Genesis 1:26-31", "Root your worth in being made in God's image, not achievement.", "Notice one moment this week you sought worth from performance instead."], [6, 2, "A New Creation", "2 Corinthians 5:16-21", "Understand what has genuinely changed since coming to Christ.", "Write a short list of what is true of you 'in Christ'."], [7, 2, "Adopted as God's Child", "Romans 8:14-17", "Grasp the significance of being adopted, not just forgiven.", "Pray using 'Father' deliberately each time you pray this week."], [8, 2, "Secure in God's Love", "Romans 8:31-39", "Settle the question of security in God's love once and for all.", "Name one fear about God's love and bring it honestly to Him."], [9, 3, "Trusting God's Character", "Exodus 34:5-7", "Anchor trust in who God is, not in circumstances.", "List three attributes of God's character you are trusting this week."], [10, 3, "Faith in the Wilderness", "Exodus 16:1-18", "See how God provides in seasons that feel barren.", "Identify one current 'wilderness' and pray about it specifically."], [11, 3, "God's Faithfulness through Generations", "Joshua 1:1-9; 4:1-7", "Trace God's faithfulness across the biblical story.", "Ask an older believer to share one story of God's faithfulness."], [12, 3, "Trusting God in Uncertainty", "Habakkuk 3:17-19", "Learn to trust God when outcomes are unclear.", "Name one uncertain situation and surrender it in prayer daily."], [13, 3, "Faith that Obeys", "James 2:14-26", "Understand that genuine faith always produces action.", "Take one obedient step you have been delaying."], [14, 4, "Learning to Pray", "Matthew 6:5-15", "Learn a simple, honest pattern for prayer.", "Pray the Lord's Prayer slowly, phrase by phrase, each day."], [15, 4, "Prayers of the Psalms", "Psalm 42", "Learn to bring real emotion honestly to God in prayer.", "Write your own psalm expressing what you feel this week."], [16, 4, "Persistent Prayer", "Luke 18:1-8", "Understand why God calls us to persistent, unhurried prayer.", "Keep praying for one long-standing request without giving up."], [17, 4, "Prayer and Surrender", "Matthew 26:36-46", "Learn to pray 'not my will but Yours' honestly.", "Surrender one specific outcome to God in prayer this week."], [18, 5, "The Fruit of the Spirit", "Galatians 5:16-26", "Understand character as the Spirit's fruit, not self-effort.", "Identify the fruit you most need to grow and pray for it daily."], [19, 5, "Humility and Meekness", "Philippians 2:1-11", "See Christ's humility as the model for our own.", "Practise deferring to someone else's preference once each day."], [20, 5, "Patience and Self-Control", "James 1:19-20", "Grow practical patience in daily frustrations.", "Pause and pray before responding in one heated moment this week."], [21, 5, "Integrity and Honesty", "Proverbs 10:9", "Examine consistency between private and public life.", "Identify one area to bring into greater integrity this week."], [22, 6, "The Beginning of Wisdom", "Proverbs 1:1-7", "Understand the fear of the Lord as the foundation of wisdom.", "Ask God for wisdom before one decision this week."], [23, 6, "Wisdom for Everyday Decisions", "Proverbs 3:1-12", "Apply biblical wisdom to ordinary daily decisions.", "Seek counsel before making one decision instead of deciding alone."], [24, 6, "Guarding Your Heart", "Proverbs 4:20-27", "Understand what shapes the heart and guard it intentionally.", "Identify one influence to limit this week for the sake of your heart."], [25, 6, "Wisdom in Speech", "James 3:1-12", "Examine the weight and power of your words.", "Go one full day speaking only what builds others up."], [26, 6, "Discernment in a Confusing World", "1 John 4:1-6", "Learn to test ideas and influences against Scripture.", "Evaluate one belief or message you've absorbed against Scripture."], [27, 7, "Loving One Another", "John 13:34-35", "See love as the defining mark of a disciple.", "Do one deliberate act of love for someone difficult to love."], [28, 7, "Marriage and Family", "Ephesians 5:21-33", "Apply biblical love and sacrifice within the family.", "Have one honest, caring conversation with a family member."], [29, 7, "Friendship and Fellowship", "Proverbs 27:17; Acts 2:42-47", "Value real Christian community over surface-level connection.", "Reach out to one believer you have been neglecting."], [30, 7, "Forgiveness and Reconciliation", "Matthew 18:21-35", "Understand forgiveness as received grace extended to others.", "Take one step toward forgiving or reconciling with someone."], [31, 8, "Confronting Sin Honestly", "Psalm 51", "Learn honest confession without minimising or despairing.", "Confess one specific sin honestly to God in prayer."], [32, 8, "Repentance and Grace", "Luke 15:11-32", "See repentance as returning to grace, not earning it back.", "Identify one area to turn back toward God this week."], [33, 8, "Walking in the Spirit", "Romans 8:1-11", "Understand daily dependence on the Holy Spirit.", "Begin each day this week asking the Spirit for help."], [34, 8, "Renewed Day by Day", "2 Corinthians 4:16-18", "See spiritual renewal as a daily, not one-time, process.", "Identify one daily habit that could become a renewal practice."], [35, 9, "Created for Good Works", "Ephesians 2:8-10", "See good works as the fruit of grace, not the basis of it.", "Do one 'good work' you weren't specifically asked to do."], [36, 9, "Discovering Your Gifts", "Romans 12:3-8", "Reflect honestly on your God-given gifts and strengths.", "Ask someone who knows you well what gift they see in you."], [37, 9, "Work as Worship", "Colossians 3:23-24", "See ordinary work as an offering to God.", "Do one task this week 'as unto the Lord' with full effort."], [38, 9, "Stewardship of Time and Resources", "Matthew 25:14-30", "Examine how you steward time, money and resources.", "Review your week's calendar or budget honestly before God."], [39, 9, "Living with Eternal Purpose", "2 Corinthians 4:16-5:10", "See daily life in light of eternity.", "Identify one decision to make differently in light of eternity."], [40, 10, "The Heart of a Servant", "John 13:1-17", "Learn servanthood from Christ washing His disciples' feet.", "Do one unnoticed act of service this week."], [41, 10, "Compassion for the Hurting", "Luke 10:25-37", "Grow practical compassion for those who are hurting.", "Reach out to one person who is struggling."], [42, 10, "Generosity that Costs", "2 Corinthians 8:1-9", "Understand generosity that involves real sacrifice.", "Give something away that actually costs you this week."], [43, 10, "Serving the Local Church", "1 Corinthians 12:12-27", "See your local church as a body needing your part.", "Offer one specific way to serve your local church."], [44, 11, "The Great Commission", "Matthew 28:16-20", "Understand the call to make disciples as personal, not distant.", "Pray by name for one person who doesn't yet know Christ."], [45, 11, "Being a Witness", "Acts 1:6-8", "Grow confidence in sharing your own story of faith.", "Share one honest sentence of your faith story with someone."], [46, 11, "God's Heart for the Nations", "Revelation 7:9-10", "See God's redemptive plan as reaching every nation.", "Learn about and pray for one unreached people group."], [47, 11, "Courage in the Face of Opposition", "Acts 4:13-31", "Grow courage to live and speak faith despite pushback.", "Identify one place fear has silenced you and pray for courage."], [48, 12, "Growing Beyond the Basics", "Hebrews 5:11-6:3", "Move from spiritual milk toward maturity.", "Identify one area of faith you're ready to grow deeper in."], [49, 12, "Enduring through Trials", "James 1:2-4; Romans 5:3-5", "See trials as producing endurance and character.", "Reflect on one trial this year and what it produced in you."], [50, 12, "Leaving a Godly Legacy", "2 Timothy 2:1-2; Deuteronomy 6:4-9", "Consider what you are passing on to others.", "Invest intentionally in one younger or newer believer this week."], [51, 12, "Walking with God for Life", "Micah 6:8", "Consolidate the year into simple, sustainable rhythms.", "Choose the one rhythm from this year you will keep long-term."], [52, 12, "Looking Back, Looking Forward", "Joshua 4:1-7; Philippians 3:12-14", "Review the year honestly and look ahead with hope.", "Write a short letter to yourself for next year."]]

const MEMORY_VERSES: Record<string, string> = {"1": "Psalm 119:105", "2": "John 1:14", "3": "Romans 5:8", "4": "Hebrews 11:1", "5": "Genesis 1:27", "6": "2 Corinthians 5:17", "7": "Romans 8:15", "8": "Romans 8:38-39", "9": "Exodus 34:6", "10": "Deuteronomy 8:3", "11": "Joshua 1:9", "12": "Habakkuk 3:19", "13": "James 2:17", "14": "Matthew 6:9", "15": "Psalm 42:11", "16": "Luke 18:1", "17": "Matthew 26:39", "18": "Galatians 5:22-23", "19": "Philippians 2:3", "20": "James 1:19", "21": "Proverbs 10:9", "22": "Proverbs 9:10", "23": "Proverbs 3:6", "24": "Proverbs 4:23", "25": "James 3:9-10", "26": "1 John 4:1", "27": "John 13:34", "28": "Ephesians 5:25", "29": "Proverbs 27:17", "30": "Matthew 6:14", "31": "Psalm 51:10", "32": "Luke 15:20", "33": "Romans 8:1", "34": "2 Corinthians 4:16", "35": "Ephesians 2:10", "36": "Romans 12:6", "37": "Colossians 3:23", "38": "Matthew 25:21", "39": "2 Corinthians 4:18", "40": "John 13:14", "41": "Luke 10:33", "42": "2 Corinthians 9:7", "43": "1 Corinthians 12:27", "44": "Matthew 28:19", "45": "Acts 1:8", "46": "Revelation 7:9", "47": "Acts 4:31", "48": "Hebrews 6:1", "49": "James 1:2-3", "50": "2 Timothy 2:2", "51": "Micah 6:8", "52": "Joshua 4:6-7"}

export const MONTHLY_REVIEWS: Record<string, string> = {
  "1": "You have begun building a daily rhythm in God's Word and met the Gospel afresh. Before moving on, ask: Has Scripture started to feel like an encounter rather than a task? What has surprised you so far?",
  "2": "This month centred on identity in Christ. Ask: Can you describe who you are in Christ without referring to your achievements, failures, or others' opinions? Where do you still default to old sources of identity?",
  "3": "You have traced God's faithfulness through five weeks of Trust & Faith. Ask: What uncertain situation did you bring to God this month, and how has your trust in His character shifted, even if the outcome hasn't changed?",
  "4": "This month built a foundation for a life of prayer. Ask: Has your prayer life become more honest and consistent? What pattern from this month do you want to keep?",
  "5": "You have focused on Christlike character and the fruit of the Spirit. Ask: What fruit has genuinely grown in you this month? What situation revealed you still have work to do?",
  "6": "This month developed wisdom and discernment. Ask: Name one decision you made differently this month because of biblical wisdom rather than impulse.",
  "7": "You have applied biblical love to real relationships. Ask: What relationship changed because of something you practised this month — a step of love, forgiveness, or reconciliation?",
  "8": "This month faced sin and renewal honestly. Ask: What have you confessed and turned from this month? Where do you sense the Spirit renewing you day by day?",
  "9": "You have explored purpose, calling and stewardship. Ask: Do you see your daily work and time differently now? What is one concrete change in how you steward what God has given you?",
  "10": "This month practised serving others. Ask: What is one specific act of service or generosity from this month that cost you something real?",
  "11": "You have grown in courage for mission and witness. Ask: Did you take a step — praying for someone, sharing your story, learning about the nations — that felt uncomfortable but right?",
  "12": "This final month consolidates a year of growth into a lifelong walk. Ask: Looking at the whole year, what is the one sustainable rhythm you are committing to carry forward?"
}

const READING_DAYS = 364

function buildChapterCursor(): [string, string, number][] {
  const cursor: [string, string, number][] = []
  for (const [name, bid, count] of CANON) {
    for (let ch = 1; ch <= count; ch++) cursor.push([name, bid, ch])
  }
  return cursor
}

function allocateDays(): [string, string, number][][] {
  const cursor = buildChapterCursor()
  const total = cursor.length // must be 1189
  const boundaries: number[] = []
  for (let i = 0; i <= READING_DAYS; i++) {
    boundaries.push(Math.round((total * i) / READING_DAYS))
  }
  const days: [string, string, number][][] = []
  for (let i = 0; i < READING_DAYS; i++) {
    days.push(cursor.slice(boundaries[i], boundaries[i + 1]))
  }
  return days
}

const SINGLE_CHAPTER_BOOKS = new Set(['Obadiah', 'Philemon', '2 John', '3 John', 'Jude'])

function fmtRange(book: string, start: number, end: number): string {
  if (SINGLE_CHAPTER_BOOKS.has(book)) return `${book} 1`
  return start === end ? `${book} ${start}` : `${book} ${start}-${end}`
}

function formatReference(dayChapters: [string, string, number][]): string {
  if (dayChapters.length === 0) return ''
  const parts: string[] = []
  let curBook = dayChapters[0][0]
  let curStart = dayChapters[0][2]
  let curEnd = dayChapters[0][2]
  for (let i = 1; i < dayChapters.length; i++) {
    const [name, , ch] = dayChapters[i]
    if (name === curBook && ch === curEnd + 1) {
      curEnd = ch
    } else {
      parts.push(fmtRange(curBook, curStart, curEnd))
      curBook = name; curStart = ch; curEnd = ch
    }
  }
  parts.push(fmtRange(curBook, curStart, curEnd))
  return parts.join('; ')
}

// ---- Day-of-week content templates (7 distinct angles per week) ----
const DAY_FRAMES = [
  {
    notice: (t: string) => `As you begin this week's focus on ${t}, notice what today's reading introduces.`,
    reflection: (t: string) => `What is one thing in today's reading that challenges how you currently think about this week's focus on ${t}?`,
    prayer: (t: string) => `Ask God to open your heart to this week's focus on ${t}.`,
    action: (t: string) => `Write down one honest first thought about this week's focus on ${t} before the week unfolds further.`,
    titlePrefix: 'Beginning to See',
  },
  {
    notice: (t: string) => `Notice the details in today's passage that reveal more about this week's focus on ${t}.`,
    reflection: (t: string) => `What does today's reading show you about God's character in relation to this week's focus on ${t}?`,
    prayer: (t: string) => `Thank God for one truth about this week's focus on ${t}, revealed in today's reading.`,
    action: () => `Underline or note one verse from today's reading that stood out.`,
    titlePrefix: 'Looking Closer at',
  },
  {
    notice: () => `Notice how today's reading connects to your own life right now.`,
    reflection: (t: string) => `Where in your own life do you see this week's focus on ${t} playing out today?`,
    prayer: (t: string) => `Bring one specific personal situation to God related to this week's focus on ${t}.`,
    action: () => `Talk to someone you trust about what you're learning this week.`,
    titlePrefix: 'Living Out',
  },
  {
    notice: () => `Midweek — notice whether today's reading is confirming or correcting something in you.`,
    reflection: () => `Is today's passage confirming something you already believe, or correcting something?`,
    prayer: () => `Ask God for the humility to be corrected where needed.`,
    action: () => `Take one small, practical step connected to today's reading before the day ends.`,
    titlePrefix: 'Facing',
  },
  {
    notice: () => `Notice any resistance you feel toward what today's reading asks of you.`,
    reflection: (t: string) => `What is the honest reason you might resist living out this week's focus on ${t} fully?`,
    prayer: () => `Confess any resistance honestly and ask for a willing heart.`,
    action: () => `Identify one specific obstacle and name it in prayer.`,
    titlePrefix: 'Examining',
  },
  {
    notice: () => `Notice how this week's theme is meant to shape not just belief but practice.`,
    reflection: (t: string) => `How would someone close to you notice a change if you fully lived out this week's focus on ${t}?`,
    prayer: (t: string) => `Pray specifically for the strength to practise, not just understand, this week's focus on ${t}.`,
    action: () => `Do one visible, practical act connected to this week's theme today.`,
    titlePrefix: 'Practising',
  },
  {
    notice: () => `As the week closes, notice how far your understanding has moved since Day 1.`,
    reflection: () => `Looking back on this week, what has genuinely shifted in you?`,
    prayer: () => `Thank God for what He has shown you this week and ask Him to help it last.`,
    action: () => `Write one sentence summarising what you want to carry forward from this week.`,
    titlePrefix: 'Carrying Forward',
  },
]

function estimateMinutes(numChapters: number): number {
  const base = Math.round(numChapters * 2.5) + 5
  return Math.max(10, Math.min(20, base))
}

// ---- Reading reference -> book_id/chapter rows ----
const BOOK_ID_BY_NAME: Record<string, string> = {}
for (const [name, bid] of CANON) BOOK_ID_BY_NAME[name] = bid

function parseReadingRef(ref: string): { book_id: string; chapter: number }[] {
  const items: { book_id: string; chapter: number }[] = []
  for (const rawPart of ref.split(';')) {
    const part = rawPart.trim()
    const m = part.match(/^(.+?) (\d+)(?:-(\d+))?$/)
    if (!m) throw new Error(`Could not parse reading reference part: ${part}`)
    const bookName = m[1]
    const start = parseInt(m[2], 10)
    const end = m[3] ? parseInt(m[3], 10) : start
    const bookId = BOOK_ID_BY_NAME[bookName]
    if (!bookId) throw new Error(`Unknown book name: ${bookName}`)
    for (let ch = start; ch <= end; ch++) items.push({ book_id: bookId, chapter: ch })
  }
  return items
}

// ---- Main builder: produces the exact real-schema shape ----
export type ReadingDayOut = {
  day_number: number
  title: string
  description: string
  readingItems: { book_id: string; chapter: number; sort_order: number }[]
}

export function buildReadingPlanData(): {
  readingPlan: {
    title: string; description: string; duration_days: number
    difficulty: string; is_published: boolean
  }
  readingDays: ReadingDayOut[]
} {
  const weekByNum: Record<number, { week: number; month: number; title: string; scriptureFocus: string; objective: string; challenge: string }> = {}
  for (const [week, month, title, scriptureFocus, objective, challenge] of WEEKS) {
    weekByNum[week] = { week, month, title, scriptureFocus, objective, challenge }
  }
  const weekStartDay: Record<number, number> = {}
  for (let n = 1; n <= 52; n++) weekStartDay[n] = (n - 1) * 7 + 1

  const allocated = allocateDays() // 364 entries
  const readingDays: ReadingDayOut[] = []

  for (let weekNum = 1; weekNum <= 52; weekNum++) {
    const week = weekByNum[weekNum]
    const startDay = weekStartDay[weekNum]

    for (let offset = 0; offset < 7; offset++) {
      const dayNum = startDay + offset
      const chapters = allocated[dayNum - 1]
      const reference = formatReference(chapters)
      const frame = DAY_FRAMES[offset]

      const title = `${frame.titlePrefix}: ${week.title}`
      const notice = frame.notice(week.title)
      const reflection = frame.reflection(week.title)
      const prayerFocus = frame.prayer(week.title)
      const action = frame.action(week.title)
      const memoryVerse = MEMORY_VERSES[String(weekNum)]
      const estMinutes = estimateMinutes(chapters.length)

      const description = [
        `Theme: ${week.title}`, '',
        `Notice: ${notice}`, '',
        `Reflection: ${reflection}`, '',
        `Prayer Focus: ${prayerFocus}`, '',
        `Action: ${action}`, '',
        `Memory Verse: ${memoryVerse}`, '',
        `Estimated Time: ${estMinutes} minutes`,
        `(Month ${week.month}, Week ${weekNum} of the annual plan)`,
      ].join('\n')

      const readingItems = parseReadingRef(reference).map((item, idx) => ({
        book_id: item.book_id, chapter: item.chapter, sort_order: idx,
      }))

      readingDays.push({ day_number: dayNum, title, description, readingItems })
    }
  }

  // Day 365 — Annual Review
  const reviewDescription = [
    'Theme: Looking Back, Looking Forward', '',
    "Notice: There is no new reading today — pause and look back over the whole year.", '',
    'Reflection: Looking back across the whole year: What has genuinely grown in you? ' +
      'What lessons stand out? What habits have changed? What prayers have been answered? ' +
      'What Scriptures shaped you most? Who did you influence along the way? What is one ' +
      'area you still want to grow in?', '',
    'Prayer Focus: Thank God for the whole year of growth, and ask Him for the next season.', '',
    "Action: Write a short personal letter to yourself, summarising this year's growth and " +
      'naming one or two spiritual goals for the year ahead.', '',
    'Memory Verse: Psalm 90:12', '',
    'Estimated Time: 20 minutes',
    '(Annual Review Day)',
  ].join('\n')

  readingDays.push({
    day_number: 365,
    title: "Annual Review: A Year in God's Word",
    description: reviewDescription,
    readingItems: [{ book_id: 'PSA', chapter: 90, sort_order: 0 }],
  })

  const readingPlan = {
    title: "Release. Renew. Restore. Revive. — A Year in God's Word",
    description:
      'A one-year journey through the entire Bible, structured around a 12-month spiritual ' +
      'progression — from encountering God, through identity, trust, prayer, character, ' +
      'wisdom, relationships, holiness, purpose, service and mission, to a lifelong walk of ' +
      'maturity. Key verse: "Your word is a lamp for my feet, a light on my path." — Psalm 119:105.',
    duration_days: 365,
    difficulty: 'beginner',
    is_published: false,
  }

  return { readingPlan, readingDays }
}