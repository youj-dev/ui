import { IntentLink } from '@/components/site/intent-link'
import type * as PageTree from 'fumadocs-core/page-tree'
import { ArrowLeftIcon, ArrowRightIcon } from '@/components/client'
import { cn } from '@/lib/cn'

function PagerLink({ item, direction }: { item: PageTree.Item; direction: 'previous' | 'next' }) {
  const next = direction === 'next'
  const Arrow = next ? ArrowRightIcon : ArrowLeftIcon
  return (
    <IntentLink
      href={item.url}
      rel={next ? 'next' : 'prev'}
      className={cn(
        'group/pager inline-flex items-baseline gap-2 rounded-sm py-1 text-ui tracking-tight text-fg-muted transition-colors yj-duration-fast ease-standard hover:text-fg focus-ring',
        next && 'justify-self-end text-end sm:col-start-2',
      )}
    >
      {!next && <Arrow size={13} strokeWidth={1.75} aria-hidden className="shrink-0 self-center rtl:-scale-x-100" />}
      <span className="type-label">{next ? 'Next' : 'Previous'}</span>
      <span className="font-medium text-fg">{item.name}</span>
      {next && <Arrow size={13} strokeWidth={1.75} aria-hidden className="shrink-0 self-center rtl:-scale-x-100" />}
    </IntentLink>
  )
}

/** Previous and next in the sidebar's order, as two quiet text links at the head of the page's footer. */
export function Pager({ previous, next }: { previous?: PageTree.Item; next?: PageTree.Item }) {
  if (!previous && !next) return null
  return (
    <nav aria-label="Pages" className="not-prose grid gap-1 sm:grid-cols-2">
      {previous && <PagerLink item={previous} direction="previous" />}
      {next && <PagerLink item={next} direction="next" />}
    </nav>
  )
}
