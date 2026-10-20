'use client'

import { CalendarIcon, ListChecksIcon, MessageIcon } from '@youj/icons'
import { Avatar, AvatarFallback, AvatarGroup } from '../../../components/ui/avatar'
import { Badge, BadgeDot } from '../../../components/ui/badge'
import { ShareBar } from '../../../components/ui/share-bar'
import { cn } from '../../../lib/utils'
import { initials, type BoardCopy, type BoardPriority, type BoardTask, type BoardTone } from './data'

/* The inside of a task card (the Card itself, its focus, lift and drag are
 * the Kanban's): priority, key and when it's due; the title; the label and
 * the project, which wrap rather than crowd a narrow column; its checklist
 * as a bar of cells ("3/5", green once it's all done); then its comments,
 * its estimate in points and who's on it, as overlapping avatars. Only the
 * title is required: a row with nothing to show is left out.
 * The card is a button named by its content, so that content is one
 * sentence for assistive tech and the rows are drawn beside it for the eye. */

const BARS: Record<BoardPriority, number> = { urgent: 3, high: 3, medium: 2, low: 1 }

/* A label is a quiet neutral pill with a dot, one scheme for every label, so the
 * board's colour stays on status and priority; `labelTone`/`labelTones` tint one on purpose. */
const LABEL_TONE: BoardTone = 'secondary'

/** Three rising bars, filled to the priority; urgent fills them in danger. */
function PriorityGlyph({ priority, name }: { priority: BoardPriority; name: string }) {
  const bars = BARS[priority]
  return (
    <span title={name} className="flex h-3 w-3.5 shrink-0 items-end gap-px">
      {[0.45, 0.72, 1].map((height, i) => (
        <span
          key={height}
          style={{ height: `${height * 100}%` }}
          className={cn('flex-1 rounded-[1px]', i >= bars ? 'bg-well' : priority === 'urgent' ? 'bg-danger' : 'bg-fg-muted')}
        />
      ))}
    </span>
  )
}

export function TaskCard({ task, copy, labelTones }: { task: BoardTask; copy: BoardCopy; labelTones?: Record<string, BoardTone> }) {
  const done = task.column === copy.doneColumn
  const priority = task.priority && copy[task.priority]
  const dueShown = Boolean(task.due && !done)
  const people = [task.assignee, ...(task.people ?? [])].filter((p): p is string => Boolean(p))
  const head = [task.title, task.key].filter(Boolean).join(', ')
  const meta = [
    priority,
    task.label,
    task.project,
    dueShown && copy.due(task.due!),
    task.assignee && copy.assigned(task.assignee),
    task.people?.length && copy.with(task.people),
    task.subtasks && copy.subtasks(task.subtasks.done, task.subtasks.total),
    task.comments && copy.comments(task.comments),
    task.points && copy.points(task.points),
  ]
    .filter(Boolean)
    .join(', ')
  const finished = task.subtasks && task.subtasks.done >= task.subtasks.total
  return (
    <>
      <span className="sr-only">{meta ? `${head}. ${meta}.` : `${head}.`}</span>
      {(task.priority || task.key || dueShown) && (
        <div aria-hidden className="flex items-center gap-2 px-(--card-spacing) text-ui-sm text-fg-muted">
          {task.priority && <PriorityGlyph priority={task.priority} name={priority!} />}
          {task.key && <span className="font-mono tabular-nums">{task.key}</span>}
          {dueShown && (
            <span
              className={cn(
                'ms-auto flex shrink-0 items-center gap-1 rounded-sm px-1 tabular-nums',
                task.due === copy.today && 'bg-[color-mix(in_oklab,var(--color-warning)_14%,transparent)] text-warning-text',
              )}
            >
              <CalendarIcon size={12} strokeWidth={1.75} />
              {task.due}
            </span>
          )}
        </div>
      )}
      <p aria-hidden className={cn('px-(--card-spacing) text-ui leading-snug font-medium text-fg', done && 'text-fg-muted line-through decoration-line-strong')}>
        {task.title}
      </p>
      {(task.label || task.project) && (
        <div aria-hidden className="flex min-w-0 flex-wrap items-center gap-1.5 px-(--card-spacing)">
          {task.label && (
            <Badge variant={task.labelTone ?? labelTones?.[task.label] ?? LABEL_TONE}>
              <BadgeDot />
              {task.label}
            </Badge>
          )}
          {task.project && <Badge variant="secondary">{task.project}</Badge>}
        </div>
      )}
      {task.subtasks && task.subtasks.total > 0 && !done && (
        <div aria-hidden className="flex items-center gap-2 px-(--card-spacing) text-ui-xs text-fg-muted">
          <ListChecksIcon size={13} strokeWidth={1.75} className={cn('shrink-0', finished && 'text-success-text')} />
          <ShareBar value={task.subtasks.done} max={task.subtasks.total} segments={task.subtasks.total} tone={finished ? 'success' : 'accent'} className="min-w-0 flex-1" />
          <span className="shrink-0 font-mono tabular-nums">
            {task.subtasks.done}/{task.subtasks.total}
          </span>
        </div>
      )}
      {(people.length > 0 || task.comments || task.points) && (
        <div aria-hidden className="flex items-center gap-3 border-t border-line-subtle px-(--card-spacing) pt-2 text-ui-xs text-fg-muted">
          {task.comments ? (
            <span className="flex items-center gap-1 tabular-nums">
              <MessageIcon size={13} strokeWidth={1.75} />
              {task.comments}
            </span>
          ) : null}
          {task.points ? <span className="rounded-sm border border-line px-1.5 font-mono leading-5 tabular-nums">{task.points} pt</span> : null}
          {people.length > 0 && (
            <AvatarGroup className="ms-auto -space-x-1 *:data-[slot=avatar]:ring-surface">
              {people.slice(0, 3).map((name) => (
                <Avatar key={name} size="sm">
                  <AvatarFallback>{initials(name)}</AvatarFallback>
                </Avatar>
              ))}
            </AvatarGroup>
          )}
        </div>
      )}
    </>
  )
}
