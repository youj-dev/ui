import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { ShiftRota } from './shift-rota'
import { WEEK, type ShiftRotaPerson, type ShiftRotaShift } from './shift-rota/data'

const meta: Meta<typeof ShiftRota> = {
  title: 'Blocks/App/Shift Rota',
  component: ShiftRota,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'See who is on call and how the week is covered in a shared schedule.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ShiftRota>

export const Default: Story = { name: 'On-call rotation' }

/** Late on Friday: the weekend shift is next, and most of the week has ended. */
export const Friday: Story = { args: { now: WEEK + (4 * 24 + 7.75) * 3_600_000 } }

const HOUR = 3_600_000
const MONDAY = new Date(2026, 10, 2).getTime()
const day = (n: number, hour: number) => MONDAY + (n * 24 + hour) * HOUR

const nurses: ShiftRotaPerson[] = [
  { id: 'ana', name: 'Ana Ferreira', detail: 'Charge nurse' },
  { id: 'ben', name: 'Ben Achterberg', detail: 'Registered nurse' },
  { id: 'chi', name: 'Chioma Eze', detail: 'Registered nurse' },
  { id: 'dev', name: 'Dev Malhotra', detail: 'Night float' },
]

// Days 07:00–19:00 and nights 19:00–07:00, two nurses trading off, one night float covering a gap.
const wards: ShiftRotaShift[] = [
  ...[0, 1, 2, 3, 4, 5, 6].flatMap((n): ShiftRotaShift[] => [
    { id: `d${n}`, lane: n % 2 ? 'chi' : 'ana', start: day(n, 7), end: day(n, 19) },
    { id: `n${n}`, lane: n % 3 === 2 ? 'dev' : 'ben', start: day(n, 19), end: day(n + 1, 7) },
  ]),
  { id: 'cover', lane: 'chi', start: day(2, 10), end: day(2, 15), override: true, note: 'Covering a family emergency' },
]

/** Health: a ward's nurses on twelve-hour day and night shifts, the contact button reads Call. */
export const WardShifts: Story = {
  name: 'Ward shifts',
  args: {
    people: nurses,
    shifts: wards,
    week: MONDAY,
    now: day(2, 13.4),
    copy: {
      title: 'Ward shifts',
      subtitle: 'Ward 4B · week 45',
      current: 'On shift now',
      onDuty: 'On shift',
      timeLeft: 'Shift ends in',
      swapWith: 'Hand the rest of this shift to',
      swapped: (name: string, time: string) => `${name} covers until ${time}`,
      contact: 'Call',
      contacting: 'Calling…',
      contacted: 'Called',
      rota: 'This week',
      status: 'Charge nurse is paged after 5 min',
      schedule: 'Full roster',
    },
    onContact: fn(),
  },
}

const crew: ShiftRotaPerson[] = [
  { id: 'lena', name: 'Lena Novak', detail: 'Store lead' },
  { id: 'omar', name: 'Omar Haddad', detail: 'Sales floor' },
  { id: 'mei', name: 'Mei Tanaka', detail: 'Sales floor' },
]

// Opening 08:00–15:00 and closing 15:00–22:00, Monday to Saturday; Sunday is half a day.
const store: ShiftRotaShift[] = [
  ...[0, 1, 2, 3, 4, 5].flatMap((n): ShiftRotaShift[] => [
    { id: `o${n}`, lane: n % 2 ? 'omar' : 'lena', start: day(n, 8), end: day(n, 15) },
    { id: `c${n}`, lane: n % 2 ? 'mei' : 'omar', start: day(n, 15), end: day(n, 22) },
  ]),
  { id: 'sun', lane: 'lena', start: day(6, 10), end: day(6, 16) },
  { id: 'swap', lane: 'mei', start: day(3, 8), end: day(3, 12), override: true, note: 'Covering Omar’s appointment' },
]

/** Retail: opening and closing shifts for a store's crew, with the contact button reading Message. */
export const StoreStaff: Story = {
  name: 'Store staff',
  args: {
    people: crew,
    shifts: store,
    week: MONDAY,
    now: day(1, 16.2),
    copy: {
      title: 'Store rota',
      subtitle: 'Harbor Street · week 45',
      current: 'Working now',
      onDuty: 'Working',
      timeLeft: 'Time left on shift',
      contact: 'Message',
      contacting: 'Sending…',
      contacted: 'Sent',
      swapWith: 'Hand the rest of this shift to',
      swapped: (name: string, time: string) => `${name} is working until ${time}`,
      rota: 'This week',
      legendOverride: 'Cover',
      status: 'The store lead is told after 10 min',
      schedule: 'Open schedule',
    },
    onContact: fn(),
  },
}
