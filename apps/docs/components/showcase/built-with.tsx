import { IntentLink } from '@/components/site/intent-link'
import type { ShowcaseLink } from '@/lib/showcase'

/** The components a block or example is built from, each linked to its page. */
export function BuiltWith({ links, label = 'Built with' }: { links: ShowcaseLink[]; label?: string }) {
  if (!links.length) return null
  return (
    <div>
      <h3 className="type-label">{label}</h3>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {links.map((l) => (
          <li key={l.url}>
            <IntentLink
              href={l.url}
              className="inline-flex h-7 items-center rounded-md border border-line bg-surface px-2.5 text-[12.5px] text-fg-muted transition-colors duration-(--yj-duration-fast) ease-standard hover:border-line-strong hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {l.title}
            </IntentLink>
          </li>
        ))}
      </ul>
    </div>
  )
}
