import type { MouseEventHandler, ReactNode } from 'react'

/** A link on a person ("LinkedIn"). */
export interface TeamPersonLink {
  label: string
  href: string
  icon?: ReactNode
}

/** A person on the team. */
export interface TeamPerson {
  id: string
  name: string
  role: string
  /** The team they're on: the filter groups by it. */
  team: string
  /** Where they work from ("Lisbon"). */
  location?: string
  /** Their IANA time zone ("Europe/Lisbon"): the card shows their local time, and whether it's day there. */
  timeZone?: string
  /** A photo's URL; without one the portrait is their initials, set large. */
  photo?: string
  /** One or two sentences, shown over the portrait on hover, focus or a tap. */
  bio?: string
  links?: TeamPersonLink[]
}

/** A link to the whole team. */
export interface TeamCta {
  label: string
  href: string
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

export const PEOPLE: TeamPerson[] = [
  {
    id: 'ines',
    name: 'Ines Duarte',
    role: 'Co-founder and CEO',
    team: 'Leadership',
    location: 'Lisbon',
    timeZone: 'Europe/Lisbon',
    bio: 'Built her first deploy pipeline in 2012 and has been trying to make it simpler ever since.',
    links: [{ label: 'LinkedIn', href: '#in-ines' }],
  },
  {
    id: 'theo',
    name: 'Theo Brandt',
    role: 'Co-founder and CTO',
    team: 'Leadership',
    location: 'Berlin',
    timeZone: 'Europe/Berlin',
    bio: 'Writes the parts of the edge nobody sees, and the postmortems everybody reads.',
    links: [{ label: 'GitHub', href: '#gh-theo' }],
  },
  {
    id: 'mara',
    name: 'Mara Okafor',
    role: 'VP of Engineering',
    team: 'Engineering',
    location: 'Lagos',
    timeZone: 'Africa/Lagos',
    bio: 'Grew the platform team from four people to forty without a single reorg.',
  },
  {
    id: 'kenji',
    name: 'Kenji Mori',
    role: 'Staff engineer, edge',
    team: 'Engineering',
    location: 'Tokyo',
    timeZone: 'Asia/Tokyo',
    bio: 'Owns the cache and the 38 regions it lives in. Answers pages faster than the alerts arrive.',
  },
  {
    id: 'priya',
    name: 'Priya Raman',
    role: 'Principal designer',
    team: 'Design',
    location: 'Bangalore',
    timeZone: 'Asia/Kolkata',
    bio: 'Designs for the second after the deploy, when people are anxious and the screen has to be calm.',
  },
  {
    id: 'jonas',
    name: 'Jonas Weiss',
    role: 'Head of design systems',
    team: 'Design',
    location: 'Zurich',
    timeZone: 'Europe/Zurich',
    bio: 'Keeps three hundred components in step, and the spacing scale honest.',
    links: [{ label: 'Website', href: '#web-jonas' }],
  },
  {
    id: 'amara',
    name: 'Amara Eze',
    role: 'Head of security',
    team: 'Security',
    location: 'London',
    timeZone: 'Europe/London',
    bio: 'Reads every penetration test report twice, once for the findings and once for what we missed.',
  },
  {
    id: 'sofia',
    name: 'Sofia Lindqvist',
    role: 'Head of customer success',
    team: 'Customers',
    location: 'Stockholm',
    timeZone: 'Europe/Stockholm',
    bio: 'Answers the hard emails herself. Customers have her number.',
  },
]

export const DEFAULT_COPY = {
  eyebrow: 'The team',
  title: 'The people behind it',
  description: 'A few of the 126, in nineteen countries and most time zones. Someone is always awake.',
  filterLabel: 'Filter people by team',
  all: 'Everyone',
  /** A person's local time: "14:32 in Lisbon". */
  localTime: (time: string, place: string) => `${time} in ${place}`,
  day: 'Daytime',
  night: 'Night-time',
  /** A link on a person: "Ines Duarte on LinkedIn". */
  personLink: (name: string, link: string) => `${name} on ${link}`,
  empty: 'Nobody on this team yet.',
}
export type MarketingTeamCopy = typeof DEFAULT_COPY
