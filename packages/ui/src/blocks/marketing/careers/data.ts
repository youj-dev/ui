import type { MouseEventHandler } from 'react'

/** An open role. */
export interface CareersRole {
  id: string
  title: string
  /** The team it's on: the tabs group by it. */
  team: string
  /** Where it's based: "London", "Remote, Europe". */
  location: string
  /** It can be done from anywhere in its region: the location filter's Remote. */
  remote?: boolean
  /** "Full-time", "Contract". */
  type?: string
  /** The salary band, as written on the posting: "€95–125k". */
  salary?: string
  /** When it was posted: roles from the last fortnight say New. */
  posted?: Date | string | number
  href: string
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

/** A link: the open application. */
export interface CareersCta {
  label: string
  href: string
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

const DAY = 86_400_000
/** The demo's roles were posted this many days before the page opens, so some always read as New. */
const daysAgo = (days: number) => Date.now() - days * DAY

export const ROLES: CareersRole[] = [
  {
    id: 'edge',
    title: 'Senior engineer, edge network',
    team: 'Engineering',
    location: 'Remote, Europe',
    remote: true,
    type: 'Full-time',
    salary: '€95–125k',
    posted: daysAgo(3),
    href: '#role-edge',
  },
  {
    id: 'builds',
    title: 'Staff engineer, build systems',
    team: 'Engineering',
    location: 'Berlin',
    type: 'Full-time',
    salary: '€120–150k',
    posted: daysAgo(18),
    href: '#role-builds',
  },
  {
    id: 'dx',
    title: 'Engineer, developer experience',
    team: 'Engineering',
    location: 'Remote, Americas',
    remote: true,
    type: 'Full-time',
    salary: '$150–185k',
    posted: daysAgo(26),
    href: '#role-dx',
  },
  {
    id: 'designer',
    title: 'Product designer, observability',
    team: 'Design',
    location: 'Remote, Americas',
    remote: true,
    type: 'Full-time',
    salary: '$140–170k',
    posted: daysAgo(6),
    href: '#role-designer',
  },
  {
    id: 'design-eng',
    title: 'Design engineer',
    team: 'Design',
    location: 'Lisbon',
    type: 'Full-time',
    salary: '€80–100k',
    posted: daysAgo(40),
    href: '#role-design-eng',
  },
  {
    id: 'security',
    title: 'Security engineer',
    team: 'Security',
    location: 'London',
    type: 'Full-time',
    salary: '£95–120k',
    posted: daysAgo(21),
    href: '#role-security',
  },
  {
    id: 'solutions',
    title: 'Solutions engineer',
    team: 'Customers',
    location: 'New York',
    type: 'Full-time',
    salary: '$160–190k',
    posted: daysAgo(9),
    href: '#role-solutions',
  },
  {
    id: 'support',
    title: 'Support engineer, nights',
    team: 'Customers',
    location: 'Remote, Asia-Pacific',
    remote: true,
    type: 'Contract',
    salary: 'A$110–130k',
    posted: daysAgo(33),
    href: '#role-support',
  },
]

export const PERKS = [
  'Remote first, offices optional',
  'A four-day week every summer',
  'A salary band on every posting',
  '€2,000 a year to learn anything',
]

/** English's one or other: the copy picks its word with the language's plural rules. */
const plural = (n: number, one: string, other: string) => (new Intl.PluralRules('en').select(n) === 'one' ? one : other)

export const DEFAULT_COPY = {
  eyebrow: 'Careers',
  title: 'Come build it with us',
  description: 'Small teams, long runways and honest pay. We hire people who like to own something end to end.',
  perksLabel: 'What you get',
  teamsLabel: 'Teams',
  all: 'All roles',
  search: 'Search roles',
  searchPlaceholder: 'Search roles',
  clearSearch: 'Clear the search',
  location: 'Location',
  anywhere: 'Anywhere',
  remote: 'Remote',
  /** How many roles the filters leave. */
  count: (n: number) => `${n} open ${plural(n, 'role', 'roles')}`,
  new: 'New',
  emptyTitle: 'No roles match',
  emptyDescription: 'Try another team or place, or write to us anyway: we read every letter.',
  clearFilters: 'Clear filters',
  openTitle: 'Don’t see your role?',
  openDescription: 'Tell us what you’d build here. Good people make their own openings.',
}
export type CareersCopy = typeof DEFAULT_COPY
