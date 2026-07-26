// ─── PRAYER WALL TYPES ───────────────────────────────────────────────────────
export type PrayerPrivacy  = 'private' | 'anonymous' | 'community' | 'public'
export type PrayerStatus   = 'active'  | 'answered'  | 'archived'  | 'removed'
export type PrayerCategory =
  | 'healing' | 'family' | 'relationships' | 'work'
  | 'financial' | 'salvation' | 'mental-health'
  | 'grief'   | 'gratitude'  | 'ministry'     | 'other'

export const PRAYER_CATEGORIES: { id: PrayerCategory; label: string; icon: string }[] = [
  { id: 'healing',       label: 'Healing',       icon: '🌿' },
  { id: 'family',        label: 'Family',         icon: '👨‍👩‍👧‍👦' },
  { id: 'relationships', label: 'Relationships',  icon: '❤️'  },
  { id: 'work',          label: 'Work & Career',  icon: '💼' },
  { id: 'financial',     label: 'Financial',      icon: '🙏' },
  { id: 'salvation',     label: 'Salvation',      icon: '✝️'  },
  { id: 'mental-health', label: 'Mental Health',  icon: '💛' },
  { id: 'grief',         label: 'Grief & Loss',   icon: '💧' },
  { id: 'gratitude',     label: 'Gratitude',      icon: '✨' },
  { id: 'ministry',      label: 'Ministry',       icon: '📖' },
  { id: 'other',         label: 'Other',          icon: '🕊️' },
]

export const PRIVACY_OPTIONS: { id: PrayerPrivacy; label: string; icon: string; description: string }[] = [
  { id: 'private',   label: 'Private',   icon: '🔒', description: 'Only you can see this — default' },
  { id: 'anonymous', label: 'Anonymous', icon: '👤', description: 'Shared without your name'        },
  { id: 'community', label: 'Community', icon: '👥', description: 'Visible to registered members'   },
  { id: 'public',    label: 'Public',    icon: '🌍', description: 'Visible to everyone'             },
]

export type PrayerRequest = {
  id:                 string
  title:              string
  content:            string
  category:           PrayerCategory
  privacy:            PrayerPrivacy
  display_name:       string | null
  country_code:       string | null
  status:             PrayerStatus
  prayer_count:       number
  is_featured:        boolean
  created_at:         string
  answered_at:        string | null
  has_prayed?:        boolean
  has_saved?:         boolean
  is_owner?:          boolean
  encouragement_count?:number
  attachment_url?:    string | null
  attachment_type?:   'image' | 'pdf' | null
}

export type PrayerEncouragement = {
  id:         string
  request_id: string
  type:       'prayed' | 'encouragement' | 'verse'
  content:    string | null
  created_at: string
}

export type PrayerAnswered = {
  id:              string
  request_id:      string
  testimony:       string
  bible_verse:     string | null
  thanksgiving:    string | null
  praise_category: string
  is_public:       boolean
  created_at:      string
  request_title?:  string
}

export const REPORT_REASONS = [
  { id: 'spam',           label: 'Spam or advertising' },
  { id: 'scam',           label: 'Scam or fraud'        },
  { id: 'offensive',      label: 'Offensive content'    },
  { id: 'misinformation', label: 'False information'    },
  { id: 'harassment',     label: 'Harassment'           },
  { id: 'other',          label: 'Other'                },
]

export const PRAISE_CATEGORIES = [
  { id: 'healing',   label: 'Healing'              },
  { id: 'family',    label: 'Family'               },
  { id: 'employment',label: 'Employment'           },
  { id: 'salvation', label: 'Salvation'            },
  { id: 'financial', label: 'Financial Provision'  },
  { id: 'ministry',  label: 'Ministry'             },
  { id: 'other',     label: 'Other'                },
]