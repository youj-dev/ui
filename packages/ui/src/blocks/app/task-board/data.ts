import type { KanbanCardData, KanbanColumn } from '../../../components/ui/kanban'

/* The board page's tasks: twelve open across Atlas, Borealis and Cirrus,
 * and three done, on Monday 28 September 2026. Pass your issues API's
 * through the page's `tasks` and persist `onMove`. */

export type BoardPriority = 'urgent' | 'high' | 'medium' | 'low'
export type BoardTone = 'danger' | 'default' | 'secondary' | 'warning' | 'success'

/** A card: `id`, `column` and `title` place it (the Kanban's), the rest is drawn on it when given. */
export interface BoardTask extends KanbanCardData {
  /** The issue key, "ATL-142". */
  key?: string
  project?: string
  /** The kind of work, as a tinted badge. */
  label?: string
  /** The label's tint. Default: every label in one quiet neutral pill. */
  labelTone?: BoardTone
  assignee?: string
  priority?: BoardPriority
  /** "Today", "Tomorrow" or a date. */
  due?: string
  /** Its estimate, in points: a chip on the card, and the sprint's progress counts them. */
  points?: number
  /** Its checklist: a bar of cells and "3/5" on the card. */
  subtasks?: { done: number; total: number }
  /** How many comments it has. */
  comments?: number
  /** Others working on it, beside the assignee. */
  people?: string[]
}

/** The sprint over the board: its name, dates and goal, and how many working days are left. */
export interface BoardSprint {
  name: string
  /** "28 Sep – 9 Oct" */
  dates: string
  goal?: string
  daysLeft?: number
}

export const DEFAULT_COPY = {
  subtitle: (open: number) => `${open} open across Atlas, Borealis and Cirrus.`,
  newTask: 'New task',
  urgent: 'Urgent',
  high: 'High priority',
  medium: 'Medium priority',
  low: 'Low priority',
  /** Read after the project; `due` is the task's own text ("Today", "30 Sep"). */
  due: (due: string) => `due ${due === 'Today' || due === 'Tomorrow' ? due.toLowerCase() : due}`,
  assigned: (name: string) => `assigned to ${name}`,
  /** Today's tasks wear the warning ink. */
  today: 'Today',
  /** The column whose cards count as finished: struck through, out of the open count. */
  doneColumn: 'done',
  /** Read after the assignee. */
  points: (points: number) => `${points} ${points === 1 ? 'point' : 'points'}`,
  subtasks: (done: number, total: number) => `${done} of ${total} subtasks done`,
  comments: (count: number) => `${count} ${count === 1 ? 'comment' : 'comments'}`,
  with: (names: string[]) => `with ${names.join(', ')}`,
  pointsDone: 'Points done',
  daysLeft: (days: number) => `${days} ${days === 1 ? 'day' : 'days'} left`,
  team: 'Team',
  errorTitle: 'The board couldn’t load',
  retry: 'Try again',
  /** Over a rejected move's message. */
  failed: 'The move didn’t save',
}

export type BoardCopy = typeof DEFAULT_COPY

export const COLUMNS: KanbanColumn[] = [
  { id: 'backlog', title: 'Backlog', tone: 'neutral' },
  { id: 'progress', title: 'In progress', tone: 'warning', limit: 4 },
  { id: 'review', title: 'In review', tone: 'accent' },
  { id: 'done', title: 'Done', tone: 'success' },
]

export const SPRINT: BoardSprint = { name: 'Sprint 14', dates: '28 Sep – 9 Oct', goal: 'Get Atlas 2.0 ready for launch week.', daysLeft: 9 }

const task = (key: string, column: string, title: string, rest: Omit<BoardTask, 'id' | 'key' | 'column' | 'title'>): BoardTask => ({
  id: key,
  key,
  column,
  title,
  ...rest,
})

export const TASKS: BoardTask[] = [
  task('BOR-219', 'backlog', 'Retry sync jobs after a deploy', { project: 'Borealis', label: 'Bug', assignee: 'Jonas Weber', priority: 'high', due: '30 Sep', points: 3, comments: 2 }),
  task('ATL-149', 'backlog', 'SSO for Acme’s second region', { project: 'Atlas', label: 'Feature', assignee: 'Aiko Tanaka', priority: 'high', due: '9 Oct', points: 5, subtasks: { done: 0, total: 4 } }),
  task('ATL-151', 'backlog', 'Keyboard shortcuts for the editor', { project: 'Atlas', label: 'Feature', assignee: 'Theo Martins', priority: 'medium', points: 3 }),
  task('CIR-088', 'backlog', 'Document the cold start budget', { project: 'Cirrus', label: 'Docs', assignee: 'Lena Fischer', priority: 'low', points: 1 }),
  task('BOR-221', 'backlog', 'Audit empty states in settings', { project: 'Borealis', label: 'Design', assignee: 'Theo Martins', priority: 'low', points: 2, comments: 1 }),
  task('BOR-212', 'progress', 'Sync worker drops retries on deploy', { project: 'Borealis', label: 'Bug', assignee: 'Jonas Weber', priority: 'urgent', due: 'Today', points: 3, subtasks: { done: 2, total: 3 }, comments: 7, people: ['Sam Okafor'] }),
  task('ATL-146', 'progress', 'Flag the new editor for week one', { project: 'Atlas', label: 'Feature', assignee: 'Priya Natarajan', priority: 'high', due: '30 Sep', points: 5, subtasks: { done: 3, total: 5 }, comments: 4, people: ['Mira Chen', 'Theo Martins'] }),
  task('ATL-147', 'progress', 'Onboarding spacing and focus fixes', { project: 'Atlas', label: 'Design', assignee: 'Theo Martins', priority: 'medium', due: 'Tomorrow', points: 2, subtasks: { done: 4, total: 6 }, comments: 3 }),
  task('CIR-084', 'progress', 'Trim the Cirrus cold start', { project: 'Cirrus', label: 'Infra', assignee: 'Lena Fischer', priority: 'medium', due: '2 Oct', points: 3, subtasks: { done: 1, total: 4 }, people: ['Sam Okafor'] }),
  task('ATL-142', 'review', 'Atlas 2.0 launch plan', { project: 'Atlas', label: 'Docs', assignee: 'Priya Natarajan', priority: 'high', due: '30 Sep', points: 3, subtasks: { done: 5, total: 5 }, comments: 12, people: ['Mira Chen', 'Jonas Weber'] }),
  task('CIR-081', 'review', 'Queue changes for Borealis sync', { project: 'Cirrus', label: 'Infra', assignee: 'Sam Okafor', priority: 'medium', due: '1 Oct', points: 5, subtasks: { done: 3, total: 3 }, comments: 2 }),
  task('BOR-208', 'review', 'Rate-limit the public search API', { project: 'Borealis', label: 'Infra', assignee: 'Mira Chen', priority: 'medium', points: 2, comments: 5 }),
  task('ATL-139', 'done', 'Ship Atlas 1.8 to production', { project: 'Atlas', label: 'Infra', assignee: 'Mira Chen', priority: 'high', points: 5, subtasks: { done: 4, total: 4 }, comments: 9 }),
  task('CIR-079', 'done', 'Invite Kwame to the Cirrus team', { project: 'Cirrus', label: 'Docs', assignee: 'Sam Okafor', priority: 'low', points: 1 }),
  task('BOR-205', 'done', 'Metrics for sync retries', { project: 'Borealis', label: 'Feature', assignee: 'Jonas Weber', priority: 'medium', points: 3, subtasks: { done: 2, total: 2 }, comments: 1 }),
]

export function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return ((words[0]?.[0] ?? '') + (words.length > 1 ? (words.at(-1)?.[0] ?? '') : '')).toUpperCase() || '?'
}
