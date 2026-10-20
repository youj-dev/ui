import type { ReactNode } from 'react'
import type { DataGridOptionTone } from '../../tables/data-grid'

/* Halyard's sales pipeline: a seeded set of deals, so the page renders the
 * same on the server and in the browser. Pass your own as the block's
 * `deals`. */

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
export function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  return wait(ms)
}

export const NOW = Date.UTC(2026, 9, 5, 9, 30)
const DAY = 86_400_000
const HOUR = 3_600_000

export type RecordDrawerStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'

/** A person on a deal: its owner, whoever edited it last, a note's author. */
export interface RecordDrawerPerson {
  id: string
  name: string
  /** A photo URL; without one, the initials. */
  src?: string
}

/** A meeting on the deal's calendar. */
export interface RecordDrawerMeeting {
  id: string
  title: string
  /** An ISO date-time. */
  at: string
  /** A video call: shows a camera beside the title. Default false. */
  video?: boolean
  /** Where the meeting lives: the row becomes a link. */
  href?: string
}

/** One entry of a section: a step of progress, a note or an activity. */
export interface RecordDrawerEntry {
  id: string
  text: string
  author: RecordDrawerPerson
  /** An ISO date-time. */
  at: string
}

/** A deal, one row of the list and the record the drawer shows. */
export interface RecordDrawerDeal {
  id: string
  /** The deal's name: "Platform expansion". */
  name: string
  company: {
    name: string
    /** The line under the name in the drawer: an email or a domain. */
    email: string
    /** The company's logo; without one, its initial on a tinted tile. */
    logo?: ReactNode
  }
  owner: RecordDrawerPerson
  industry: string
  stage: RecordDrawerStage
  /** The chance it closes, 0 to 100. */
  probability: number
  /** The deal's value, in the block's `currency`. */
  value: number
  /** ISO dates. */
  createdAt: string
  closesAt: string
  nextStepAt: string
  lastEditedBy: RecordDrawerPerson
  meetings: RecordDrawerMeeting[]
  progress: RecordDrawerEntry[]
  notes: RecordDrawerEntry[]
  activity: RecordDrawerEntry[]
}

/** The drawer's sections, in order: each has a header link. */
export type RecordDrawerSection = 'meetings' | 'progress' | 'notes' | 'activity'

/** Each stage's color, in the list, the drawer and anything that filters by stage: the open stages in chart colors, cool to warm as a deal moves on, then won and lost in their states. */
export const STAGE_TONES: Record<RecordDrawerStage, DataGridOptionTone> = {
  lead: 'chart-5',
  qualified: 'chart-1',
  proposal: 'chart-4',
  negotiation: 'chart-2',
  won: 'success',
  lost: 'danger',
}

export const DEFAULT_COPY = {
  title: 'Deals',
  description: 'Every open opportunity, who owns it and when it should close.',
  section: 'Pipeline',
  period: 'Q4 2026',
  noun: 'deals',
  newDeal: 'New deal',
  columns: { company: 'Company', stage: 'Stage', value: 'Value', probability: 'Probability', owner: 'Owner', closesAt: 'Closes' },
  stages: { lead: 'Lead', qualified: 'Qualified', proposal: 'Proposal', negotiation: 'Negotiation', won: 'Won', lost: 'Lost' } as Record<RecordDrawerStage, string>,
  properties: {
    owner: 'Owner',
    deal: 'Deal',
    industry: 'Industry',
    stage: 'Stage',
    probability: 'Probability',
    closesAt: 'Closes',
    age: 'Age',
    nextStepAt: 'Next step',
    value: 'Value',
    lastEditedBy: 'Last edited by',
  },
  sections: { meetings: 'Meetings', progress: 'Progress', notes: 'Notes', activity: 'Activity' } as Record<RecordDrawerSection, string>,
  viewAll: { meetings: 'See all', progress: 'View progress', notes: 'View notes', activity: 'View activity' } as Record<RecordDrawerSection, string>,
  /** Names a header link for a screen reader: "See all meetings". */
  viewAllLabel: (section: string, link: string) => `${link}: ${section}`,
  nothingYet: (section: string) => `No ${section.toLowerCase()} yet`,
  videoCall: 'Video call',
  edit: 'Edit',
  open: 'Open',
  close: 'Close',
  today: 'Today',
  yesterday: 'Yesterday',
  editing: (deal: string) => `Editing ${deal}`,
  opening: (deal: string) => `Opening ${deal}`,
  editingProperty: (property: string, deal: string) => `Editing ${property.toLowerCase()} on ${deal}`,
  viewing: (section: string, deal: string) => `${section} for ${deal}`,
  failed: 'Something went wrong. Try again.',
  emptyTitle: 'No deals yet',
  emptyDescription: 'Deals you create or import show up here, newest first.',
}

export type RecordDrawerCopy = typeof DEFAULT_COPY

export const PEOPLE: RecordDrawerPerson[] = [
  { id: 'noor', name: 'Noor Haddad' },
  { id: 'tomas', name: 'Tomás Reyes' },
  { id: 'ines', name: 'Ines Varga' },
  { id: 'kofi', name: 'Kofi Mensah' },
  { id: 'mei', name: 'Mei Tanaka' },
  { id: 'arjun', name: 'Arjun Mehta' },
]

const COMPANIES: [name: string, industry: string, deal: string][] = [
  ['Lumen Freight', 'Logistics', 'Fleet tracking rollout'],
  ['Orrery Labs', 'AI', 'Inference platform expansion'],
  ['Fernhill Bank', 'Finance', 'Branch analytics pilot'],
  ['Quayside Foods', 'Retail', 'Store ordering upgrade'],
  ['Brightwater Health', 'Healthcare', 'Clinic scheduling suite'],
  ['Cinder & Pike', 'Hospitality', 'Guest messaging'],
  ['Tessellate', 'Design', 'Enterprise seats'],
  ['Halcyon Energy', 'Energy', 'Grid monitoring contract'],
  ['Mosswood Schools', 'Education', 'District-wide license'],
  ['Parallel Motors', 'Automotive', 'Dealer portal'],
  ['Kestrel Security', 'Security', 'SOC tooling renewal'],
  ['Northbeam Media', 'Media', 'Ad ops automation'],
  ['Saltmarsh Travel', 'Travel', 'Booking API'],
  ['Ironleaf Capital', 'Finance', 'Portfolio reporting'],
  ['Verdant Bio', 'Biotech', 'Lab data platform'],
  ['Copperline', 'Telecom', 'Support desk migration'],
]

const MEETINGS = ['Pricing review', 'Security walkthrough', 'Kickoff with', 'Quarterly check-in', 'Technical deep dive', 'Procurement sync']
const PROGRESS = ['Revised pricing sent', 'Proposal approved', 'Security review passed', 'Champion confirmed', 'Pilot scope agreed', 'Legal redlines returned']
const NOTES = [
  'Confirm budget before the next call',
  'They want SSO on day one',
  'Procurement needs two quotes',
  'Champion moving teams in January',
  'Ask about multi-year pricing',
]
const ACTIVITY = ['updated the proposal', 'moved the stage', 'changed the close date', 'logged a call', 'attached the order form', 'added a contact']
const STAGES: RecordDrawerStage[] = ['lead', 'qualified', 'qualified', 'proposal', 'proposal', 'proposal', 'negotiation', 'negotiation', 'won', 'lost']
const PROBABILITY: Record<RecordDrawerStage, [number, number]> = {
  lead: [5, 20],
  qualified: [20, 40],
  proposal: [45, 70],
  negotiation: [65, 85],
  won: [100, 100],
  lost: [0, 0],
}

/** The demo's deals: `count` of them, seeded so every render agrees. The fifth is the record the gallery picture shows. */
export function makeDeals(count = 48, seed = 11): RecordDrawerDeal[] {
  let s = seed
  const next = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
  const pick = <T>(list: readonly T[]) => list[Math.floor(next() * list.length)]!
  const iso = (time: number) => new Date(time).toISOString()
  return Array.from({ length: count }, (_, i) => {
    const [base, industry, deal] = COMPANIES[i % COMPANIES.length]!
    const round = Math.floor(i / COMPANIES.length)
    const company = round ? `${base} ${['EU', 'Group'][round - 1] ?? round + 1}` : base
    const slug = base.toLowerCase().replace(/&/g, 'and').replace(/[^a-z]+/g, '')
    const stage = i === 4 ? 'proposal' : pick(STAGES)
    const [low, high] = PROBABILITY[stage]
    const probability = i === 4 ? 62 : Math.round(low + next() * (high - low))
    const owner = PEOPLE[i % PEOPLE.length]!
    const editor = PEOPLE[(i + 1 + Math.floor(next() * 3)) % PEOPLE.length]!
    const created = NOW - Math.round((i === 4 ? 12 : 4 + next() * 120) * DAY)
    const closes = NOW + Math.round((i === 4 ? 56 : 10 + next() * 150) * DAY)
    const at = (days: number, hour = 10) => iso(Date.UTC(2026, 9, 5) - Math.round(days) * DAY + hour * HOUR)
    const people = [owner, editor]
    return {
      id: `deal-${String(i + 1).padStart(2, '0')}`,
      name: deal,
      company: { name: company, email: `partnerships@${slug}.com` },
      owner,
      industry,
      stage,
      probability,
      value: i === 4 ? 324_000 : Math.round((8 + next() * 420) * 2) * 500,
      createdAt: iso(created),
      closesAt: iso(closes),
      nextStepAt: iso(NOW + Math.round((2 + next() * 20) * DAY)),
      lastEditedBy: editor,
      meetings: [
        { id: `${i}-m1`, title: `${MEETINGS[i % MEETINGS.length]!} ${MEETINGS[i % MEETINGS.length]!.endsWith('with') ? base : ''}`.trim(), at: at(1, 15), video: true },
        { id: `${i}-m2`, title: `${base} team sync`, at: at(9 + (i % 6), 9), video: i % 3 !== 1 },
      ],
      progress: [
        { id: `${i}-p1`, text: PROGRESS[i % PROGRESS.length]!, author: owner, at: at(0, 8) },
        { id: `${i}-p2`, text: PROGRESS[(i + 1) % PROGRESS.length]!, author: people[1]!, at: at(1, 16) },
      ],
      notes: [{ id: `${i}-n1`, text: NOTES[i % NOTES.length]!, author: owner, at: at(4, 4) }],
      activity: [{ id: `${i}-a1`, text: `${editor.name.split(' ')[0]} ${ACTIVITY[i % ACTIVITY.length]}`, author: editor, at: at(3, 5) }],
    }
  })
}

export const DEALS = makeDeals()
