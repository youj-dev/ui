import { ArrowUpIcon, MessageIcon, SignalIcon } from '@youj/icons'
import { Avatar, AvatarFallback } from '../avatar'
import { Badge } from '../badge'
import type { KanbanCardData, KanbanColumn, KanbanLane } from './index'

/* A product sprint, shared by the Kanban stories and the Project workspace example. */

export interface Issue extends KanbanCardData {
  key: string
  priority: 'urgent' | 'high' | 'medium'
  labels: string[]
  assignee: string
  points: number
  comments?: number
}

export const SPRINT_COLUMNS: KanbanColumn[] = [
  { id: 'backlog', title: 'Backlog', tone: 'neutral' },
  { id: 'todo', title: 'To do', tone: 'accent' },
  { id: 'doing', title: 'In progress', tone: 'warning', limit: 3 },
  { id: 'review', title: 'In review', tone: 'accent', limit: 2 },
  { id: 'done', title: 'Done', tone: 'success' },
]

export const SPRINT_LANES: KanbanLane[] = [
  { id: 'web', title: 'Web' },
  { id: 'platform', title: 'Platform' },
]

const issue = (key: string, column: string, title: string, p: Partial<Issue> = {}): Issue => ({
  id: key,
  key,
  column,
  title,
  priority: 'medium',
  labels: [],
  assignee: 'LH',
  points: 2,
  lane: 'web',
  ...p,
})

export const SPRINT_CARDS: Issue[] = [
  issue('ENG-201', 'backlog', 'Audit empty states across settings', { labels: ['Design'], assignee: 'MK', points: 3 }),
  issue('ENG-214', 'backlog', 'Rate-limit the public search API', { labels: ['API'], lane: 'platform', assignee: 'JO', points: 5 }),
  issue('ENG-188', 'todo', 'Fix login redirect loop on Safari', { priority: 'urgent', labels: ['Bug'], assignee: 'AR', comments: 4 }),
  issue('ENG-192', 'todo', 'Keyboard shortcuts cheat sheet', { labels: ['Feature'], assignee: 'LH', points: 1 }),
  issue('ENG-205', 'todo', 'Migrate cron jobs to the queue', { lane: 'platform', labels: ['Infra'], assignee: 'JO', points: 5 }),
  issue('ENG-176', 'doing', 'Inline editing for issue titles', { priority: 'high', labels: ['Feature'], assignee: 'MK', comments: 2 }),
  issue('ENG-181', 'doing', 'Dark mode for charts', { labels: ['Design'], assignee: 'AR', points: 3 }),
  issue('ENG-199', 'doing', 'Stream deploy logs over SSE', { lane: 'platform', priority: 'high', labels: ['Infra'], assignee: 'SN', points: 8 }),
  issue('ENG-170', 'review', 'Bulk-assign from the list view', { labels: ['Feature'], assignee: 'LH', comments: 7 }),
  issue('ENG-163', 'done', 'Onboarding checklist', { labels: ['Growth'], assignee: 'MK', points: 3 }),
  issue('ENG-158', 'done', 'Postgres 17 upgrade', { lane: 'platform', labels: ['Infra'], assignee: 'SN', points: 5 }),
]

const PRIORITY = {
  urgent: { Icon: ArrowUpIcon, active: undefined, label: 'Urgent', className: 'text-danger-text' },
  high: { Icon: SignalIcon, active: undefined, label: 'High priority', className: 'text-warning-text' },
  // Signal's weak pose: the bars fall back, a notch below high.
  medium: { Icon: SignalIcon, active: true, label: 'Medium priority', className: 'text-fg-muted' },
}

const LABEL_TONE: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'danger'> = {
  Bug: 'danger',
  Feature: 'default',
  Design: 'secondary',
  Infra: 'warning',
  Growth: 'success',
  API: 'secondary',
}

/** The inside of a sprint card: key, priority, title, labels, points and the assignee. */
export function IssueCard({ issue }: { issue: Issue }) {
  const priority = PRIORITY[issue.priority]
  return (
    <>
      <div className="flex items-center gap-1.5 px-(--card-spacing) text-ui-sm text-fg-muted">
        <priority.Icon aria-label={priority.label} active={priority.active} trigger="none" className={`size-3.5 ${priority.className}`} />
        <span className="font-mono tabular-nums">{issue.key}</span>
        <Avatar size="sm" className="ms-auto size-5">
          <AvatarFallback className="text-[10px]">{issue.assignee}</AvatarFallback>
        </Avatar>
      </div>
      <p className="px-(--card-spacing) text-ui leading-snug font-medium text-fg">{issue.title}</p>
      <div className="flex items-center gap-1.5 px-(--card-spacing)">
        {issue.labels.map((l) => (
          <Badge key={l} variant={LABEL_TONE[l] ?? 'secondary'}>
            {l}
          </Badge>
        ))}
        <span className="ms-auto flex items-center gap-2.5 text-ui-sm text-fg-muted tabular-nums">
          {issue.comments ? (
            <span className="flex items-center gap-1">
              <MessageIcon trigger="none" className="size-3.5" />
              {issue.comments}
            </span>
          ) : null}
          <span aria-label={`${issue.points} points`} className="rounded-sm border border-line px-1 leading-4">
            {issue.points}
          </span>
        </span>
      </div>
    </>
  )
}
