'use client'

import { useState } from 'react'
import { ArrowRight, ArrowUp, Equal, SignalHigh, Trash2 } from 'lucide-react'
import {
  Avatar,
  AvatarFallback,
  Badge,
  ContextMenuItem,
  ContextMenuSeparator,
  Kanban,
  type KanbanCardData,
  type KanbanColumn,
} from '@youj/react'

interface Issue extends KanbanCardData {
  key: string
  priority: 'urgent' | 'high' | 'medium'
  label: string
  assignee: string
}

const COLUMNS: KanbanColumn[] = [
  { id: 'todo', title: 'To do', tone: 'accent' },
  { id: 'doing', title: 'In progress', tone: 'warning', limit: 3 },
  { id: 'review', title: 'In review', tone: 'accent', limit: 2 },
  { id: 'done', title: 'Done', tone: 'success' },
]

const issue = (key: string, column: string, title: string, rest: Partial<Issue> = {}): Issue => ({
  id: key,
  key,
  column,
  title,
  priority: 'medium',
  label: 'Feature',
  assignee: 'LH',
  ...rest,
})

const ISSUES: Issue[] = [
  issue('ENG-188', 'todo', 'Fix login redirect loop on Safari', { priority: 'urgent', label: 'Bug', assignee: 'AR' }),
  issue('ENG-192', 'todo', 'Keyboard shortcuts cheat sheet'),
  issue('ENG-205', 'todo', 'Migrate cron jobs to the queue', { label: 'Infra', assignee: 'JO' }),
  issue('ENG-176', 'doing', 'Inline editing for issue titles', { priority: 'high', assignee: 'MK' }),
  issue('ENG-181', 'doing', 'Dark mode for charts', { label: 'Design', assignee: 'AR' }),
  issue('ENG-170', 'review', 'Bulk-assign from the list view', { assignee: 'LH' }),
  issue('ENG-163', 'done', 'Onboarding checklist', { label: 'Growth', assignee: 'MK' }),
]

const PRIORITY = {
  urgent: { Icon: ArrowUp, label: 'Urgent', className: 'text-danger-text' },
  high: { Icon: SignalHigh, label: 'High priority', className: 'text-warning-text' },
  medium: { Icon: Equal, label: 'Medium priority', className: 'text-fg-muted' },
}

const TONE = { Bug: 'danger', Feature: 'default', Design: 'secondary', Infra: 'warning', Growth: 'success' } as const

/** The inside of a card. The board draws the card itself: its surface, focus ring and drag handling. */
function IssueCard({ issue }: { issue: Issue }) {
  const priority = PRIORITY[issue.priority]
  return (
    <>
      <div className="flex items-center gap-1.5 px-(--card-spacing) text-ui-sm text-fg-muted">
        <priority.Icon aria-label={priority.label} className={`size-3.5 ${priority.className}`} />
        <span className="font-mono tabular-nums">{issue.key}</span>
        <Avatar size="sm" className="ms-auto size-5">
          <AvatarFallback className="text-[10px]">{issue.assignee}</AvatarFallback>
        </Avatar>
      </div>
      <p className="px-(--card-spacing) text-ui leading-snug font-medium text-fg">{issue.title}</p>
      <div className="px-(--card-spacing)">
        <Badge variant={TONE[issue.label as keyof typeof TONE] ?? 'secondary'}>{issue.label}</Badge>
      </div>
    </>
  )
}

export default function SprintBoard() {
  const [cards, setCards] = useState(ISSUES)

  const add = ({ column }: { column: string }, title: string) =>
    setCards((list) => {
      const key = `ENG-${230 + list.length}`
      return [...list, issue(key, column, title)]
    })

  return (
    <div className="flex h-[480px] w-full flex-col">
      <Kanban
        aria-label="Sprint 24"
        columns={COLUMNS}
        cards={cards}
        renderCard={(card) => <IssueCard issue={card} />}
        onMove={(_, next) => setCards(next)}
        onAddCard={add}
        cardMenu={(card) => (
          <>
            <ContextMenuItem onClick={() => setCards((list) => [...list.filter((c) => c.id !== card.id), { ...card, column: 'done' }])}>
              <ArrowRight /> Move to Done
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem variant="danger" onClick={() => setCards((list) => list.filter((c) => c.id !== card.id))}>
              <Trash2 /> Delete
            </ContextMenuItem>
          </>
        )}
        className="min-h-0 flex-1"
      />
    </div>
  )
}
