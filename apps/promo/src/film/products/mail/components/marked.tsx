const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Text with the search marked and, in a letter, the days it names underlined
 * with a dotted rule that ties them to the margin.
 */
export function Marked({ text, query, dates = [] }: { text: string; query: string; dates?: string[] }) {
  const q = query.trim()
  const terms = [...(q ? [q] : []), ...dates].filter(Boolean)
  if (!terms.length) return text
  return text.split(new RegExp(`(${terms.map(escape).join('|')})`, 'gi')).map((part, i) => {
    if (i % 2 === 0) return part
    if (q && part.toLowerCase() === q.toLowerCase())
      return (
        <mark key={i} className="rounded-xs bg-accent-subtle text-fg">
          {part}
        </mark>
      )
    return (
      <span key={i} className="underline decoration-accent decoration-dotted decoration-[1.5px] underline-offset-[0.25em]">
        {part}
      </span>
    )
  })
}
