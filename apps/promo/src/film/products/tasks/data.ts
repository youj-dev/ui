import type { TimelineEvent } from '@youj/react/components/ui/timeline'

/* Sample plan for Tandem, the Tasks example: Brightwater Studio shipping
 * Meadow Tea Co.'s First Flush launch. Days count from today (0), so the
 * runway always reads as live: work started three days ago and the launch is
 * nine days out. The handoffs make one real critical path: the hero
 * illustration feeds the product page, which has to be load-tested before
 * launch, so a slip in the artwork pushes the checkout test past launch
 * day. Deterministic, so tests and screenshots read the same every run. */

export type Status = 'todo' | 'doing' | 'done'
export type PersonId = 'noor' | 'jun' | 'ines' | 'theo' | 'mara'

export interface Person {
  id: PersonId
  name: string
  role: string
  presence: 'online' | 'away' | 'offline'
}

export interface Task {
  id: string
  title: string
  owner: PersonId
  status: Status
  /** The day it's planned to start, counted from today. It starts later if a handoff it waits for lands later. */
  start: number
  /** Days it takes, at least one. */
  days: number
  /** The tasks it waits for: their handoffs. */
  after: string[]
  /** How far along a task in progress is, 0 to 1. */
  progress?: number
  brief: string
  activity: TimelineEvent[]
}

export interface Project {
  id: string
  name: string
  client: string
  /** Launch day, counted from today. The launch goes out at 9 a.m. */
  launch: number
  tasks: Task[]
}

export const PEOPLE: Person[] = [
  { id: 'noor', name: 'Noor Haddad', role: 'Illustrator', presence: 'online' },
  { id: 'jun', name: 'Jun Park', role: 'Motion designer', presence: 'away' },
  { id: 'ines', name: 'Inès Laurent', role: 'Writer', presence: 'online' },
  { id: 'theo', name: 'Theo Brandt', role: 'Developer', presence: 'online' },
  { id: 'mara', name: 'Mara Quinn', role: 'Producer', presence: 'online' },
]
export const PERSON = Object.fromEntries(PEOPLE.map((p) => [p.id, p])) as Record<PersonId, Person>

/** The signed-in producer, who makes the moves recorded in each task's activity. */
export const ME: PersonId = 'mara'

/** The runway starts three days back; it runs to the day after launch. */
export const FIRST_DAY = -3

const DAY = 86_400_000

export function makeProjects(now = Date.now()): Project[] {
  const t = (id: string, title: string, owner: PersonId, status: Status, start: number, days: number, after: string[], brief: string, progress?: number): Task => ({
    id,
    title,
    owner,
    status,
    start,
    days,
    after,
    progress,
    brief,
    activity: [
      { id: `${id}-created`, type: 'create', title: 'Put it on the runway', actor: { name: PERSON[ME].name }, time: now - (8 - start) * DAY },
      ...(status !== 'todo' ? [{ id: `${id}-started`, type: 'move', title: 'Started', actor: { name: PERSON[owner].name }, time: now + Math.min(0, start) * DAY - 2 * 3_600_000 }] : []),
      ...(status === 'done' ? [{ id: `${id}-done`, type: 'ship', title: 'Handed off', actor: { name: PERSON[owner].name }, time: now + (start + days - 1) * DAY - 5 * 3_600_000 }] : []),
    ],
  })

  return [
    {
      id: 'first-flush',
      name: 'First Flush launch',
      client: 'Meadow Tea Co.',
      launch: 9,
      tasks: [
        t('tins', 'Tin artwork', 'noor', 'done', -3, 3, [], 'The First Flush tin in three colorways, with the estate’s name in the band. Signed off by Meadow.'),
        t('hero', 'Hero illustration', 'noor', 'doing', 0, 3, ['tins'], 'The garden at dawn, for the product page and the email header. Warm the sky, keep the tin readable small.', 0.35),
        t('stills', 'Social stills', 'noor', 'todo', 5, 2, ['hero'], 'Six crops of the hero for social, square and tall.'),
        t('rough', 'Launch film: rough cut', 'jun', 'doing', -2, 4, [], 'Ninety seconds in three chapters: the field, the harvest, the first cup.', 0.7),
        t('final', 'Launch film: final cut', 'jun', 'todo', 2, 3, ['rough'], 'Grade, titles and the locked music. One cut with sound, one without.'),
        t('cutdowns', 'Social cutdowns', 'jun', 'todo', 5, 2, ['final'], 'Three six-second loops from the film, captioned.'),
        t('press', 'Press kit copy', 'ines', 'doing', -1, 2, [], 'The founder’s story in 300 words, the tasting notes and three pull quotes.', 0.5),
        t('email', 'Launch email', 'ines', 'todo', 1, 3, ['press'], 'One image, one button, a note from Ada. Goes to 48,200 subscribers at 9 a.m. on launch day.'),
        t('copy', 'Product page copy', 'ines', 'todo', 1, 2, [], 'Tasting notes, brewing guide and the estate story, in Meadow’s voice.'),
        t('page', 'Product page build', 'theo', 'todo', 3, 3, ['hero', 'copy'], 'The First Flush page with the steeping timer and the new tin photography.'),
        t('mailbuild', 'Build and test the email', 'theo', 'todo', 4, 2, ['email'], 'Code the email, test it in the twelve clients that matter, set up the send.'),
        t('load', 'Load-test checkout', 'theo', 'todo', 6, 2, ['page'], 'Rehearse the launch rush against the payment provider: 400 orders an hour for two hours.'),
        t('prices', 'Wholesale price list', 'mara', 'done', -2, 2, [], 'Prices for cafés and hotels, 5% off standing orders.'),
        t('kettle', 'Brief Kettle Magazine', 'mara', 'todo', 1, 1, ['press'], 'Send Lena the press kit, the samples and the embargo.'),
      ],
    },
    { id: 'harvest', name: 'Harvest box', client: 'Meadow Tea Co.', launch: 24, tasks: [] },
  ]
}

/** The same plan, a few days on: the hero illustration has slipped two days, and the checkout test with it. */
export function slipping(project: Project): Project {
  return { ...project, tasks: project.tasks.map((t) => (t.id === 'hero' ? { ...t, days: 5, progress: 0.2 } : t)) }
}

/** The same plan, finished: every task handed off. */
export function ready(project: Project): Project {
  return { ...project, tasks: project.tasks.map((t) => ({ ...t, status: 'done' as const, progress: undefined })) }
}
