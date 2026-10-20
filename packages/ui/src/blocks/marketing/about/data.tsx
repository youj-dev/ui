import type { ReactNode } from 'react'
import { CompassIcon, HeartIcon, LeafIcon, LightbulbIcon } from '@youj/icons'

/** A number the story is told in ("People"), and how it's written. */
export interface AboutMetric {
  id: string
  label: string
  /** How the number is written (`Intl.NumberFormatOptions`). */
  format?: Intl.NumberFormatOptions
  suffix?: string
  /** Draw this one as the growth line under the years. The first metric that says so is drawn; default the second. */
  chart?: boolean
}

/** A chapter of the story: a year (or "Today"), what happened, and the numbers as they stood. */
export interface AboutMilestone {
  /** A stable id, the milestone's value. Default: its label. */
  id?: string
  /** The year on the rail: "2021", "Today". */
  label: string
  title: string
  description: string
  /** Each metric's value then, by the metric's id. */
  figures: Record<string, number>
}

/** A value the company holds. */
export interface AboutValue {
  title: string
  description: string
  /** A 16px glyph beside its number. */
  icon?: ReactNode
}

export const METRICS: AboutMetric[] = [
  { id: 'people', label: 'People' },
  { id: 'teams', label: 'Teams on Northwind', format: { notation: 'compact' }, chart: true },
  { id: 'regions', label: 'Edge regions' },
]

export const MILESTONES: AboutMilestone[] = [
  {
    label: '2019',
    title: 'A weekend project',
    description: 'Two engineers in Lisbon, tired of dreading Fridays, ship a deploy tool for their own team.',
    figures: { people: 2, teams: 12, regions: 1 },
  },
  {
    label: '2020',
    title: 'A preview for every pull request',
    description: 'Previews land, the first thousand teams follow, and the support queue is still answered by the founders.',
    figures: { people: 9, teams: 1_000, regions: 2 },
  },
  {
    label: '2021',
    title: 'Out of Europe',
    description: 'Virginia and Tokyo open, and a Series A lets us hire the people we had been waiting for.',
    figures: { people: 34, teams: 4_200, regions: 6 },
  },
  {
    label: '2022',
    title: 'Rollback in a second',
    description: 'Every deploy becomes immutable and stays warm, so going back is a pointer, not a rebuild.',
    figures: { people: 61, teams: 11_000, regions: 14 },
  },
  {
    label: '2023',
    title: 'The edge, everywhere',
    description: 'Functions move to the edge in 24 regions, and we start publishing our emissions per request.',
    figures: { people: 88, teams: 19_500, regions: 24 },
  },
  {
    label: '2024',
    title: 'Calm at scale',
    description: 'A thousand deploys a minute on a quiet Tuesday, and an incident page nobody needed to open.',
    figures: { people: 109, teams: 31_000, regions: 32 },
  },
  {
    label: 'Today',
    title: 'Still answering the queue',
    description: '126 people in 19 countries, 40,000 teams, and the people who built it still take the support rota.',
    figures: { people: 126, teams: 40_000, regions: 38 },
  },
]

export const VALUES: AboutValue[] = [
  {
    title: 'Make it boring to ship',
    description: 'The best release is the one nobody remembers: forgettable deploys, cheap mistakes.',
    icon: <CompassIcon size={16} />,
  },
  {
    title: 'Default to open',
    description: 'Prices, roadmaps, incident reports and salary bands, written down where everyone can read them.',
    icon: <LightbulbIcon size={16} />,
  },
  {
    title: 'Care for the people on call',
    description: 'Every alert has an owner, every incident a blameless review, and nobody is a hero twice.',
    icon: <HeartIcon size={16} />,
  },
  {
    title: 'Leave it lighter',
    description: 'Less code, fewer dependencies, a smaller carbon bill, measured per request and published.',
    icon: <LeafIcon size={16} />,
  },
]

export const DEFAULT_COPY = {
  eyebrow: 'About us',
  /** The mission, set large. */
  mission: 'We build the platform we wanted when we were the ones on call.',
  description:
    'Northwind started as a weekend project to stop one team from dreading Fridays. Seven years on, 40,000 teams use it, and the people who built it still answer the support queue on rotation.',
  /** Names the timeline and its years. */
  timeline: 'Northwind, year by year',
  /** A year's name on the rail: "2021, Out of Europe". */
  milestoneName: (label: string, title: string) => `${label}, ${title}`,
  pause: 'Pause the story',
  play: 'Play the story',
  replay: 'Play the story again',
  valuesTitle: 'What we hold ourselves to',
}
export type AboutCopy = typeof DEFAULT_COPY
