'use client'

import type { HTMLAttributes } from 'react'
import { ThemeScope, type ThemeInput } from '@youj/core'
import { AppPage } from '../../components/ui/app-page'
import { Toaster } from '../../components/ui/toast'
import { cn } from '../../lib/utils'
import { Board, NewLoadButton } from './dispatch-board/components/board'
import { useDispatch } from './dispatch-board/use-dispatch'

/* A freight dispatcher's day, content only (the app's frame brings the
 * navigation). A page header with New load, over the board:
 * - KPIs in a StatGroup (on the road, on time, at risk, awaiting you,
 *   drivers free) that follow every decision.
 * - The dispatch queue: load cards with status, lane, times, driver and
 *   priority, filtered by pills; the selected load is drawn on the RouteMap.
 * - The RouteMap: the selected load driven, delayed and ahead, the agent's
 *   reroute dotted in the accent, every other truck as a marker you can
 *   pick (all on the road, or only the late ones). A ProposalCard over the
 *   map weighs current against proposed ETA: Approve reroute, or Compare
 *   the two in a popover.
 * - TimeLanes as the drivers' day: runs labeled by load, late overruns in
 *   danger, proposed runs dashed, now at 11:58.
 * - The dispatch agent's proposals as ProposalCards (approve, review,
 *   dismiss, then undo from the card or the toast), and what it handled.
 * Demo content — edit after adding. Reduced motion: routes draw in place,
 * the now line and cards land at once. */

interface DispatchBoardProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'title'> {
  /** Wraps the screen in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** A page in your app's frame: the shared page header (AppPage, with New load) and the frame's gutter, across the whole width. Default true; `false` draws its own page (a "Dispatch" title row over a centered canvas). */
  embedded?: boolean
  /** The load drawn on the map at first. Default 'LD-4821', the one at risk. */
  defaultLoad?: string
}

function DispatchBoard({ theme, embedded = true, defaultLoad, className, ...rest }: DispatchBoardProps) {
  const state = useDispatch(defaultLoad)
  return (
    <ThemeScope theme={theme}>
      {embedded ? (
        <AppPage {...rest} title="Dispatch board" actions={<NewLoadButton />} width="fill" className={cn('text-fg', className)}>
          <Board state={state} embedded />
        </AppPage>
      ) : (
        <main className={cn('min-h-dvh bg-chrome text-fg', className)} {...rest}>
          <div className="mx-auto w-full max-w-400 p-4 sm:p-6">
            <Board state={state} />
          </div>
        </main>
      )}
      <Toaster />
    </ThemeScope>
  )
}

export { DispatchBoard }
export type { DispatchBoardProps }
