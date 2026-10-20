import type { Meta, StoryObj } from '@storybook/react-vite'
import { WeekBlocks, type WeekBlocksEntry } from './week-blocks'

const meta: Meta<typeof WeekBlocks> = {
  title: 'Blocks/App/Week Blocks',
  component: WeekBlocks,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'A week of logged time as columns, one per day: rounded blocks in the color of their kind, today marked with a now line and its time, the week total large and a legend that gives the totals per kind. Point at a block or use the arrow keys to read it.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof WeekBlocks>

/* Friday the 9th, 13:20: the line sits just after the last entry. */
export const Default: Story = { name: 'Logged time', args: { now: Date.parse('2026-10-09T13:20:00Z'), timeZone: 'UTC' } }

/* A consultant's week, in German, with three kinds, a weekend entry and a longer day. */
const ENTRIES: WeekBlocksEntry[] = [
  { day: '2026-10-12', kind: 'kunde', start: '08:30', end: '12:00' },
  { day: '2026-10-12', kind: 'intern', start: '13:00', end: '15:00' },
  { day: '2026-10-13', kind: 'kunde', start: '09:00', end: '12:30' },
  { day: '2026-10-13', kind: 'kunde', start: '13:30', end: '18:30' },
  { day: '2026-10-14', kind: 'lernen', start: '10:00', end: '11:30' },
  { day: '2026-10-15', kind: 'kunde', start: '09:00', end: '13:00' },
  { day: '2026-10-16', kind: 'intern', start: '09:30', end: '11:00' },
  { day: '2026-10-17', kind: 'lernen', start: '10:00', end: '12:00' },
]

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    entries: ENTRIES,
    kinds: [
      { id: 'kunde', label: 'Abrechenbar', tone: 'chart-2' },
      { id: 'intern', label: 'Intern', tone: 'neutral' },
      { id: 'lernen', label: 'Lernzeit', tone: 'chart-4' },
    ],
    hours: [8, 19],
    locale: 'de-DE',
    now: Date.parse('2026-10-14T10:40:00+02:00'),
    timeZone: 'Europe/Berlin',
    copy: { title: 'Zeiten der Woche', total: 'Gesamt', empty: 'Keine Zeiten erfasst' },
  },
}

/* A student's after-school study plan: subjects are the kinds, evenings the hours, a Saturday session on top. */
const STUDY_ENTRIES: WeekBlocksEntry[] = [
  { day: '2026-10-12', kind: 'math', start: '16:00', end: '17:15' },
  { day: '2026-10-12', kind: 'reading', start: '19:00', end: '20:00' },
  { day: '2026-10-13', kind: 'science', start: '16:30', end: '18:00' },
  { day: '2026-10-13', kind: 'languages', start: '19:30', end: '20:15' },
  { day: '2026-10-14', kind: 'math', start: '16:00', end: '17:30' },
  { day: '2026-10-14', kind: 'review', start: '19:00', end: '19:45' },
  { day: '2026-10-15', kind: 'science', start: '16:30', end: '17:45' },
  { day: '2026-10-15', kind: 'reading', start: '18:30', end: '19:30' },
  { day: '2026-10-16', kind: 'languages', start: '16:00', end: '16:45' },
  { day: '2026-10-16', kind: 'review', start: '17:00', end: '17:30' },
  { day: '2026-10-17', kind: 'math', start: '15:00', end: '16:30' },
  { day: '2026-10-17', kind: 'science', start: '16:45', end: '18:15' },
  { day: '2026-10-17', kind: 'reading', start: '19:00', end: '20:00' },
]

export const StudyPlan: Story = {
  name: 'Study plan',
  args: {
    entries: STUDY_ENTRIES,
    kinds: [
      { id: 'math', label: 'Math', tone: 'chart-1' },
      { id: 'science', label: 'Science', tone: 'chart-3' },
      { id: 'reading', label: 'Reading', tone: 'chart-2' },
      { id: 'languages', label: 'Spanish', tone: 'chart-4' },
      { id: 'review', label: 'Review', tone: 'neutral' },
    ],
    hours: [15, 21],
    now: Date.parse('2026-10-15T17:10:00-05:00'),
    timeZone: 'America/Chicago',
    copy: {
      title: 'Study plan',
      total: 'Planned',
      chart: 'Study sessions by day',
      empty: 'No study sessions planned',
      summary: (total: string, entries: number) => `${total} planned in ${entries} sessions this week. Use the arrow keys to read each session.`,
    },
  },
}

/* One exam room's bookings for a week, by kind of visit. */
const CLINIC_ENTRIES: WeekBlocksEntry[] = [
  { day: '2026-10-12', kind: 'checkup', start: '08:00', end: '08:45' },
  { day: '2026-10-12', kind: 'followup', start: '09:00', end: '09:30' },
  { day: '2026-10-12', kind: 'vaccine', start: '10:00', end: '10:20' },
  { day: '2026-10-12', kind: 'checkup', start: '13:00', end: '13:45' },
  { day: '2026-10-13', kind: 'followup', start: '08:30', end: '09:00' },
  { day: '2026-10-13', kind: 'lab', start: '09:15', end: '09:45' },
  { day: '2026-10-13', kind: 'checkup', start: '10:30', end: '11:15' },
  { day: '2026-10-13', kind: 'followup', start: '14:00', end: '14:30' },
  { day: '2026-10-14', kind: 'vaccine', start: '08:00', end: '08:20' },
  { day: '2026-10-14', kind: 'vaccine', start: '08:30', end: '08:50' },
  { day: '2026-10-14', kind: 'checkup', start: '09:30', end: '10:15' },
  { day: '2026-10-14', kind: 'lab', start: '11:00', end: '11:30' },
  { day: '2026-10-15', kind: 'checkup', start: '08:00', end: '08:45' },
  { day: '2026-10-15', kind: 'followup', start: '09:15', end: '09:45' },
  { day: '2026-10-15', kind: 'checkup', start: '13:30', end: '14:15' },
  { day: '2026-10-16', kind: 'followup', start: '08:30', end: '09:00' },
  { day: '2026-10-16', kind: 'lab', start: '10:00', end: '10:30' },
  { day: '2026-10-16', kind: 'vaccine', start: '11:00', end: '11:20' },
]

export const ClinicRooms: Story = {
  name: 'Clinic rooms',
  args: {
    entries: CLINIC_ENTRIES,
    kinds: [
      { id: 'checkup', label: 'Checkup', tone: 'chart-2' },
      { id: 'followup', label: 'Follow-up', tone: 'chart-1' },
      { id: 'vaccine', label: 'Vaccination', tone: 'chart-3' },
      { id: 'lab', label: 'Lab work', tone: 'chart-5' },
    ],
    hours: [8, 15],
    now: Date.parse('2026-10-14T09:10:00-07:00'),
    timeZone: 'America/Los_Angeles',
    copy: {
      title: 'Exam room 2',
      total: 'Booked',
      chart: 'Room bookings by day',
      empty: 'No bookings this week',
      summary: (total: string, entries: number) => `${total} booked in ${entries} visits this week. Use the arrow keys to read each visit.`,
    },
  },
}

export const Empty: Story = { args: { entries: [] } }

export const Standalone: Story = { args: { embedded: false, now: Date.parse('2026-10-09T13:20:00Z'), timeZone: 'UTC' } }
