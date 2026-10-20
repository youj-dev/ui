import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { RoadmapTimeline } from './roadmap-timeline'

const meta: Meta<typeof RoadmapTimeline> = {
  title: 'Blocks/App/Roadmap Timeline',
  component: RoadmapTimeline,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'A year on one ruler, for a product, a wedding or a renovation: a pin per item, taller for the big ones, solid once done, hollow while upcoming and amber when it needs attention, with today marked and a count where items crowd one week. Hover along it or walk the pins with the arrow keys and the callout says the date, status, title and one line about it; the foot counts what is done, how soon the next lands and what needs attention.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof RoadmapTimeline>

/** A fictional product’s 2026 on 13 October: five shipped, SSO at risk, Version 2 ahead. */
export const Default: Story = { name: 'Product roadmap' }

/** Version 2 picked, so its callout stays shown. */
export const Picked: Story = { args: { defaultValue: 'v2' } }

/** Other data: a 2027 plan in German, a week with three launches on one pin, and picks in Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    locale: 'de-DE',
    year: 2027,
    today: '2027-03-18',
    items: [
      { id: 'kickoff', date: '2027-01-12', title: 'Projektstart', description: 'Team und Ziele stehen' },
      { id: 'alpha', date: '2027-03-02', title: 'Alpha', description: 'Für zehn Pilotkunden', major: true },
      { id: 'pricing', date: '2027-05-04', title: 'Neue Preise', status: 'at-risk', description: 'Wartet auf die Rechtsabteilung' },
      { id: 'beta', date: '2027-07-06', title: 'Beta', description: 'Offen für alle Teams', major: true },
      { id: 'android', date: '2027-07-08', title: 'Android-App' },
      { id: 'ios', date: '2027-07-09', title: 'iOS-App' },
      { id: 'launch', date: '2027-10-14', title: 'Start', description: 'Allgemein verfügbar', major: true },
    ],
    copy: {
      title: (year: number) => `Roadmap ${year}`,
      subtitle: 'Kompass',
      count: (n: number) => `${n} Meilensteine`,
      rulerLabel: 'Meilensteine des Jahres',
      doneValue: (done: string, total: string) => `${done} von ${total}`,
      next: 'Nächster',
      none: 'Keiner',
    },
    statuses: [
      { id: 'done', label: 'Erledigt', role: 'done' },
      { id: 'upcoming', label: 'Anstehend', role: 'upcoming' },
      { id: 'at-risk', label: 'Gefährdet', tone: 'warning', role: 'attention' },
    ],
    onValueChange: fn(),
  },
}

/** No milestones yet: the year is still drawn. */
export const Empty: Story = { args: { items: [], year: 2026, today: '2026-10-13' } }

/** Personal: a wedding's to-dos from setting the date to the day itself, with the invitations at risk until the guest list is final. */
export const WeddingPlanning: Story = {
  name: 'Wedding planning',
  args: {
    year: 2027,
    today: '2027-03-06',
    items: [
      { id: 'date', date: '2027-01-09', title: 'Set the date', description: 'Saturday, June 12', status: 'booked' },
      { id: 'venue', date: '2027-01-23', title: 'Book the venue', description: 'Deposit paid, garden and barn', status: 'booked', major: true },
      { id: 'caterer', date: '2027-02-06', title: 'Hire the caterer', description: 'Tasting done, menu chosen', status: 'booked' },
      { id: 'dress', date: '2027-02-27', title: 'Order the dress', description: 'Fitting in April', status: 'booked' },
      {
        id: 'invites',
        date: '2027-03-20',
        title: 'Send invitations',
        description: 'Waiting on the final guest list',
        status: 'waiting',
        major: true,
      },
      { id: 'cake', date: '2027-04-17', title: 'Cake tasting' },
      { id: 'headcount', date: '2027-05-08', title: 'Final headcount', description: 'To the caterer, three weeks out' },
      { id: 'day', date: '2027-06-12', title: 'The wedding', description: 'Ceremony at four', major: true },
    ],
    statuses: [
      { id: 'booked', label: 'Done', role: 'done' },
      { id: 'planned', label: 'Planned', role: 'upcoming' },
      { id: 'waiting', label: 'At risk', tone: 'warning', role: 'attention' },
    ],
    copy: {
      title: (year: number) => `Wedding ${year}`,
      subtitle: 'Priya and Jordan',
      count: (n: number) => `${n} to-dos`,
      rulerLabel: 'To-dos this year',
      next: 'Next up',
    },
    onValueChange: fn(),
  },
}

/** Construction: a renovation's phases from permits to the final inspection, with the rough-in inspection at risk until the inspector is free. */
export const BuildingRenovation: Story = {
  name: 'Building renovation',
  args: {
    year: 2027,
    today: '2027-04-05',
    items: [
      { id: 'permits', date: '2027-01-18', title: 'Permits approved', description: 'City sign-off on the plans', status: 'complete' },
      { id: 'demo', date: '2027-02-08', title: 'Demolition', description: 'Kitchen and back bathroom gutted', status: 'complete' },
      {
        id: 'framing',
        date: '2027-03-01',
        title: 'Framing',
        description: 'New wall between kitchen and dining room',
        status: 'complete',
        major: true,
      },
      { id: 'rough', date: '2027-03-29', title: 'Rough plumbing and electrical', status: 'complete' },
      {
        id: 'inspection',
        date: '2027-04-12',
        title: 'Rough-in inspection',
        description: 'Inspector is booked out until the 19th',
        status: 'delayed',
      },
      { id: 'drywall', date: '2027-05-03', title: 'Drywall and paint' },
      { id: 'finishes', date: '2027-06-07', title: 'Cabinets and tile', description: 'Delivery confirmed for June 1', major: true },
      { id: 'final', date: '2027-07-19', title: 'Final inspection', description: 'Then the keys back to the owners', major: true },
    ],
    statuses: [
      { id: 'complete', label: 'Done', role: 'done' },
      { id: 'scheduled', label: 'Scheduled', role: 'upcoming' },
      { id: 'delayed', label: 'At risk', tone: 'warning', role: 'attention' },
    ],
    copy: {
      title: (year: number) => `Renovation ${year}`,
      subtitle: '14 Alder Street',
      count: (n: number) => `${n} phases`,
      rulerLabel: 'Phases this year',
    },
  },
}

/** Skeletons hold the ruler and the foot's figures while the data loads. */
export const Loading: Story = { args: { loading: true } }

/** The load failed: the message with Retry over the ruler's room. */
export const Error: Story = { args: { error: 'Couldn’t load the timeline.', onRetry: fn() } }

/** Drawn as its own page, with the title as the page's `h1`. */
export const Standalone: Story = { args: { embedded: false } }
