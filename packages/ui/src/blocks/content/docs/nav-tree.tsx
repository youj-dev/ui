'use client'

import { SlidingIndicator } from '@youj/motion'
import { Collapsible, CollapsibleChevron, CollapsibleContent, CollapsibleTrigger } from '../../../components/ui/collapsible'
import { cn } from '../../../lib/utils'
import { groupsOf, type Page } from './data'
import { DocLink } from './doc-link'

export function NavTree({ pages, label, current, onNavigate }: { pages: Page[]; label: string; current: string; onNavigate: (id: string) => void }) {
  return (
    <nav aria-label={label} className="relative isolate flex flex-col gap-4">
      {groupsOf(pages).map((group) => (
        <Collapsible key={group} defaultOpen>
          <CollapsibleTrigger className="focus-ring flex w-full items-center gap-2 rounded-md px-2 py-1 text-start text-ui-sm font-semibold text-fg">
            {group}
            <CollapsibleChevron size={13} className="ms-auto text-fg-muted" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="mt-1 flex flex-col gap-px border-s border-line ms-2">
              {pages.filter((p) => p.group === group).map((p) => (
                <li key={p.id}>
                  <DocLink
                    page={p}
                    aria-current={p.id === current ? 'page' : undefined}
                    onNavigate={onNavigate}
                    className={cn(
                      'focus-ring -ms-px flex h-control-sm items-center rounded-e-md border-s border-transparent ps-3 pe-2 text-ui text-fg-muted transition-colors yj-duration-fast ease-standard hover:text-fg',
                      'aria-[current=page]:border-accent aria-[current=page]:font-medium aria-[current=page]:text-fg',
                    )}
                  >
                    {p.title}
                  </DocLink>
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      ))}
      <SlidingIndicator match="[aria-current=page]" className="rounded-e-md bg-accent-subtle" />
    </nav>
  )
}
