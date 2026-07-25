// ─── BIBLE MOCK DATA ──────────────────────────────────────────────────────────
// Structured identically to Bible.com API response format.
// Replace with live API calls when credentials are available.
// ASD Chapter 4 API contracts govern all field names.

import type { Translation, Book, Chapter, SearchResult } from '../types'

export const TRANSLATIONS: Translation[] = [
  { id: '3034', code: 'BSB',   name: 'Berean Standard Bible',   language: 'en', abbreviation: 'BSB',   isAvailable: true },
  { id: '12',   code: 'ASV',   name: 'American Standard Version', language: 'en', abbreviation: 'ASV', isAvailable: true },
  { id: '206',  code: 'WEBUS', name: 'World English Bible',    language: 'en', abbreviation: 'WEBUS', isAvailable: true },
]
export const BOOKS: Book[] = [


  { id:'b1', bookId:'GEN', name:'Genesis', abbreviation:'Gen', testament:'OT', bookOrder:1, chapterCount:50, group:'Pentateuch' },
  { id:'b2', bookId:'EXO', name:'Exodus', abbreviation:'Exo', testament:'OT', bookOrder:2, chapterCount:40, group:'Pentateuch' },
  { id:'b3', bookId:'LEV', name:'Leviticus', abbreviation:'Lev', testament:'OT', bookOrder:3, chapterCount:27, group:'Pentateuch' },
  { id:'b4', bookId:'NUM', name:'Numbers', abbreviation:'Num', testament:'OT', bookOrder:4, chapterCount:36, group:'Pentateuch' },
  { id:'b5', bookId:'DEU', name:'Deuteronomy', abbreviation:'Deut', testament:'OT', bookOrder:5, chapterCount:34, group:'Pentateuch' },
  { id:'b6', bookId:'JOS', name:'Joshua', abbreviation:'Josh', testament:'OT', bookOrder:6, chapterCount:24, group:'Historical' },
  { id:'b7', bookId:'JDG', name:'Judges', abbreviation:'Judg', testament:'OT', bookOrder:7, chapterCount:21, group:'Historical' },
  { id:'b8', bookId:'RUT', name:'Ruth', abbreviation:'Ruth', testament:'OT', bookOrder:8, chapterCount:4, group:'Historical' },
  { id:'b9', bookId:'1SA', name:'1 Samuel', abbreviation:'1 Sam', testament:'OT', bookOrder:9, chapterCount:31, group:'Historical' },
  { id:'b10', bookId:'2SA', name:'2 Samuel', abbreviation:'2 Sam', testament:'OT', bookOrder:10, chapterCount:24, group:'Historical' },
  { id:'b11', bookId:'1KI', name:'1 Kings', abbreviation:'1 Kgs', testament:'OT', bookOrder:11, chapterCount:22, group:'Historical' },
  { id:'b12', bookId:'2KI', name:'2 Kings', abbreviation:'2 Kgs', testament:'OT', bookOrder:12, chapterCount:25, group:'Historical' },
  { id:'b13', bookId:'1CH', name:'1 Chronicles', abbreviation:'1 Chr', testament:'OT', bookOrder:13, chapterCount:29, group:'Historical' },
  { id:'b14', bookId:'2CH', name:'2 Chronicles', abbreviation:'2 Chr', testament:'OT', bookOrder:14, chapterCount:36, group:'Historical' },
  { id:'b15', bookId:'EZR', name:'Ezra', abbreviation:'Ezra', testament:'OT', bookOrder:15, chapterCount:10, group:'Historical' },
  { id:'b16', bookId:'NEH', name:'Nehemiah', abbreviation:'Neh', testament:'OT', bookOrder:16, chapterCount:13, group:'Historical' },
  { id:'b17', bookId:'EST', name:'Esther', abbreviation:'Esth', testament:'OT', bookOrder:17, chapterCount:10, group:'Historical' },
  { id:'b18', bookId:'JOB', name:'Job', abbreviation:'Job', testament:'OT', bookOrder:18, chapterCount:42, group:'Wisdom' },
  { id:'b19', bookId:'PSA', name:'Psalms', abbreviation:'Ps', testament:'OT', bookOrder:19, chapterCount:150, group:'Wisdom' },
  { id:'b20', bookId:'PRO', name:'Proverbs', abbreviation:'Prov', testament:'OT', bookOrder:20, chapterCount:31, group:'Wisdom' },
  { id:'b21', bookId:'ECC', name:'Ecclesiastes', abbreviation:'Eccl', testament:'OT', bookOrder:21, chapterCount:12, group:'Wisdom' },
  { id:'b22', bookId:'SNG', name:'Song of Songs', abbreviation:'Song', testament:'OT', bookOrder:22, chapterCount:8, group:'Wisdom' },
  { id:'b23', bookId:'ISA', name:'Isaiah', abbreviation:'Isa', testament:'OT', bookOrder:23, chapterCount:66, group:'Major Prophets' },
  { id:'b24', bookId:'JER', name:'Jeremiah', abbreviation:'Jer', testament:'OT', bookOrder:24, chapterCount:52, group:'Major Prophets' },
  { id:'b25', bookId:'LAM', name:'Lamentations', abbreviation:'Lam', testament:'OT', bookOrder:25, chapterCount:5, group:'Major Prophets' },
  { id:'b26', bookId:'EZK', name:'Ezekiel', abbreviation:'Ezek', testament:'OT', bookOrder:26, chapterCount:48, group:'Major Prophets' },
  { id:'b27', bookId:'DAN', name:'Daniel', abbreviation:'Dan', testament:'OT', bookOrder:27, chapterCount:12, group:'Major Prophets' },
  { id:'b28', bookId:'HOS', name:'Hosea', abbreviation:'Hos', testament:'OT', bookOrder:28, chapterCount:14, group:'Minor Prophets' },
  { id:'b29', bookId:'JOL', name:'Joel', abbreviation:'Joel', testament:'OT', bookOrder:29, chapterCount:3, group:'Minor Prophets' },
  { id:'b30', bookId:'AMO', name:'Amos', abbreviation:'Amos', testament:'OT', bookOrder:30, chapterCount:9, group:'Minor Prophets' },
  { id:'b31', bookId:'OBA', name:'Obadiah', abbreviation:'Obad', testament:'OT', bookOrder:31, chapterCount:1, group:'Minor Prophets' },
  { id:'b32', bookId:'JON', name:'Jonah', abbreviation:'Jonah', testament:'OT', bookOrder:32, chapterCount:4, group:'Minor Prophets' },
  { id:'b33', bookId:'MIC', name:'Micah', abbreviation:'Mic', testament:'OT', bookOrder:33, chapterCount:7, group:'Minor Prophets' },
  { id:'b34', bookId:'NAH', name:'Nahum', abbreviation:'Nah', testament:'OT', bookOrder:34, chapterCount:3, group:'Minor Prophets' },
  { id:'b35', bookId:'HAB', name:'Habakkuk', abbreviation:'Hab', testament:'OT', bookOrder:35, chapterCount:3, group:'Minor Prophets' },
  { id:'b36', bookId:'ZEP', name:'Zephaniah', abbreviation:'Zeph', testament:'OT', bookOrder:36, chapterCount:3, group:'Minor Prophets' },
  { id:'b37', bookId:'HAG', name:'Haggai', abbreviation:'Hag', testament:'OT', bookOrder:37, chapterCount:2, group:'Minor Prophets' },
  { id:'b38', bookId:'ZEC', name:'Zechariah', abbreviation:'Zech', testament:'OT', bookOrder:38, chapterCount:14, group:'Minor Prophets' },
  { id:'b39', bookId:'MAL', name:'Malachi', abbreviation:'Mal', testament:'OT', bookOrder:39, chapterCount:4, group:'Minor Prophets' },
  { id:'b40', bookId:'MAT', name:'Matthew', abbreviation:'Matt', testament:'NT', bookOrder:40, chapterCount:28, group:'Gospels' },
  { id:'b41', bookId:'MRK', name:'Mark', abbreviation:'Mark', testament:'NT', bookOrder:41, chapterCount:16, group:'Gospels' },
  { id:'b42', bookId:'LUK', name:'Luke', abbreviation:'Luke', testament:'NT', bookOrder:42, chapterCount:24, group:'Gospels' },
  { id:'b43', bookId:'JHN', name:'John', abbreviation:'John', testament:'NT', bookOrder:43, chapterCount:21, group:'Gospels' },
  { id:'b44', bookId:'ACT', name:'Acts', abbreviation:'Acts', testament:'NT', bookOrder:44, chapterCount:28, group:'History' },
  { id:'b45', bookId:'ROM', name:'Romans', abbreviation:'Rom', testament:'NT', bookOrder:45, chapterCount:16, group:"Paul's Letters" },
  { id:'b46', bookId:'1CO', name:'1 Corinthians', abbreviation:'1 Cor', testament:'NT', bookOrder:46, chapterCount:16, group:"Paul's Letters" },
  { id:'b47', bookId:'2CO', name:'2 Corinthians', abbreviation:'2 Cor', testament:'NT', bookOrder:47, chapterCount:13, group:"Paul's Letters" },
  { id:'b48', bookId:'GAL', name:'Galatians', abbreviation:'Gal', testament:'NT', bookOrder:48, chapterCount:6, group:"Paul's Letters" },
  { id:'b49', bookId:'EPH', name:'Ephesians', abbreviation:'Eph', testament:'NT', bookOrder:49, chapterCount:6, group:"Paul's Letters" },
  { id:'b50', bookId:'PHP', name:'Philippians', abbreviation:'Phil', testament:'NT', bookOrder:50, chapterCount:4, group:"Paul's Letters" },
  { id:'b51', bookId:'COL', name:'Colossians', abbreviation:'Col', testament:'NT', bookOrder:51, chapterCount:4, group:"Paul's Letters" },
  { id:'b52', bookId:'1TH', name:'1 Thessalonians', abbreviation:'1 Thess', testament:'NT', bookOrder:52, chapterCount:5, group:"Paul's Letters" },
  { id:'b53', bookId:'2TH', name:'2 Thessalonians', abbreviation:'2 Thess', testament:'NT', bookOrder:53, chapterCount:3, group:"Paul's Letters" },
  { id:'b54', bookId:'1TI', name:'1 Timothy', abbreviation:'1 Tim', testament:'NT', bookOrder:54, chapterCount:6, group:"Paul's Letters" },
  { id:'b55', bookId:'2TI', name:'2 Timothy', abbreviation:'2 Tim', testament:'NT', bookOrder:55, chapterCount:4, group:"Paul's Letters" },
  { id:'b56', bookId:'TIT', name:'Titus', abbreviation:'Titus', testament:'NT', bookOrder:56, chapterCount:3, group:"Paul's Letters" },
  { id:'b57', bookId:'PHM', name:'Philemon', abbreviation:'Phlm', testament:'NT', bookOrder:57, chapterCount:1, group:"Paul's Letters" },
  { id:'b58', bookId:'HEB', name:'Hebrews', abbreviation:'Heb', testament:'NT', bookOrder:58, chapterCount:13, group:'General Letters' },
  { id:'b59', bookId:'JAS', name:'James', abbreviation:'Jas', testament:'NT', bookOrder:59, chapterCount:5, group:'General Letters' },
  { id:'b60', bookId:'1PE', name:'1 Peter', abbreviation:'1 Pet', testament:'NT', bookOrder:60, chapterCount:5, group:'General Letters' },
  { id:'b61', bookId:'2PE', name:'2 Peter', abbreviation:'2 Pet', testament:'NT', bookOrder:61, chapterCount:3, group:'General Letters' },
  { id:'b62', bookId:'1JN', name:'1 John', abbreviation:'1 John', testament:'NT', bookOrder:62, chapterCount:5, group:'General Letters' },
  { id:'b63', bookId:'2JN', name:'2 John', abbreviation:'2 John', testament:'NT', bookOrder:63, chapterCount:1, group:'General Letters' },
  { id:'b64', bookId:'3JN', name:'3 John', abbreviation:'3 John', testament:'NT', bookOrder:64, chapterCount:1, group:'General Letters' },
  { id:'b65', bookId:'JUD', name:'Jude', abbreviation:'Jude', testament:'NT', bookOrder:65, chapterCount:1, group:'General Letters' },
  { id:'b66', bookId:'REV', name:'Revelation', abbreviation:'Rev', testament:'NT', bookOrder:66, chapterCount:22, group:'Prophecy' },
]

// Sample chapter — John 3 (used as default/demo)
export const JOHN_3: Chapter = {
  id: 'JHN.3',
  bookId: 'JHN',
  bookName: 'John',
  chapterNumber: 3,
  totalVerses: 36,
  translation: 'NIV',
  previousChapter: { bookId: 'JHN', chapterNumber: 2 },
  nextChapter:     { bookId: 'JHN', chapterNumber: 4 },
  verses: [
    { id:'JHN.3.1',  verseNumber:1,  reference:'John 3:1',  text:'Now there was a Pharisee, a man named Nicodemus who was a member of the Jewish ruling council.' },
    { id:'JHN.3.2',  verseNumber:2,  reference:'John 3:2',  text:'He came to Jesus at night and said, "Rabbi, we know that you are a teacher who has come from God. For no one could perform the signs you are doing if God were not with him."' },
    { id:'JHN.3.3',  verseNumber:3,  reference:'John 3:3',  text:'Jesus replied, "Very truly I tell you, no one can see the kingdom of God unless they are born again."' },
    { id:'JHN.3.4',  verseNumber:4,  reference:'John 3:4',  text:'"How can someone be born when they are old?" Nicodemus asked. "Surely they cannot enter a second time into their mother\'s womb to be born!"' },
    { id:'JHN.3.5',  verseNumber:5,  reference:'John 3:5',  text:'Jesus answered, "Very truly I tell you, no one can enter the kingdom of God unless they are born of water and the Spirit."' },
    { id:'JHN.3.6',  verseNumber:6,  reference:'John 3:6',  text:'"Flesh gives birth to flesh, but the Spirit gives birth to spirit."' },
    { id:'JHN.3.7',  verseNumber:7,  reference:'John 3:7',  text:'"You should not be surprised at my saying, \'You must be born again.\'"' },
    { id:'JHN.3.14', verseNumber:14, reference:'John 3:14', text:'Just as Moses lifted up the snake in the wilderness, so the Son of Man must be lifted up,' },
    { id:'JHN.3.15', verseNumber:15, reference:'John 3:15', text:'that everyone who believes may have eternal life in him.' },
    { id:'JHN.3.16', verseNumber:16, reference:'John 3:16', text:'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.' },
    { id:'JHN.3.17', verseNumber:17, reference:'John 3:17', text:'For God did not send his Son into the world to condemn the world, but to save the world through him.' },
    { id:'JHN.3.18', verseNumber:18, reference:'John 3:18', text:'Whoever believes in him is not condemned, but whoever does not believe stands condemned already because they have not believed in the name of God\'s one and only Son.' },
    { id:'JHN.3.36', verseNumber:36, reference:'John 3:36', text:'Whoever believes in the Son has eternal life, but whoever rejects the Son will not see life, for God\'s wrath remains on them.' },
  ],
}

export const PSA_23: Chapter = {
  id: 'PSA.23',
  bookId: 'PSA',
  bookName: 'Psalms',
  chapterNumber: 23,
  totalVerses: 6,
  translation: 'NIV',
  previousChapter: { bookId: 'PSA', chapterNumber: 22 },
  nextChapter:     { bookId: 'PSA', chapterNumber: 24 },
  verses: [
    { id:'PSA.23.1', verseNumber:1, reference:'Psalm 23:1', text:'The Lord is my shepherd, I lack nothing.' },
    { id:'PSA.23.2', verseNumber:2, reference:'Psalm 23:2', text:'He makes me lie down in green pastures, he leads me beside quiet waters,' },
    { id:'PSA.23.3', verseNumber:3, reference:'Psalm 23:3', text:'he refreshes my soul. He guides me along the right paths for his name\'s sake.' },
    { id:'PSA.23.4', verseNumber:4, reference:'Psalm 23:4', text:'Even though I walk through the darkest valley, I will fear no evil, for you are with me; your rod and your staff, they comfort me.' },
    { id:'PSA.23.5', verseNumber:5, reference:'Psalm 23:5', text:'You prepare a table before me in the presence of my enemies. You anoint my head with oil; my cup overflows.' },
    { id:'PSA.23.6', verseNumber:6, reference:'Psalm 23:6', text:'Surely your goodness and love will follow me all the days of my life, and I will dwell in the house of the Lord forever.' },
  ],
}

// Sample search results
export const SAMPLE_SEARCH_RESULTS: SearchResult[] = [
  { verseId:'JHN.3.16', reference:'John 3:16',     text:'For God so loved the world that he gave his one and only Son…',          bookId:'JHN', bookName:'John',        chapterNumber:3,   verseNumber:16, translation:'NIV', matchedWords:['loved'] },
  { verseId:'ROM.8.28', reference:'Romans 8:28',   text:'And we know that in all things God works for the good of those who love…',bookId:'ROM', bookName:'Romans',      chapterNumber:8,   verseNumber:28, translation:'NIV', matchedWords:['love'] },
  { verseId:'1JN.4.8',  reference:'1 John 4:8',    text:'Whoever does not love does not know God, because God is love.',          bookId:'1JN', bookName:'1 John',      chapterNumber:4,   verseNumber:8,  translation:'NIV', matchedWords:['love','God'] },
  { verseId:'PSA.23.1', reference:'Psalm 23:1',    text:'The Lord is my shepherd, I lack nothing.',                               bookId:'PSA', bookName:'Psalms',      chapterNumber:23,  verseNumber:1,  translation:'NIV', matchedWords:['Lord'] },
  { verseId:'PHP.4.13', reference:'Philippians 4:13',text:'I can do all this through him who gives me strength.',                 bookId:'PHP', bookName:'Philippians', chapterNumber:4,   verseNumber:13, translation:'NIV', matchedWords:['strength'] },
]

// Mock chapter fetcher — returns appropriate mock data for known chapters
export function getMockChapter(bookId: string, chapter: number, translation: string): Chapter | null {
  if (bookId === 'JHN' && chapter === 3)  return { ...JOHN_3, translation }
  if (bookId === 'PSA' && chapter === 23) return { ...PSA_23, translation }
  
  // Generic fallback for other chapters
  const book = BOOKS.find(b => b.bookId === bookId)
  if (!book || chapter < 1 || chapter > book.chapterCount) return null
  
  return {
    id:            `${bookId}.${chapter}`,
    bookId,
    bookName:      book.name,
    chapterNumber: chapter,
    totalVerses:   10,
    translation,
    previousChapter: chapter > 1 ? { bookId, chapterNumber: chapter - 1 } : null,
    nextChapter:   chapter < book.chapterCount ? { bookId, chapterNumber: chapter + 1 } : null,
    verses: Array.from({ length: 10 }, (_, i) => ({
      id:          `${bookId}.${chapter}.${i + 1}`,
      verseNumber: i + 1,
      reference:   `${book.name} ${chapter}:${i + 1}`,
      text:        `[Connect Bible.com API to display ${book.name} ${chapter}:${i + 1} (${translation})]`,
    })),
  }
}