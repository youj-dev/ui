'use client'

import { ArrowLeftIcon, ArrowRightIcon, LinkIcon } from '@youj/icons'
import { Button } from '@youj/react/components/ui/button'
import { AsyncButton } from '@youj/react/components/ui/async-button'
import { Progress } from '@youj/react/components/ui/progress'
import type { Week } from '../data'
import { span } from '../format'
import { Num } from './num'

/**
 * The masthead: the paper's name, whose books these are, and the week. The
 * arrows (and [ and ]) turn it; the number rolls at once, and a hairline
 * runs along the foot while the week loads.
 */
export function Masthead({ week, loading, earlier, later, onTurn }: { week: Week; loading: boolean; earlier: boolean; later: boolean; onTurn: (by: 1 | -1) => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/92 youj-allow-glass backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[76rem] items-center gap-3 px-5 md:px-8">
        <span className="flex min-w-0 items-baseline gap-3">
          <span className="text-xl leading-none font-semibold tracking-tight whitespace-nowrap text-fg italic">The Ledger</span>
          <span className="truncate text-ui text-fg-muted max-sm:hidden">Meadow Tea Co. · Revenue</span>
        </span>
        <nav aria-label="Weeks" className="ms-auto flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="Earlier week" aria-keyshortcuts="[" disabled={!earlier} onClick={() => onTurn(1)} data-yj-trigger="">
            <ArrowLeftIcon size={16} className="rtl:-scale-x-100" />
          </Button>
          <span aria-live="polite" className="flex min-w-[9.5rem] items-baseline justify-center gap-2 text-ui-lg whitespace-nowrap max-sm:min-w-0">
            <span className="font-semibold text-fg">
              Week <Num value={week.number} format={{}} />
            </span>
            <span className="text-fg-muted max-sm:hidden">{span(week)}</span>
          </span>
          <Button variant="ghost" size="icon-sm" aria-label="Later week" aria-keyshortcuts="]" disabled={!later} onClick={() => onTurn(-1)} data-yj-trigger="">
            <ArrowRightIcon size={16} className="rtl:-scale-x-100" />
          </Button>
        </nav>
        <AsyncButton variant="outline" size="sm" className="max-sm:hidden" successLabel="Link copied" onAction={() => new Promise((resolve) => setTimeout(resolve, 350))} data-yj-trigger="">
          <LinkIcon size={14} /> Share
        </AsyncButton>
      </div>
      {loading && (
        <Progress
          value={null}
          aria-label={`Loading week ${week.number}`}
          className="absolute inset-x-0 -bottom-px [&_[data-slot=progress-track]]:h-0.5 [&_[data-slot=progress-track]]:rounded-none [&_[data-slot=progress-track]]:bg-transparent"
        />
      )}
    </header>
  )
}
