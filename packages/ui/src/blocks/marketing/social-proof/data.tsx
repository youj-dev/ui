import type { MouseEventHandler, ReactNode } from 'react'

/** A customer on the wall. */
export interface SocialProofLogo {
  /** The customer's name: the image's accessible name, and the wordmark text when there's no `logo`. */
  name: string
  /** The industry filter it sits under. */
  industry: string
  /** The customer's wordmark, an `<img>` or `<svg>` about 1.5rem tall. Without it, `mark` sits beside the name. */
  logo?: ReactNode
  /** A glyph drawn in a 24×24 viewBox (the children of an `<svg>`), filled with the text color. */
  mark?: ReactNode
}

/** One result in a customer story: a number that counts up, with what it measures. */
export interface SocialProofMetric {
  value: number
  /** How the number is written (`Intl.NumberFormat` options). */
  format?: Intl.NumberFormatOptions
  /** A unit set smaller after the number ("%", "×"). */
  suffix?: string
  label: string
}

/** A customer story: the featured card. */
export interface SocialProofStory {
  id: string
  /** The customer's name; a logo with this name opens the story. */
  customer: string
  headline: string
  quote: string
  author: { name: string; role: string; avatar?: string }
  metrics: SocialProofMetric[]
  /** The full story. */
  href: string
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

/** A review site's score. */
export interface SocialProofSource {
  name: string
  score: number
  count: number
}

/** The rating summary. */
export interface SocialProofRating {
  /** The average, out of 5. */
  score: number
  /** How many reviews it is out of. */
  count: number
  /** The share of reviews at 5, 4, 3, 2 and 1 stars, in percent. */
  distribution: [number, number, number, number, number]
  sources?: SocialProofSource[]
}

export const LOGOS: SocialProofLogo[] = [
  { name: 'Lumen', industry: 'Commerce', mark: <circle cx="12" cy="12" r="7" /> },
  { name: 'Northstar', industry: 'Fintech', mark: <path d="m12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6z" /> },
  { name: 'Arcadia', industry: 'Media', mark: <path d="M4 19 12 5l8 14z" /> },
  { name: 'Helix', industry: 'Health', mark: <path d="M5 4h4v16H5zM15 4h4v16h-4zM9 10h6v4H9z" /> },
  { name: 'Vertex', industry: 'Fintech', mark: <path d="M4 5h16l-8 14z" /> },
  { name: 'Orbital', industry: 'Developer tools', mark: <><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" /></> },
  { name: 'Tandem', industry: 'Commerce', mark: <><circle cx="8" cy="12" r="5" /><circle cx="16" cy="12" r="5" opacity={0.5} /></> },
  { name: 'Mosaic', industry: 'Media', mark: <path d="M4 4h7v7H4zM13 13h7v7h-7zM13 4h7v7h-7z" /> },
  { name: 'Quanta', industry: 'Fintech', mark: <rect x="4" y="4" width="16" height="16" rx="4" /> },
  { name: 'Parallel', industry: 'Developer tools', mark: <path d="M7 4h4l-2 16H5zM15 4h4l-2 16h-4z" /> },
  { name: 'Kestrel', industry: 'Health', mark: <path d="M3 12 12 4l9 8-9 8z" /> },
  { name: 'Fernhill', industry: 'Commerce', mark: <path d="M12 3c5 3 7 8 0 18C5 11 7 6 12 3z" /> },
  { name: 'Marlowe', industry: 'Media', mark: <path d="M4 18V6l8 8 8-8v12" fill="none" stroke="currentColor" strokeWidth="2.5" /> },
  { name: 'Anvil', industry: 'Developer tools', mark: <path d="M3 8h18l-4 5H8zM9 13h6v6H9z" /> },
  { name: 'Pinewood', industry: 'Health', mark: <path d="m12 3 6 8h-3l5 7H4l5-7H6z" /> },
  { name: 'Bluebird', industry: 'Fintech', mark: <path d="M3 12c4-6 10-6 18 0-8 6-14 6-18 0z" /> },
]

export const STORIES: SocialProofStory[] = [
  {
    id: 'lumen',
    customer: 'Lumen',
    headline: 'How Lumen moved 140 services in a quarter',
    quote: 'The previews alone paid for it. Design review happens on the real thing now, not on screenshots, and checkout got faster as a side effect.',
    author: { name: 'Mara Okafor', role: 'Head of Platform, Lumen' },
    metrics: [
      { value: 38, suffix: '%', label: 'faster checkout' },
      { value: 140, label: 'services migrated' },
      { value: 4, suffix: '×', label: 'deploys per day' },
    ],
    href: '#story-lumen',
  },
  {
    id: 'northstar',
    customer: 'Northstar',
    headline: 'Northstar rolled back an incident in under a second',
    quote: 'Rollback is a pointer change. The first time we used it in an incident, the whole thing was over before the pager stopped buzzing.',
    author: { name: 'Theo Brandt', role: 'CTO, Northstar' },
    metrics: [
      { value: 0.8, format: { maximumFractionDigits: 1 }, suffix: ' s', label: 'median rollback' },
      { value: 62, suffix: '%', label: 'fewer incident minutes' },
      { value: 12, label: 'regions, one deploy' },
    ],
    href: '#story-northstar',
  },
  {
    id: 'helix',
    customer: 'Helix',
    headline: 'Helix found a regression the CDN was blamed for',
    quote: 'Analytics split by deploy found a third-of-a-second regression we had been blaming on the CDN for a month. It was ours.',
    author: { name: 'Sofia Lindqvist', role: 'Engineering Manager, Helix' },
    metrics: [
      { value: 330, suffix: ' ms', label: 'regression found' },
      { value: 29, suffix: '%', label: 'better LCP' },
      { value: 1, label: 'afternoon to fix it' },
    ],
    href: '#story-helix',
  },
]

export const RATING: SocialProofRating = {
  score: 4.8,
  count: 2314,
  distribution: [78, 16, 4, 1, 1],
  sources: [
    { name: 'G2', score: 4.8, count: 1204 },
    { name: 'Capterra', score: 4.7, count: 688 },
    { name: 'TrustRadius', score: 4.9, count: 422 },
  ],
}

export const DEFAULT_COPY = {
  eyebrow: 'Customers',
  title: 'Trusted by 40,000 teams, loved by the ones who ship the most',
  description: 'From two-person startups to banks. Filter by industry, or open a customer’s story to see what changed.',
  filterLabel: 'Filter customers by industry',
  all: 'All',
  /** The wall's list name: "Customers, Fintech". */
  wall: (industry: string) => `Customers, ${industry}`,
  noLogos: 'No customers in this industry yet.',
  /** A logo that opens a story. */
  openStory: (customer: string) => `${customer}: read the story`,
  storyEyebrow: 'Customer stories',
  readStory: 'Read the story',
  /** The results row's name. */
  results: 'Results',
  ratingTitle: 'Customer rating',
  /** "4.8 out of 5". */
  outOf: (score: string, max: number) => `${score} out of ${max}`,
  /** "from 2,314 reviews". */
  reviews: (count: string) => `from ${count} reviews`,
  /** A star row of the distribution: "5 stars: 78%". */
  stars: (stars: number, percent: string) => `${stars} ${stars === 1 ? 'star' : 'stars'}: ${percent}`,
  sources: 'Review sites',
}
export type SocialProofCopy = typeof DEFAULT_COPY
