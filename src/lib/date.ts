// Local (browser) calendar date as YYYY-MM-DD -- deliberately NOT
// `Date.prototype.toISOString().slice(0,10)`, which converts to UTC first
// and so returns the wrong day for anyone west/east of UTC near midnight.
export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
