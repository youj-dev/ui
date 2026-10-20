import type { Meta, StoryObj } from '@storybook/react-vite'
import { WeekDial, type WeekDialEntry } from './week-dial'

const meta: Meta<typeof WeekDial> = {
  title: 'Blocks/App/Week Dial',
  component: WeekDial,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'The week as a clock: a ring per weekday, arcs for the entries in the color of their kind round a nine-to-six dial, a now hand with its time, the headline kind in the middle and the week total with a legend underneath. Point at an arc or use the arrow keys to read it.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof WeekDial>

/* Friday the 9th, 13:20: the hand sits just after the last entry. */
export const Default: Story = { name: 'Hours by weekday', args: { now: Date.parse('2026-10-09T13:20:00Z'), timeZone: 'UTC' } }

/* A consultant's week, in German, with three kinds, a weekend entry and a longer day. */
const ENTRIES: WeekDialEntry[] = [
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
    copy: { title: 'Stunden pro Wochentag', now: (t) => `Jetzt ${t}`, total: 'Gesamt', empty: 'Keine Zeiten erfasst' },
  },
}

/* A classroom's week by subject, in 45-minute periods from eight to three. */
const CLASS_ENTRIES: WeekDialEntry[] = [
  { day: '2026-10-12', kind: 'math', start: '08:00', end: '08:45' },
  { day: '2026-10-12', kind: 'reading', start: '09:00', end: '09:45' },
  { day: '2026-10-12', kind: 'science', start: '10:15', end: '11:00' },
  { day: '2026-10-12', kind: 'art', start: '13:00', end: '13:45' },
  { day: '2026-10-13', kind: 'math', start: '08:00', end: '08:45' },
  { day: '2026-10-13', kind: 'science', start: '09:00', end: '09:45' },
  { day: '2026-10-13', kind: 'reading', start: '10:15', end: '11:00' },
  { day: '2026-10-13', kind: 'pe', start: '13:00', end: '13:45' },
  { day: '2026-10-14', kind: 'reading', start: '08:00', end: '08:45' },
  { day: '2026-10-14', kind: 'math', start: '09:00', end: '09:45' },
  { day: '2026-10-14', kind: 'science', start: '10:15', end: '11:30' },
  { day: '2026-10-15', kind: 'math', start: '08:00', end: '08:45' },
  { day: '2026-10-15', kind: 'art', start: '09:00', end: '09:45' },
  { day: '2026-10-15', kind: 'reading', start: '10:15', end: '11:00' },
  { day: '2026-10-15', kind: 'pe', start: '13:00', end: '13:45' },
  { day: '2026-10-16', kind: 'reading', start: '08:00', end: '08:45' },
  { day: '2026-10-16', kind: 'science', start: '09:00', end: '10:00' },
  { day: '2026-10-16', kind: 'math', start: '10:15', end: '11:00' },
]

export const ClassroomUse: Story = {
  name: 'Classroom use',
  args: {
    entries: CLASS_ENTRIES,
    kinds: [
      { id: 'math', label: 'Math', tone: 'chart-1' },
      { id: 'reading', label: 'Reading', tone: 'chart-2' },
      { id: 'science', label: 'Science', tone: 'chart-3' },
      { id: 'art', label: 'Art', tone: 'chart-4' },
      { id: 'pe', label: 'PE', tone: 'chart-5' },
    ],
    hours: [8, 15],
    now: Date.parse('2026-10-14T09:20:00-05:00'),
    timeZone: 'America/Chicago',
    copy: {
      title: 'Room 12 by weekday',
      chart: 'Class periods by weekday, round a dial',
      total: 'Class time',
      empty: 'No classes scheduled this week',
      summary: (total: string, entries: number) => `${total} of class in ${entries} periods this week. Use the arrow keys to read each period.`,
    },
  },
}

/* A gym's classes and sessions from six in the morning to ten at night, seven days a week. */
const GYM_ENTRIES: WeekDialEntry[] = [
  { day: '2026-10-12', kind: 'cardio', start: '06:00', end: '07:00' },
  { day: '2026-10-12', kind: 'strength', start: '12:00', end: '13:00' },
  { day: '2026-10-12', kind: 'yoga', start: '18:30', end: '19:30' },
  { day: '2026-10-13', kind: 'strength', start: '06:30', end: '07:30' },
  { day: '2026-10-13', kind: 'cycling', start: '17:30', end: '18:15' },
  { day: '2026-10-13', kind: 'yoga', start: '20:00', end: '21:00' },
  { day: '2026-10-14', kind: 'cardio', start: '06:00', end: '06:45' },
  { day: '2026-10-14', kind: 'strength', start: '12:00', end: '13:00' },
  { day: '2026-10-14', kind: 'cycling', start: '18:00', end: '18:45' },
  { day: '2026-10-15', kind: 'yoga', start: '07:00', end: '08:00' },
  { day: '2026-10-15', kind: 'strength', start: '17:30', end: '18:30' },
  { day: '2026-10-15', kind: 'cardio', start: '19:00', end: '19:45' },
  { day: '2026-10-16', kind: 'cycling', start: '06:15', end: '07:00' },
  { day: '2026-10-16', kind: 'yoga', start: '12:15', end: '13:00' },
  { day: '2026-10-16', kind: 'strength', start: '18:00', end: '19:00' },
  { day: '2026-10-17', kind: 'cycling', start: '09:00', end: '10:00' },
  { day: '2026-10-17', kind: 'strength', start: '10:30', end: '11:30' },
  { day: '2026-10-17', kind: 'cardio', start: '16:00', end: '17:00' },
  { day: '2026-10-18', kind: 'yoga', start: '10:00', end: '11:15' },
  { day: '2026-10-18', kind: 'cardio', start: '14:00', end: '14:45' },
]

export const GymVisits: Story = {
  name: 'Gym visits',
  args: {
    entries: GYM_ENTRIES,
    kinds: [
      { id: 'strength', label: 'Strength', tone: 'chart-1' },
      { id: 'cardio', label: 'Cardio', tone: 'chart-5' },
      { id: 'cycling', label: 'Cycling', tone: 'chart-3' },
      { id: 'yoga', label: 'Yoga', tone: 'chart-4' },
    ],
    hours: [6, 22],
    now: Date.parse('2026-10-15T17:50:00-04:00'),
    timeZone: 'America/New_York',
    copy: {
      title: 'Gym sessions by weekday',
      chart: 'Gym sessions by weekday, round a dial',
      total: 'Time trained',
      empty: 'No sessions this week',
      summary: (total: string, entries: number) => `${total} trained in ${entries} sessions this week. Use the arrow keys to read each session.`,
    },
  },
}

export const Empty: Story = { args: { entries: [] } }

export const Standalone: Story = { args: { embedded: false, now: Date.parse('2026-10-09T13:20:00Z'), timeZone: 'UTC' } }
