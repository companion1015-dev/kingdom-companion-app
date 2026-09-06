// Shared renderer for a DiscipleshipChapter/DiscipleshipBook "sections" block:
// plain text where blank lines separate paragraphs, "• " starts a bullet, and
// a Scripture quote is a quoted line followed by "— Reference". Rendered with
// simple pattern checks rather than a markdown parser, since the author's
// manuscripts only ever use these three shapes. Shared by the book table-of-
// contents page (volume summary) and the chapter reader page.

export default function SectionBody({ body }: { body: string }) {
  const blocks = body.split('\n\n')
  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        const lines = block.split('\n').filter(Boolean)
        const isBulletList = lines.length > 0 && lines.every(l => l.startsWith('• '))
        const isQuote = lines.length === 2 && lines[0].startsWith('"') && lines[1].startsWith('— ')

        if (isBulletList) {
          return (
            <ul key={i} className="space-y-1.5 list-disc list-inside">
              {lines.map((l, j) => <li key={j} className="text-navy/80 dark:text-cream/80 leading-relaxed">{l.slice(2)}</li>)}
            </ul>
          )
        }
        if (isQuote) {
          return (
            <blockquote key={i} className="border-l-2 border-gold/50 pl-4 italic text-navy/85 dark:text-cream/85">
              <p className="leading-relaxed">{lines[0]}</p>
              <cite className="block not-italic text-xs text-charcoal/50 dark:text-cream/50 mt-1">{lines[1]}</cite>
            </blockquote>
          )
        }
        return <p key={i} className="text-navy/80 dark:text-cream/80 leading-relaxed whitespace-pre-line">{block}</p>
      })}
    </div>
  )
}
