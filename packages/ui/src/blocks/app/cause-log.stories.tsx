import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { CauseLog } from './cause-log'

const meta: Meta<typeof CauseLog> = {
  title: 'Blocks/App/Cause Log',
  component: CauseLog,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Read recent events (a plant’s stops, escalated tickets, delayed appointments) as a table you can filter by cause and sort, with a last-24-hours strip per source, and file the ticked entries under a cause in one step.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof CauseLog>

/** Fourteen stops this week, newest first, and the last day on four machine strips. */
export const Default: Story = { name: 'Plant downtime' }

/** The longest stops first. */
export const Longest: Story = {
  args: { defaultSort: 'longest' },
}

/** A filter that matches nothing keeps the table's room. */
export const NoMatch: Story = { args: { entries: [], copy: { empty: 'No stops yet this week.' } } }

/** Other data: another plant's stops, German words and times in Berlin, and the assignment in Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    locale: 'de-DE',
    timeZone: 'Europe/Berlin',
    now: '2026-10-13T12:00:00Z',
    copy: { title: 'Stillstandsprotokoll', assign: 'Ursache zuweisen', durationHead: 'Min.', duration: (d: string) => `${d} Min.`, started: 'Beginn', reason: 'Grund', lastDay: 'Letzte 24 Stunden', now: 'jetzt', allReasons: 'Alle Gründe' },
    causes: [
      { id: 'tool', label: 'Werkzeug', tone: 'chart-4' },
      { id: 'material', label: 'Material', tone: 'chart-5' },
      { id: 'other', label: 'Sonstiges', tone: 'neutral' },
    ],
    entries: [
      { id: 'a', source: 'Fräse 3', startedAt: '2026-10-13T10:05:00Z', duration: 52, cause: 'tool' },
      { id: 'b', source: 'Fräse 3', startedAt: '2026-10-13T06:30:00Z', duration: 18, cause: 'material' },
      { id: 'c', source: 'Presse 1', startedAt: '2026-10-12T20:10:00Z', duration: 33, cause: 'other' },
      { id: 'd', source: 'Presse 1', startedAt: '2026-10-13T08:40:00Z', duration: 11, cause: 'tool' },
    ],
    onAssign: fn(),
    onSortChange: fn(),
  },
}

const at = (day: string, time: string) => `${day}T${time}:00Z`

/** Ops and tech: tickets escalated to a second line, grouped by who took them, with the minutes each took to resolve. Over two hours is flagged. */
export const SupportEscalations: Story = {
  name: 'Support escalations',
  args: {
    now: '2026-10-13T16:00:00Z',
    longAfter: 120,
    copy: {
      title: 'Escalated tickets',
      window: 'this week',
      subtitle: (n: number, window: string) => `${n} ${n === 1 ? 'ticket' : 'tickets'} · ${window}`,
      filterLabel: 'Filter by topic',
      allReasons: 'All topics',
      sortLabel: 'Sort tickets',
      tableLabel: 'Tickets',
      selectAll: 'Select all tickets',
      selectRow: (source: string, started: string) => `Select the ${source} ticket escalated ${started}`,
      started: 'Escalated',
      reason: 'Topic',
      durationHead: 'min to resolve',
      empty: 'No tickets match this topic.',
      timelineLabel: (source: string, n: number, duration: string) => `${source}: ${n} ${n === 1 ? 'ticket' : 'tickets'}, ${duration} in the last 24 hours`,
      selected: (n: number, duration: string) => (n ? `${n} selected · ${duration}` : 'None selected'),
      assign: 'Set topic',
      assigned: (n: number, cause: string) => `${n} ${n === 1 ? 'ticket' : 'tickets'} set to ${cause}`,
    },
    causes: [
      { id: 'billing', label: 'Billing', tone: 'chart-3' },
      { id: 'bug', label: 'Bug', tone: 'chart-1' },
      { id: 'access', label: 'Access', tone: 'chart-2' },
      { id: 'howto', label: 'How-to', tone: 'neutral' },
    ],
    entries: [
      { id: 't1', source: 'Tier 2', startedAt: at('2026-10-13', '15:10'), duration: 38, cause: 'access' },
      { id: 't2', source: 'Tier 2', startedAt: at('2026-10-13', '11:42'), duration: 95, cause: 'billing' },
      { id: 't3', source: 'Platform', startedAt: at('2026-10-13', '09:05'), duration: 210, cause: 'bug' },
      { id: 't4', source: 'Platform', startedAt: at('2026-10-13', '13:30'), duration: 140, cause: 'bug' },
      { id: 't5', source: 'Finance', startedAt: at('2026-10-13', '14:20'), duration: 55, cause: 'billing' },
      { id: 't6', source: 'Tier 2', startedAt: at('2026-10-12', '17:45'), duration: 24, cause: 'howto' },
      { id: 't7', source: 'Finance', startedAt: at('2026-10-12', '10:15'), duration: 180, cause: 'billing' },
      { id: 't8', source: 'Platform', startedAt: at('2026-10-12', '08:50'), duration: 72, cause: 'access' },
      { id: 't9', source: 'Tier 2', startedAt: at('2026-10-11', '15:25'), duration: 16, cause: 'howto' },
    ],
    onAssign: fn(),
  },
}

/** Health: appointments that ran late, by room. The durations read "12 min" through `format`, and over 20 minutes is flagged. */
export const ClinicDelays: Story = {
  name: 'Clinic delays',
  args: {
    now: '2026-10-13T17:00:00Z',
    longAfter: 20,
    format: (minutes: number) => `${minutes} min`,
    copy: {
      title: 'Clinic delays',
      subtitle: (n: number, window: string) => `${n} late ${n === 1 ? 'appointment' : 'appointments'} · ${window}`,
      window: 'this week',
      filterLabel: 'Filter by cause',
      allReasons: 'All causes',
      sortLabel: 'Sort delays',
      sortLongest: 'Longest delay first',
      tableLabel: 'Delays',
      selectAll: 'Select all delays',
      selectRow: (source: string, started: string) => `Select the ${source} delay at ${started}`,
      started: 'Scheduled',
      reason: 'Cause',
      durationHead: 'Delay',
      duration: (d: string) => d,
      empty: 'No delays match this cause.',
      timelineLabel: (source: string, n: number, duration: string) => `${source}: ${n} ${n === 1 ? 'delay' : 'delays'}, ${duration} in the last 24 hours`,
      assign: 'Set cause',
      assigned: (n: number, cause: string) => `${n} ${n === 1 ? 'delay' : 'delays'} set to ${cause}`,
    },
    causes: [
      { id: 'late', label: 'Late arrival', tone: 'chart-2' },
      { id: 'overrun', label: 'Overrun', tone: 'chart-4' },
      { id: 'equipment', label: 'Equipment', tone: 'chart-5' },
      { id: 'paperwork', label: 'Paperwork', tone: 'chart-3' },
    ],
    entries: [
      { id: 'c1', source: 'Room 1', startedAt: at('2026-10-13', '08:30'), duration: 12, cause: 'late' },
      { id: 'c2', source: 'Room 1', startedAt: at('2026-10-13', '10:00'), duration: 28, cause: 'overrun' },
      { id: 'c3', source: 'Room 2', startedAt: at('2026-10-13', '09:15'), duration: 35, cause: 'equipment' },
      { id: 'c4', source: 'Room 2', startedAt: at('2026-10-13', '13:45'), duration: 9, cause: 'paperwork' },
      { id: 'c5', source: 'Room 3', startedAt: at('2026-10-13', '11:20'), duration: 22, cause: 'overrun' },
      { id: 'c6', source: 'Room 3', startedAt: at('2026-10-13', '15:40'), duration: 16, cause: 'late' },
      { id: 'c7', source: 'Room 1', startedAt: at('2026-10-12', '14:10'), duration: 18, cause: 'paperwork' },
      { id: 'c8', source: 'Room 2', startedAt: at('2026-10-12', '16:00'), duration: 41, cause: 'equipment' },
    ],
    onAssign: fn(),
  },
}

/** Skeletons in the table's and the strip's room while the data loads. */
export const Loading: Story = { args: { loading: true } }

/** The load failed: the message and Retry take the table's room. */
export const Error: Story = { args: { error: 'Couldn’t load the downtime log.', onRetry: fn() } }

/** Drawn as its own page, with the card's title as the page's `h1`. */
export const Standalone: Story = { args: { embedded: false } }
