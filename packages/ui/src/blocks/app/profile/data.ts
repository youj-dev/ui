import type { ReactNode } from 'react'
import { PackageIcon, StarIcon, TypeIcon } from '@youj/icons'
import { type TimelineEvent, type TimelineEventType } from '../../../components/ui/timeline'

/** The person the page is about. */
export interface ProfileUser {
  name: string
  /** Shown with an @, e.g. `inesduarte`. */
  handle: string
  /** A photo URL. Default: `initials`. */
  avatarUrl?: string
  /** The avatar's fallback. Default: from `name`. */
  initials?: string
  verified?: boolean
  location?: string
  /** What they do, e.g. `Type designer at Fundição`. */
  role?: string
  bio?: string
  /** The profile's public URL, for Copy link. */
  url?: string
}

export interface ProfileStat {
  label: string
  value: number
  /** How the number reads. Default: grouped digits. */
  format?: Intl.NumberFormatOptions
}

export interface ProfileWork {
  id: string
  name: string
  /** A line under the name, e.g. `9 weights · 2026`. */
  meta: string
  likes: number
  /** The card's picture. Default: `glyph` set large. */
  media?: ReactNode
  /** A few characters shown large when there's no `media`. */
  glyph?: string
  /** Classes for the glyph: its face (`font-serif italic`) and its tile (`bg-band text-fg`). */
  face?: string
  tone?: string
}

export interface ProfileFriend {
  id: string
  name: string
  /** A photo URL. */
  src?: string
}

export interface ProfileLink {
  label: string
  href: string
}

/** One day's count in the activity heatmap. */
export interface ProfileContribution {
  /** The day, as a Date, a timestamp or `YYYY-MM-DD`. */
  date: Date | number | string
  count: number
}

/** The demo's "now": the heatmap ends here and the activity is timed from it. */
export const DEMO_NOW = new Date(2026, 8, 30, 15, 0).getTime()

export const USER: ProfileUser = {
  name: 'Inês Duarte',
  handle: 'inesduarte',
  initials: 'Id',
  verified: true,
  location: 'Lisbon',
  role: 'Type designer at Fundição',
  bio: 'I draw typefaces for screens and street signs. Currently: a variable grotesque for Lisbon’s transit wayfinding.',
  url: 'https://fundicao.type/@inesduarte',
}

export const FOLLOWERS = 12_480

export const STATS: ProfileStat[] = [
  { label: 'Following', value: 318 },
  { label: 'Typefaces', value: 14 },
  { label: 'Downloads', value: 48_200, format: { notation: 'compact', maximumFractionDigits: 1 } },
]

export const WORK: ProfileWork[] = [
  { id: 'mare', name: 'Maré Sans', meta: '9 weights · 2026', glyph: 'Aa', face: 'font-sans font-semibold', tone: 'bg-accent-subtle text-accent', likes: 2140 },
  { id: 'azulejo', name: 'Azulejo', meta: 'Display · 2025', glyph: 'Rg', face: 'font-serif italic', tone: 'bg-fg text-canvas', likes: 1380 },
  { id: 'tipo', name: 'Tipo Mono', meta: '5 weights · 2025', glyph: '{ }', face: 'font-mono', tone: 'bg-band text-fg', likes: 960 },
  { id: 'calcada', name: 'Calçada', meta: 'Variable · 2024', glyph: 'Qu', face: 'font-sans font-black tracking-tighter', tone: 'bg-accent text-on-accent', likes: 3120 },
]

export const TYPES: Record<string, TimelineEventType> = {
  release: { icon: PackageIcon, tone: 'accent', label: 'Release' },
  star: { icon: StarIcon, tone: 'warning', label: 'Starred' },
  glyph: { icon: TypeIcon, label: 'Glyphs' },
}

const HOUR = 3_600_000
export const ACTIVITY: TimelineEvent[] = [
  { id: 'a1', type: 'release', title: 'Released Maré Sans 2.0 with a variable axis', time: DEMO_NOW - 3 * HOUR },
  { id: 'a2', type: 'glyph', title: 'Drew 48 new Cyrillic glyphs for Tipo Mono', time: DEMO_NOW - 26 * HOUR },
  { id: 'a3', type: 'star', title: 'Starred “Kerning pairs, explained” by Rui Alves', time: DEMO_NOW - 50 * HOUR },
  { id: 'a4', type: 'release', title: 'Released Azulejo Display 1.3', time: DEMO_NOW - 170 * HOUR },
]

export const FRIENDS: ProfileFriend[] = [
  { id: 'r', name: 'Rui Alves' },
  { id: 'a', name: 'Ana Sousa' },
  { id: 'k', name: 'Kenji Mori' },
  { id: 'l', name: 'Lena Brandt' },
  { id: 'o', name: 'Omar Haddad' },
  { id: 'p', name: 'Priya Nair' },
]

export const LINKS: ProfileLink[] = [
  { label: 'fundicao.type', href: '#' },
  { label: 'Specimens on Are.na', href: '#' },
  { label: 'Newsletter: Ligatures', href: '#' },
]

export const SKILLS = ['Variable fonts', 'Wayfinding', 'Cyrillic', 'Hinting', 'Lettering']

export const STATUS = { title: 'Open for commissions', description: 'Usually replies within a day.' }

const first = (name: string) => name.split(' ')[0] ?? name

export const DEFAULT_COPY = {
  title: 'Profile',
  verified: 'Verified',
  follow: 'Follow',
  following: 'Following',
  message: 'Message',
  copyLink: 'Copy link',
  copied: 'Copied',
  followers: 'Followers',
  tabsLabel: 'Profile sections',
  workTab: 'Work',
  activityTab: 'Activity',
  aboutTab: 'About',
  likes: 'Likes:',
  emptyWork: 'Nothing published yet.',
  asideLabel: (name: string) => `About ${first(name)}`,
  followedBy: 'Followed by',
  followedByDescription: (names: string[]) =>
    names.length > 2 ? `${first(names[0]!)}, ${first(names[1]!)} and ${names.length - 2} others you know.` : `${names.map(first).join(' and ')} you know.`,
  mutualFollowers: 'Mutual followers',
  elsewhere: 'Elsewhere',
  contributions: 'contributions',
  heatmapDescription: 'Glyphs drawn, releases and reviews in the last six months.',
  heatmapLabel: (total: number, weeks: number) => `Contribution heatmap: ${total} contributions over ${weeks} weeks, busiest on weekdays.`,
  noContributions: 'No contributions',
  dayContributions: (count: number) => `${count} contributions`,
  less: 'Less',
  more: 'More',
}

export type ProfileCopy = typeof DEFAULT_COPY
