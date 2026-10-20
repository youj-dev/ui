'use client'

import { ThemeScope, type ThemeInput } from '@youj/core'
import { PageTransition } from '@youj/motion/interactions'
import { useIsMobile } from '@youj/react/hooks/use-mobile'
import { cn } from '@youj/react/lib/utils'
import { Colophon } from './components/colophon'
import { DriverDetail } from './components/driver-detail'
import { Evidence } from './components/evidence'
import { Finding } from './components/finding'
import { Masthead } from './components/masthead'
import { MemoNotes } from './components/memo-notes'
import { ledgerTheme } from './theme'
import { useLedger } from './use-ledger'

/* The Ledger: analytics with a point of view. Every Monday it writes the
 * memo a good analyst would: why revenue moved last week, with the evidence.
 * Meadow Tea Co.'s books, in its own FT-salmon theme.
 * - The memo: the finding as the headline and the week in figures
 *   (finding.tsx); the running total against last week and the eight weeks
 *   before, with the moments that mattered numbered on the line, beside the
 *   bridge from last week's total to this week's, one driver at a time
 *   (evidence.tsx); products last week against this, and what to watch
 *   (memo-notes.tsx).
 * - Drill down: select a driver (click, or arrow through them once one is
 *   open) and the page turns to it: its finding becomes the headline, a
 *   "without it" line peels away from this week's, and its evidence
 *   (driver-detail.tsx) replaces the products. Escape goes back.
 * - Turn the week from the masthead, or with [ and ]: the page dims while it
 *   loads, then the finding rises in, every figure rolls, the lines morph,
 *   the bridge builds itself again and the products re-rank. The week in
 *   progress is an honest empty state with the pace so far.
 * - Reduced motion: every change lands at once; nothing loops. */

interface AnalyticsExampleProps {
  /** The week it opens on, counted back from this one: 1 (the default) is last week's memo; 0 is the week in progress. */
  defaultWeek?: 0 | 1 | 2 | 3
  /** A driver of that week to open on, e.g. 'email', 'outage' or 'wholesale'. Default: none, the memo itself. */
  defaultDriver?: string
  /** How long a week takes to arrive when you turn to it, in ms. Default 420. */
  latency?: number
  /** The theme it wears. Default: Ledger, its own salmon paper. */
  theme?: ThemeInput
}

function AnalyticsExample({ theme = ledgerTheme, ...props }: AnalyticsExampleProps) {
  return (
    <ThemeScope theme={theme}>
      <Ledger {...props} />
    </ThemeScope>
  )
}

function Ledger({ defaultWeek = 1, defaultDriver, latency = 420 }: Omit<AnalyticsExampleProps, 'theme'>) {
  const compact = useIsMobile()
  const { weeks, week, targetWeek, target, driver, loading, turn, select, back, headline, announcer } = useLedger({ defaultWeek, defaultDriver, latency })
  return (
    <div className="min-h-dvh bg-canvas text-fg">
      <Masthead week={targetWeek} loading={loading} earlier={target < weeks.length - 1} later={target > 0} onTurn={(by) => turn(target + by)} />
      <main>
        {announcer}
        <article
          aria-labelledby="ledger-headline"
          aria-busy={loading || undefined}
          className={cn('mx-auto max-w-[76rem] px-5 pb-16 transition-opacity yj-duration-base ease-standard md:px-8', loading && 'opacity-45')}
        >
          <Finding week={week} driver={driver} headline={headline} onBack={back} />
          <Evidence week={week} driver={driver} compact={compact} lastWeek={weeks[1]!.number} onSelect={select} onLastWeek={() => turn(1)} />
          {week.offset > 0 && (
            <PageTransition routeKey={`${week.offset}-${driver?.id ?? 'memo'}`} variant="fade-through" className="border-t border-line">
              {driver ? <DriverDetail driver={driver} /> : <MemoNotes week={week} />}
            </PageTransition>
          )}
          <Colophon week={week} />
        </article>
      </main>
    </div>
  )
}

export { AnalyticsExample }
export type { AnalyticsExampleProps }
