import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { MonthAgenda } from './month-agenda'

const meta: Meta<typeof MonthAgenda> = {
  title: 'Blocks/App/Month Agenda',
  component: MonthAgenda,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'What comes round each month, on the kit’s Calendar: each day a tile with the marks of what falls on it and a dot for the cycle (solid monthly, a ring yearly), today lit in the accent and the days outside the month hatched. Hover or arrow onto a day for its events; pick one and + adds one on it. The head counts what is active and new, the foot sums what is due in the month, or counts the events when none has an amount. Every name and mark is made up.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof MonthAgenda>

/** A fictional household’s October 2026, seen on the 13th: nine subscriptions, three new. */
export const Default: Story = { name: 'Household subscriptions' }

/** A day picked: + adds on it. */
export const Picked: Story = { args: { defaultValue: '2026-10-07' } }

/** Other data: a team’s tools in euros, in German, weeks from Monday, and the actions in Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    locale: 'de-DE',
    format: (amount: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount),
    today: '2026-11-04',
    weekStartsOn: 1,
    events: [
      { id: 'plan', name: 'Planwerk', amount: 24, cycle: 'monthly', start: '2025-02-03', mark: 'diamond', tone: 'chart-2' },
      { id: 'mail', name: 'Postfach Pro', amount: 6.5, cycle: 'monthly', start: '2024-07-11', mark: 'ring', tone: 'chart-5' },
      { id: 'cloud', name: 'Wolke 9', amount: 119, cycle: 'yearly', start: '2023-11-18', mark: 'hex', tone: 'chart-1' },
      { id: 'design', name: 'Formbar', amount: 15, cycle: 'monthly', start: '2026-11-18', mark: 'triangle', tone: 'chart-3' },
      { id: 'ticket', name: 'Ticketwerk', amount: 9, cycle: 'monthly', start: '2026-03-30', tone: 'chart-4' },
    ],
    copy: {
      title: 'Abos',
      subtitle: (count: string, added: string) => `${count} aktiv · ${added} neu`,
      add: 'Abo hinzufügen',
      today: 'Heute',
      previous: 'Vorheriger Monat',
      next: 'Nächster Monat',
      monthly: 'Monatlich',
      yearly: 'Jährlich',
      perMonth: (amount: string) => `${amount} / Monat`,
      perYear: (amount: string) => `${amount} / Jahr`,
      upcoming: (name: string, date: string) => `Nächstes: ${name}, ${date}`,
      monthTotal: (month: string) => `Fällig im ${month}`,
    },
    onAdd: fn(),
    onValueChange: fn(),
    onMonthChange: fn(),
  },
}

/** No subscriptions yet: the month is still drawn. */
export const Empty: Story = { args: { events: [], today: '2026-10-13' } }

/** Drawn as its own page, with the title as the page's `h1`. */
export const Standalone: Story = { args: { embedded: false } }

/** Personal: birthdays come round once a year and carry no amounts, so no money shows and the foot counts them instead. */
export const Birthdays: Story = {
  args: {
    today: '2026-10-13',
    events: [
      { id: 'mia', name: 'Mia', cycle: 'yearly', start: '1991-10-05', tone: 'chart-1' },
      { id: 'jonas', name: 'Jonas', cycle: 'yearly', start: '1988-10-13', tone: 'chart-2' },
      { id: 'amara', name: 'Amara', cycle: 'yearly', start: '1994-10-13', tone: 'chart-3' },
      { id: 'theo', name: 'Theo', cycle: 'yearly', start: '2015-10-21', tone: 'chart-4' },
      { id: 'priya', name: 'Priya', cycle: 'yearly', start: '1979-10-29', tone: 'chart-5' },
      { id: 'leon', name: 'Leon', cycle: 'yearly', start: '1996-11-02', tone: 'chart-1' },
      { id: 'noor', name: 'Noor', cycle: 'yearly', start: '2001-09-30', tone: 'chart-2' },
    ],
    copy: {
      title: 'Birthdays',
      add: 'Add birthday',
      subtitle: (count: string) => `${count} people`,
      count: (n: number) => `${n} people`,
      upcoming: (name: string, date: string) => `Next: ${name}, ${date}`,
      monthTotal: (month: string) => `Birthdays in ${month}`,
      monthCount: (month: string) => `Birthdays in ${month}`,
      onDay: (list: string) => `Birthday: ${list}`,
      onDayEvent: (name: string) => name,
      none: 'No birthdays yet',
    },
  },
}

/** Operations: a building’s inspections, each costing technician hours, formatted by `format` instead of money. */
export const MaintenancePlan: Story = {
  name: 'Maintenance plan',
  args: {
    today: '2026-10-13',
    format: (hours: number) => `${hours} h`,
    events: [
      { id: 'elevator', name: 'Elevator', amount: 3, cycle: 'monthly', start: '2024-02-05', mark: 'bars', tone: 'chart-2' },
      { id: 'boiler', name: 'Boiler', amount: 4, cycle: 'yearly', start: '2025-10-16', mark: 'drop', tone: 'chart-4' },
      { id: 'alarm', name: 'Fire alarm', amount: 2, cycle: 'monthly', start: '2025-03-13', mark: 'triangle', tone: 'chart-1' },
      { id: 'roof', name: 'Roof', amount: 6, cycle: 'yearly', start: '2023-10-22', mark: 'hex', tone: 'chart-3' },
      { id: 'hvac', name: 'Ventilation', amount: 2.5, cycle: 'monthly', start: '2026-10-27', mark: 'orbit', tone: 'chart-5' },
    ],
    copy: {
      title: 'Maintenance',
      add: 'Schedule visit',
      subtitle: (count: string, added: string) => `${count} inspections · ${added} new`,
      count: (n: number) => `${n} inspections`,
      monthTotal: (month: string) => `Technician time in ${month}`,
      onDay: (list: string) => `Visits ${list}`,
      none: 'No inspections planned',
    },
  },
}

/** Health: monthly refills with their copays in US dollars. */
export const MedicationRefills: Story = {
  name: 'Medication refills',
  args: {
    today: '2026-10-13',
    events: [
      { id: 'lisin', name: 'Lisinopril', amount: 8, cycle: 'monthly', start: '2025-04-03', mark: 'ring', tone: 'chart-1' },
      { id: 'metf', name: 'Metformin', amount: 4.5, cycle: 'monthly', start: '2025-04-09', mark: 'half', tone: 'chart-2' },
      { id: 'atorv', name: 'Atorvastatin', amount: 12, cycle: 'monthly', start: '2025-06-17', mark: 'diamond', tone: 'chart-3' },
      { id: 'vitd', name: 'Vitamin D', amount: 6.25, cycle: 'monthly', start: '2026-10-23', mark: 'drop', tone: 'chart-4' },
      { id: 'inhal', name: 'Inhaler', amount: 25, cycle: 'yearly', start: '2024-10-29', mark: 'orbit', tone: 'chart-5' },
    ],
    copy: {
      title: 'Refills',
      add: 'Add refill',
      subtitle: (count: string, added: string) => `${count} active · ${added} new`,
      count: (n: number) => `${n} medications`,
      monthTotal: (month: string) => `Copays in ${month}`,
      onDay: (list: string) => `Refills ${list}`,
      none: 'No refills yet',
    },
  },
}

/** Skeleton tiles in the grid’s place while the data loads; the month keeps its size. */
export const Loading: Story = { args: { loading: true, today: '2026-10-13' } }

/** The load failed: the message sits over the month with Retry. */
export const Error: Story = { args: { error: 'Couldn’t load the agenda.', onRetry: fn(), today: '2026-10-13' } }
