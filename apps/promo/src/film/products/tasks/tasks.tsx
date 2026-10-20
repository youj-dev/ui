'use client'

import { basalt, ThemeScope, type ThemeInput } from '@youj/core'
import { Reveal } from '@youj/motion'
import { Toaster } from '@youj/react/components/ui/toast'
import { useIsMobile } from '@youj/react/hooks/use-mobile'
import { cn } from '@youj/react/lib/utils'
import { Board } from './components/board'
import { EmptyRunway } from './components/empty-runway'
import { Header } from './components/header'
import { Runway } from './components/runway'
import { TaskSheet } from './components/task-sheet'
import { useTandem, type Scenario, type View } from './use-tandem'

/* Tandem: plan a launch as a runway. Brightwater Studio's First Flush launch
 * for Meadow Tea Co.: each task a bar on the days it runs, a lane per person,
 * and every handoff between them drawn in, so the chain that sets the launch
 * date is plain to see.
 * - The runway (runway.tsx): drag a bar to move it and its end to stretch it;
 *   what waits on it glides aside as you go, and the line at the top says at
 *   once whether the launch still lands. From the keyboard: the arrows move
 *   between bars and move them a day, Shift stretches, Enter opens.
 * - The board (board.tsx): the same tasks on the library's Kanban, by stage.
 * - A task opens as a Sheet with its form and everything that happened to it.
 * - Every change is announced with what it pushed, and can be undone.
 * - Reduced motion: bars and lines land in place; the verdict swaps. */

interface TasksExampleProps {
  /** The view it opens on. Default the runway. */
  defaultView?: View
  /** The project it opens on: 'first-flush' (the default) or 'harvest', which has nothing planned yet. */
  defaultProject?: 'first-flush' | 'harvest'
  /** How the launch plan stands when it opens: on track (the default), slipping (the artwork ran long) or ready (everything handed off). */
  scenario?: Scenario
  /** The theme it wears. Default: Basalt. */
  theme?: ThemeInput
}

function TasksExample({ theme = basalt, defaultView = 'runway', defaultProject = 'first-flush', scenario = 'on-track' }: TasksExampleProps) {
  return (
    <ThemeScope theme={theme}>
      <Tandem defaultView={defaultView} defaultProject={defaultProject} scenario={scenario} />
    </ThemeScope>
  )
}

function Tandem(props: Required<Omit<TasksExampleProps, 'theme'>>) {
  const compact = useIsMobile()
  const tandem = useTandem(props)
  const empty = tandem.project.tasks.length === 0
  return (
    <div className="flex h-dvh flex-col bg-canvas text-fg">
      <Header tandem={tandem} compact={compact} />
      <main className={cn('flex min-h-0 flex-1 flex-col', tandem.view === 'runway' && 'overflow-y-auto yj-scrollbar')}>
        {tandem.announcer}
        <Reveal key={`${tandem.project.id}-${tandem.view}`} inView={false} variant="fade" duration="base" className="flex min-h-0 flex-1 flex-col">
          {empty ? (
            <EmptyRunway launchIn={tandem.project.launch} onAdd={tandem.create} />
          ) : tandem.view === 'runway' ? (
            <div className="pb-10">
              <Runway tandem={tandem} compact={compact} />
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col pt-4">
              <Board tandem={tandem} />
            </div>
          )}
        </Reveal>
      </main>
      <TaskSheet tandem={tandem} />
      <Toaster />
    </div>
  )
}

export { TasksExample }
export type { TasksExampleProps }
