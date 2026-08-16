// Content-safety checks for Prayer Wall submissions (UAE personal-data-safety compliance).
// Shared between the client form (fast feedback) and the server route (cannot be bypassed).

export type BlockedMatch = { name: string; matches: string[] }

export const BLOCKED_PATTERNS: { name: string; regex: RegExp }[] = [
  { name: 'email', regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi },
  { name: 'phone', regex: /(\+\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}/g },
  { name: 'url', regex: /(https?:\/\/|www\.)[^\s]+/gi },
  { name: 'money', regex: /\b(donate|donation|pay|payment|transfer|bank|money|cash)\b/gi },
  { name: 'address', regex: /\b(\d+\s+(street|st|avenue|ave|road|rd|lane|ln|drive|dr)|p\.?o\.?\s*box)\b/gi },
]

export const BLOCKED_MESSAGE =
  'For safety, please remove personal contact info, links, or donation requests from your prayer.'

/** Returns which pattern categories matched, with their matched strings (for debugging/logging, never shown raw to other users). */
export function findBlockedContent(text: string): BlockedMatch[] {
  const found: BlockedMatch[] = []
  for (const { name, regex } of BLOCKED_PATTERNS) {
    const matches = text.match(regex)
    if (matches && matches.length > 0) {
      found.push({ name, matches })
    }
  }
  return found
}

/** Simple boolean check for form gating. */
export function containsBlockedContent(text: string): boolean {
  return findBlockedContent(text).length > 0
}

/** Auto-censor: replaces every match with [removed], preserving the rest of the text. */
export function sanitizeContent(text: string): string {
  let result = text
  for (const { regex } of BLOCKED_PATTERNS) {
    result = result.replace(regex, '[removed]')
  }
  return result
}