// ─── BIBLE TYPE DEFINITIONS ───────────────────────────────────────────────────
// Mirrors ASD Chapter 4 API contracts and DSD Chapter 1 schema exactly.
// These types are shared across API routes, services, and UI components.

export type Translation = {
  id:               string
  code:             string  // e.g. 'NIV', 'KJV', 'ESV'
  name:             string
  language:         string
  abbreviation:     string
  isAvailable:      boolean
  isDownloaded?:    boolean
}

export type Book = {
  id:           string
  bookId:       string  // Bible.com book ID e.g. 'GEN', 'JHN'
  name:         string
  abbreviation: string
  testament:    'OT' | 'NT'
  bookOrder:    number
  chapterCount: number
  group:        string  // e.g. 'Gospels', 'Pentateuch'
}

export type Verse = {
  id:          string  // Bible.com verse ID
  verseNumber: number
  reference:   string  // e.g. 'John 3:16'
  text:        string
  footnote?:   string
}

export type Chapter = {
  id:            string
  bookId:        string
  bookName:      string
  chapterNumber: number
  totalVerses:   number
  translation:   string
  verses:        Verse[]
  previousChapter?: { bookId: string; chapterNumber: number } | null
  nextChapter?:     { bookId: string; chapterNumber: number } | null
}

export type SearchResult = {
  verseId:        string
  reference:      string
  text:           string
  bookId:         string
  bookName:       string
  chapterNumber:  number
  verseNumber:    number
  translation:    string
  matchedWords:   string[]
}

export type SearchResponse = {
  results:     SearchResult[]
  total:       number
  query:       string
  translation: string
}

// Bible.com API book groups — UXS Chapter 4 navigation structure
export const BOOK_GROUPS: Record<string, string[]> = {
  // Old Testament
  'Pentateuch':     ['GEN','EXO','LEV','NUM','DEU'],
  'Historical':     ['JOS','JDG','RUT','1SA','2SA','1KI','2KI','1CH','2CH','EZR','NEH','EST'],
  'Wisdom':         ['JOB','PSA','PRO','ECC','SNG'],
  'Major Prophets': ['ISA','JER','LAM','EZK','DAN'],
  'Minor Prophets': ['HOS','JOL','AMO','OBA','JON','MIC','NAH','HAB','ZEP','HAG','ZEC','MAL'],
  // New Testament
  'Gospels':        ['MAT','MRK','LUK','JHN'],
  'History':        ['ACT'],
  'Paul\'s Letters':['ROM','1CO','2CO','GAL','EPH','PHP','COL','1TH','2TH','1TI','2TI','TIT','PHM'],
  'General Letters':['HEB','JAS','1PE','2PE','1JN','2JN','3JN','JUD'],
  'Prophecy':       ['REV'],
}

export const OT_GROUPS = ['Pentateuch','Historical','Wisdom','Major Prophets','Minor Prophets']
export const NT_GROUPS = ['Gospels','History','Paul\'s Letters','General Letters','Prophecy']

// Default reading position
export type ReadingPosition = {
  translation:   string
  bookId:        string
  bookName:      string
  chapterNumber: number
  scrollOffset?: number
  savedAt:       string
}