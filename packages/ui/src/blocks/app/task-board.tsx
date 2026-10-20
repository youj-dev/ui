'use client'

import { useState, type ComponentProps, type ReactNode } from 'react'
import { PlusIcon } from '@youj/icons'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '../../components/ui/alert'
import { AppPage } from '../../components/ui/app-page'
import { Button } from '../../components/ui/button'
import { Kanban, type KanbanColumn, type KanbanMove } from '../../components/ui/kanban'
import { Skeleton } from '../../components/ui/skeleton'
import { cn } from '../../lib/utils'
import { COLUMNS, DEFAULT_COPY, SPRINT, TASKS, type BoardCopy, type BoardPriority, type BoardSprint, type BoardTask, type BoardTone } from './task-board/data'
import { Sprint } from './task-board/sprint'
import { TaskCard } from './task-board/task-card'

/* A screen: the tasks on your plate as a board, Backlog to Done. It's
 * the library's Kanban: drag a card (touch: press and hold) and it lifts
 * into a tilted preview while a gap opens where it will land; from the
 * keyboard, arrows walk the cards, Space picks one up, arrows carry it and
 * Space drops it, every step announced. In progress has a limit of four and
 * warns past it. Over it, the sprint: its goal, the points done as a meter
 * of cells, each column's share and the team, all counted from the cards,
 * so they follow every move. Each card carries its checklist as a bar of
 * cells, its comments, its points and who's on it. The open count in the
 * header follows the board. Columns
 * share the page's width and scroll sideways when it runs out. Pass your
 * own `columns` and `tasks` and persist `onMove` (a rejection puts the card
 * back); every string is in `copy`. Reduced motion: no lift or glide, cards
 * land at once. */

interface TaskBoardProps extends Omit<ComponentProps<'div'>, 'title' | 'children'> {
  /** A page in your app's frame: the shared page header (AppPage) and the frame's gutter, across the whole width. Default true; `false` draws its own page (a canvas with a `main`). */
  embedded?: boolean
  /** The page's heading. Default "My tasks". */
  title?: string
  /** The heading's level. Default 1. */
  headingLevel?: 1 | 2 | 3
  /** Extra classes for the header and the board. */
  classNames?: Partial<Record<'header' | 'content', string>>
  /** The columns, left to right; a `limit` warns past it. Default: Backlog, In progress (4), In review and Done. */
  columns?: KanbanColumn[]
  /** The cards, each placed by its `column`. A new array replaces them. Default: Northwind's fifteen. */
  tasks?: BoardTask[]
  /** Tints for your own labels, by label: a task's own `labelTone` still wins. Default: every label in one quiet neutral pill. */
  labelTones?: Record<string, BoardTone>
  /** The sprint over the board; null leaves it out. Default: Northwind's Sprint 14. */
  sprint?: BoardSprint | null
  /** A card moved; receives the move and every task after it. Return a promise to put the card back if it rejects. */
  onMove?: (move: KanbanMove<BoardTask>, tasks: BoardTask[]) => Promise<unknown> | unknown
  /** Enter, or a click, on a card. */
  onOpen?: (task: BoardTask) => void
  /** The New task button. */
  onCreate?: () => void
  /** The header's buttons, in place of New task. */
  actions?: ReactNode
  /** Shows skeleton columns in place of the board. Default false. */
  loading?: boolean
  /** A load error, shown in place of the board with `onRetry`. */
  error?: ReactNode
  /** The error's "Try again". */
  onRetry?: () => void
  /** Replaces the board when there are no tasks at all. Default: the board's empty columns. */
  empty?: ReactNode
  /** Any of the page's strings, to rewrite or translate. */
  copy?: Partial<BoardCopy>
}

const reason = (error: unknown) => (error instanceof Error ? error.message : String(error))

function TaskBoard({
  embedded = true,
  title = 'My tasks',
  headingLevel = 1,
  className,
  classNames,
  columns = COLUMNS,
  tasks: tasksProp = TASKS,
  labelTones,
  sprint = SPRINT,
  onMove,
  onOpen,
  onCreate,
  actions,
  loading = false,
  error,
  onRetry,
  empty,
  copy: copyProp,
  ...rest
}: TaskBoardProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const [tasks, setTasks] = useState(tasksProp)
  // A new `tasks` from the app replaces the board kept here.
  const [given, setGiven] = useState(tasksProp)
  if (given !== tasksProp) {
    setGiven(tasksProp)
    setTasks(tasksProp)
  }
  const [failure, setFailure] = useState<string>()
  const open = tasks.filter((t) => t.column !== copy.doneColumn).length

  const move = (step: KanbanMove<BoardTask>, next: BoardTask[]) => {
    const before = tasks
    setTasks(next)
    setFailure(undefined)
    const result = onMove?.(step, next)
    if (!(result instanceof Promise)) return result
    return result.catch((e: unknown) => {
      setTasks(before)
      setFailure(reason(e))
      throw e
    })
  }

  const page = (
    <AppPage
      {...rest}
      title={title}
      description={<span className="tabular-nums">{copy.subtitle(open)}</span>}
      actions={
        actions ?? (
          <Button onClick={onCreate}>
            <PlusIcon size={16} strokeWidth={1.75} /> {copy.newTask}
          </Button>
        )
      }
      headingLevel={headingLevel}
      width="fill"
      className={className}
      classNames={{ header: classNames?.header }}
    >
      {failure && (
        <Alert variant="danger" onOpenChange={() => setFailure(undefined)}>
          <AlertTitle>{copy.failed}</AlertTitle>
          <AlertDescription>{failure}</AlertDescription>
        </Alert>
      )}
      {error != null ? (
        <Alert variant="danger" className={classNames?.content}>
          <AlertTitle>{copy.errorTitle}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          {onRetry && (
            <AlertAction>
              <Button variant="outline" size="sm" onClick={onRetry}>
                {copy.retry}
              </Button>
            </AlertAction>
          )}
        </Alert>
      ) : loading ? (
        <div aria-busy className={cn('flex gap-3 overflow-hidden', classNames?.content)}>
          {columns.map((c) => (
            <div key={c.id} aria-hidden className="flex w-64 shrink-0 flex-col gap-2 rounded-xl border border-line bg-transparent p-2">
              <Skeleton className="m-1 h-3.5 w-24" />
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ))}
        </div>
      ) : tasks.length === 0 && empty !== undefined ? (
        empty
      ) : (
        <>
          {sprint && <Sprint sprint={sprint} columns={columns} tasks={tasks} copy={copy} />}
          <Kanban
            columns={columns}
            cards={tasks}
            onMove={move}
            onCardAction={onOpen && ((task) => onOpen(task))}
            renderCard={(task) => <TaskCard task={task} copy={copy} labelTones={labelTones} />}
            fill
            // Four columns of 16rem fit beside an open sidebar at 1440px; the board still scrolls when they don't.
            className={cn('-mx-1 [&_[data-kanban-scroller]_section:not([data-collapsed])]:w-64', classNames?.content)}
          />
        </>
      )}
    </AppPage>
  )
  return embedded ? (
    page
  ) : (
    <div className="min-h-dvh w-full bg-canvas text-fg">
      <main>{page}</main>
    </div>
  )
}

export { TaskBoard }
export type { TaskBoardProps, BoardCopy, BoardPriority, BoardSprint, BoardTask, BoardTone }
