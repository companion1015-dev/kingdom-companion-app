// ─── MOCK DATA ────────────────────────────────────────────────────────────────
// All data structured to mirror the Bible.com API contract.
// Replace with live API calls when credentials are available.

export const dailyVerse = {
  reference: 'Isaiah 40:31',
  text: 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.',
  translation: 'NIV',
  book: 'Isaiah',
  bookId: 'ISA',
  chapter: 40,
  verse: 31,
}

export const dailyEncouragement = {
  date: new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' }),
  verse: { reference: 'Psalm 46:1', text: 'God is our refuge and strength, an ever-present help in trouble.', translation: 'NIV' },
  reflection: 'Whatever you are carrying today, you are not carrying it alone. God does not merely observe our struggles from a distance — He enters them with us.',
  prayer: 'Lord, be my refuge today. Where I am weak, be my strength. Where I am afraid, be my peace.',
  challenge: 'Spend five quiet minutes meditating on Psalm 46 before you begin your day.',
}

export const emotions = [
  // Quick-access (shown by default)
  { id: 'peace',        label: 'Peace',        icon: '🕊️', color: 'from-sage/20 to-sage/10',       border: 'border-sage/30',       description: 'I need calm' },
  { id: 'anxiety',      label: 'Anxious',      icon: '🌊', color: 'from-blue-400/20 to-blue-300/10', border: 'border-blue-400/30',   description: 'Feeling worried' },
  { id: 'hope',         label: 'Hope',         icon: '🌅', color: 'from-gold/20 to-gold/10',         border: 'border-gold/30',       description: 'Seeking hope' },
  { id: 'grief',        label: 'Grief',        icon: '💧', color: 'from-slate-400/20 to-slate-300/10', border: 'border-slate-400/30', description: 'Hurting inside' },
  { id: 'gratitude',    label: 'Grateful',     icon: '✨', color: 'from-amber-400/20 to-amber-300/10', border: 'border-amber-400/30', description: 'Thankful today' },
  { id: 'fear',         label: 'Afraid',       icon: '🛡️', color: 'from-red-400/20 to-red-300/10',   border: 'border-red-400/30',    description: 'Feeling scared' },
  // Extended list (revealed via "More topics" dropdown)
  { id: 'loneliness',   label: 'Lonely',       icon: '🌙', color: 'from-indigo-400/20 to-indigo-300/10', border: 'border-indigo-400/30', description: 'Feeling alone' },
  { id: 'joy',          label: 'Joyful',       icon: '☀️', color: 'from-yellow-400/20 to-yellow-300/10', border: 'border-yellow-400/30', description: 'Full of joy' },
  { id: 'forgiveness',  label: 'Forgiveness',  icon: '🤝', color: 'from-green-400/20 to-green-300/10', border: 'border-green-400/30', description: 'Need to forgive' },
  { id: 'doubt',        label: 'Doubting',     icon: '❓', color: 'from-purple-400/20 to-purple-300/10', border: 'border-purple-400/30', description: 'Questioning faith' },
  { id: 'healing',      label: 'Healing',      icon: '🌿', color: 'from-emerald-400/20 to-emerald-300/10', border: 'border-emerald-400/30', description: 'Need healing' },
  { id: 'purpose',      label: 'Purpose',      icon: '🧭', color: 'from-cyan-400/20 to-cyan-300/10', border: 'border-cyan-400/30',   description: 'Lost direction' },
  { id: 'anger',        label: 'Angry',        icon: '🔥', color: 'from-orange-500/20 to-orange-400/10', border: 'border-orange-500/30', description: 'Feeling angry' },
  { id: 'shame',        label: 'Shame',        icon: '🫥', color: 'from-stone-400/20 to-stone-300/10', border: 'border-stone-400/30', description: 'Carrying shame' },
  { id: 'overwhelmed',  label: 'Overwhelmed',  icon: '🌪️', color: 'from-sky-400/20 to-sky-300/10',   border: 'border-sky-400/30',    description: 'Too much at once' },
  { id: 'guilt',        label: 'Guilty',       icon: '⚖️', color: 'from-rose-400/20 to-rose-300/10', border: 'border-rose-400/30',   description: 'Feeling guilty' },
  { id: 'burnout',      label: 'Exhausted',    icon: '🪫', color: 'from-zinc-400/20 to-zinc-300/10', border: 'border-zinc-400/30',   description: 'Running on empty' },
  { id: 'confusion',    label: 'Confused',     icon: '🌀', color: 'from-violet-400/20 to-violet-300/10', border: 'border-violet-400/30', description: 'Unsure what to do' },
  { id: 'jealousy',     label: 'Jealous',      icon: '👁️', color: 'from-lime-500/20 to-lime-400/10', border: 'border-lime-500/30',   description: 'Comparing myself' },
  { id: 'rejection',    label: 'Rejected',     icon: '🚪', color: 'from-fuchsia-400/20 to-fuchsia-300/10', border: 'border-fuchsia-400/30', description: 'Feeling left out' },
  { id: 'temptation',   label: 'Tempted',      icon: '⚔️', color: 'from-red-500/20 to-red-400/10',   border: 'border-red-500/30',    description: 'Struggling with sin' },
  { id: 'contentment',  label: 'Content',      icon: '🌾', color: 'from-teal-400/20 to-teal-300/10', border: 'border-teal-400/30',   description: 'At peace with life' },
  { id: 'financial',    label: 'Financial Stress', icon: '💰', color: 'from-emerald-500/20 to-emerald-400/10', border: 'border-emerald-500/30', description: 'Worried about money' },
  { id: 'health',       label: 'Health Worry', icon: '🏥', color: 'from-pink-400/20 to-pink-300/10', border: 'border-pink-400/30',   description: 'Concerned about health' },
  { id: 'relationships',label: 'Relationships',icon: '💞', color: 'from-rose-500/20 to-rose-400/10', border: 'border-rose-500/30',   description: 'Struggling in a relationship' },
  { id: 'parenting',    label: 'Parenting',    icon: '👨‍👩‍👧',  color: 'from-amber-500/20 to-amber-400/10', border: 'border-amber-500/30', description: 'Navigating parenthood' },
  { id: 'grief_loss',   label: 'Loss of a Loved One', icon: '🕯️', color: 'from-slate-500/20 to-slate-400/10', border: 'border-slate-500/30', description: 'Mourning someone' },
  { id: 'new_season',   label: 'New Season',   icon: '🌱', color: 'from-lime-400/20 to-lime-300/10', border: 'border-lime-400/30',   description: 'Facing a fresh start' },
  { id: 'thankfulness', label: 'Praise',       icon: '🙌', color: 'from-gold/20 to-yellow-300/10',   border: 'border-gold/30',       description: 'Wanting to praise God' },
]

export const featuredDevotional = {
  id: 'peace-in-chaos',
  title: 'Peace in Chaos',
  subtitle: 'A 30-day journey through Scripture',
  description: "When life feels unmanageable, God's Word offers an anchor. This devotional walks you through thirty days of Scripture, reflection, and prayer — one quiet step at a time.",
  duration: '30 days',
  currentDay: 1,
  coverGradient: 'from-navy to-navy-light',
  theme: 'Peace',
  todayVerse: { reference: 'John 14:27', text: 'Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.' },
}

export const readingPlans = [
  { id: 'bible-in-year',  title: 'Bible in One Year',    duration: '365 days', category: 'Complete Bible',  progress: 0 },
  { id: 'psalms-30',      title: 'Psalms in 30 Days',    duration: '30 days',  category: 'Wisdom',          progress: 0 },
  { id: 'new-testament',  title: '90-Day New Testament', duration: '90 days',  category: 'New Testament',   progress: 0 },
  { id: 'life-of-jesus',  title: 'Life of Jesus',        duration: '40 days',  category: 'Gospels',         progress: 0 },
]

export const navLinks = [
  { label: 'Home',             href: '/' },
  { label: 'Bible',            href: '/bible' },
  { label: 'Study',            href: '/study' },
  { label: 'Companion',        href: '/companion' },
  { label: 'Topics',           href: '/topics' },
  { label: 'Daily',            href: '/daily' },
  { label: 'Devotionals',      href: '/devotionals' },
  { label: 'Books',            href: '/books' },
  { label: 'Reading Plans',    href: '/reading-plans' },
  { label: 'Prayer Wall',      href: '/prayer-wall' },
  { label: 'Live Prayer',      href: '/prayer-live' },
  { label: 'Blog',             href: '/blog' },
  { label: 'Give',             href: '/support' },
  { label: 'About',            href: '/about' },
]

// Shown only to signed-in users -- previously mixed into navLinks above and
// shown to everyone regardless of auth state, even though every one of
// these leads straight to a "please sign in" wall for anonymous visitors.
export const authNavLinks = [
  { label: 'My Dashboard',     href: '/dashboard' },
  { label: 'Prayer Journal',   href: '/journal' },
  { label: 'Invite Friends',   href: '/invite' },
  { label: 'My Profile',       href: '/profile' },
]

export const bibleBooks = [
  // Old Testament
  { id: 'GEN', name: 'Genesis',      testament: 'OT', group: 'Pentateuch' },
  { id: 'EXO', name: 'Exodus',       testament: 'OT', group: 'Pentateuch' },
  { id: 'LEV', name: 'Leviticus',    testament: 'OT', group: 'Pentateuch' },
  { id: 'NUM', name: 'Numbers',      testament: 'OT', group: 'Pentateuch' },
  { id: 'DEU', name: 'Deuteronomy',  testament: 'OT', group: 'Pentateuch' },
  { id: 'PSA', name: 'Psalms',       testament: 'OT', group: 'Wisdom' },
  { id: 'PRO', name: 'Proverbs',     testament: 'OT', group: 'Wisdom' },
  // New Testament
  { id: 'MAT', name: 'Matthew',      testament: 'NT', group: 'Gospels' },
  { id: 'MRK', name: 'Mark',         testament: 'NT', group: 'Gospels' },
  { id: 'LUK', name: 'Luke',         testament: 'NT', group: 'Gospels' },
  { id: 'JHN', name: 'John',         testament: 'NT', group: 'Gospels' },
  { id: 'ROM', name: 'Romans',       testament: 'NT', group: 'Epistles' },
  { id: 'PHP', name: 'Philippians',  testament: 'NT', group: 'Epistles' },
  { id: 'REV', name: 'Revelation',   testament: 'NT', group: 'Prophecy' },
]
