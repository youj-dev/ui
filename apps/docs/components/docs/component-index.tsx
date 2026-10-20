import Link from 'next/link'
import { sectionTrail } from '@/lib/sections'
import { source } from '@/lib/source'

/**
 * MDX: `<ComponentIndex />`. Every component and motion piece by name, A to
 * Z, each with the group it lives in, for the reader who knows what it's
 * called but not where it's filed. Read from the content, so a new page is
 * listed the moment it exists.
 */
export function ComponentIndex() {
  const entries = source
    .getPages()
    .filter((page) => /^components\/|^motion\/\(/.test(page.path) && page.url !== '/docs/components')
    .map((page) => {
      // The group alone: Primitives and Transitions are only ever Motion's, and the chat kit is a group of its own.
      const [, group] = sectionTrail(page.slugs)
      return { title: page.data.title, url: page.url, where: group }
    })
    .sort((a, b) => a.title.localeCompare(b.title, 'en'))

  const letters = new Map<string, typeof entries>()
  for (const entry of entries) {
    const letter = entry.title[0]!.toUpperCase()
    letters.set(letter, [...(letters.get(letter) ?? []), entry])
  }

  return (
    <div className="not-prose mt-6 columns-1 gap-x-8 sm:columns-2 md:columns-3">
      {[...letters].map(([letter, items]) => (
        <section key={letter} aria-labelledby={`index-${letter}`} className="mb-6 break-inside-avoid">
          <h3 id={`index-${letter}`} className="type-label mb-2 border-b border-line pb-1.5">
            {letter}
          </h3>
          <ul className="flex flex-col">
            {items.map((item) => (
              <li key={item.url}>
                <Link
                  href={item.url}
                  prefetch={false}
                  className="group/entry flex items-baseline justify-between gap-3 rounded-sm py-1 text-[13.5px] focus-ring"
                >
                  <span className="text-fg underline-offset-4 group-hover/entry:underline">{item.title}</span>
                  {item.where && <span className="truncate text-[12px] text-fg-subtle">{item.where}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
