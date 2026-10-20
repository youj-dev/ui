import type { MouseEventHandler, ReactNode } from 'react'

/** One testimonial on the wall. */
export interface TestimonialWallQuote {
  id: string
  /** What they said, without quotation marks. */
  quote: string
  /** A phrase of `quote`, verbatim, set in full ink; the rest reads a step quieter. */
  highlight?: string
  author: {
    name: string
    /** Their role ("Staff engineer"). */
    role: string
    company?: string
    /** An image URL; initials stand in without one. */
    avatar?: string
  }
  /** The company's glyph, drawn in a 24×24 viewBox (the children of an `<svg>`), filled with the text color. */
  mark?: ReactNode
  /** Stars out of 5, for a quote from a review. */
  rating?: number
  /** Where it was said ("G2", "Email"), in small type at the top. */
  source?: string
  /** A figure that leads the card. */
  metric?: { value: string; label: string }
  /** The original (a review, a post): the author's name links to it. */
  href?: string
}

/** A review site's score. */
export interface TestimonialWallSource {
  name: string
  score: number
}

/** The rating beside the heading. */
export interface TestimonialWallRating {
  /** The average, out of 5. */
  score: number
  /** How many reviews it is out of. */
  count: number
  sources?: TestimonialWallSource[]
}

/** The link under the wall. */
export interface TestimonialWallCta {
  label: string
  href: string
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

const MARKS = {
  lumen: <circle cx="12" cy="12" r="7" />,
  northstar: <path d="m12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6z" />,
  arcadia: <path d="M4 19 12 5l8 14z" />,
  helix: <path d="M5 4h4v16H5zM15 4h4v16h-4zM9 10h6v4H9z" />,
  vertex: <path d="M4 5h16l-8 14z" />,
  orbital: (
    <>
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
    </>
  ),
  tandem: (
    <>
      <circle cx="8" cy="12" r="5" />
      <circle cx="16" cy="12" r="5" opacity={0.5} />
    </>
  ),
  mosaic: <path d="M4 4h7v7H4zM13 13h7v7h-7zM13 4h7v7h-7z" />,
  quanta: <rect x="4" y="4" width="16" height="16" rx="4" />,
  parallel: <path d="M7 4h4l-2 16H5zM15 4h4l-2 16h-4z" />,
  kestrel: <path d="M3 12 12 4l9 8-9 8z" />,
  fernhill: <path d="M12 3c5 3 7 8 0 18C5 11 7 6 12 3z" />,
  marlowe: <path d="M4 18V6l8 8 8-8v12" fill="none" stroke="currentColor" strokeWidth="2.5" />,
  anvil: <path d="M3 8h18l-4 5H8zM9 13h6v6H9z" />,
  pinewood: <path d="m12 3 6 8h-3l5 7H4l5-7H6z" />,
  bluebird: <path d="M3 12c4-6 10-6 18 0-8 6-14 6-18 0z" />,
}

export const QUOTES: TestimonialWallQuote[] = [
  {
    id: 'priya',
    quote: 'The CLI is the first deploy tool my team didn’t immediately wrap in a Makefile. It does the boring parts the same way every time, which is all I ever wanted.',
    highlight: 'didn’t immediately wrap in a Makefile',
    author: { name: 'Priya Raman', role: 'Staff engineer', company: 'Vertex' },
    mark: MARKS.vertex,
    rating: 5,
    source: 'G2',
  },
  {
    id: 'theo',
    quote: 'Rollback is a pointer change. The first time we needed it in an incident, it was over before the pager stopped buzzing.',
    highlight: 'over before the pager stopped buzzing',
    author: { name: 'Theo Brandt', role: 'CTO', company: 'Arcadia' },
    mark: MARKS.arcadia,
    metric: { value: '−98%', label: 'time to recover' },
  },
  {
    id: 'jonas',
    quote: 'We launched on a Tuesday and hit the front page on Wednesday. Nothing fell over, and I didn’t have to think about why.',
    highlight: 'Nothing fell over',
    author: { name: 'Jonas Weiss', role: 'Founder', company: 'Tandem' },
    mark: MARKS.tandem,
    rating: 5,
    source: 'Capterra',
  },
  {
    id: 'kenji',
    quote: 'Comments pinned to a preview are the review tool I didn’t know we were missing. Our designers live in it now.',
    highlight: 'Our designers live in it now.',
    author: { name: 'Kenji Mori', role: 'Frontend lead', company: 'Mosaic' },
    mark: MARKS.mosaic,
    source: 'Email',
  },
  {
    id: 'amara',
    quote: 'Audit logs and SSO were a checkbox, not a project. Security signed off in a week.',
    highlight: 'Security signed off in a week.',
    author: { name: 'Amara Eze', role: 'Site reliability', company: 'Kestrel' },
    mark: MARKS.kestrel,
    rating: 5,
    source: 'G2',
  },
  {
    id: 'mara',
    quote: 'Design review happens on the real thing now, not on screenshots, and checkout got faster as a side effect.',
    highlight: 'on the real thing now',
    author: { name: 'Mara Okafor', role: 'Head of platform', company: 'Lumen' },
    mark: MARKS.lumen,
    metric: { value: '38%', label: 'faster checkout' },
  },
  {
    id: 'sofia',
    quote: 'Analytics split by deploy found a third-of-a-second regression we had blamed on the CDN for a month. It was ours.',
    highlight: 'It was ours.',
    author: { name: 'Sofia Lindqvist', role: 'Engineering manager', company: 'Helix' },
    mark: MARKS.helix,
    rating: 5,
    source: 'TrustRadius',
  },
  {
    id: 'lucas',
    quote: 'Moved forty services over a long weekend and nobody on call noticed. That is the highest praise an SRE can give.',
    highlight: 'nobody on call noticed',
    author: { name: 'Lucas Ferreira', role: 'Principal SRE', company: 'Orbital' },
    mark: MARKS.orbital,
    source: 'Forum',
  },
  {
    id: 'hana',
    quote: 'Every pull request gets a URL. Product reviews it on their phone on the train. We ship before lunch.',
    highlight: 'We ship before lunch.',
    author: { name: 'Hana Sato', role: 'Product engineer', company: 'Quanta' },
    mark: MARKS.quanta,
    rating: 5,
    source: 'G2',
  },
  {
    id: 'ines',
    quote: 'The bill matches the dashboard to the cent, and we get an email before any limit. I have never said that about a host.',
    highlight: 'matches the dashboard to the cent',
    author: { name: 'Ines Duarte', role: 'Finance lead', company: 'Fernhill' },
    mark: MARKS.fernhill,
    metric: { value: '31%', label: 'lower infra bill' },
  },
  {
    id: 'omar',
    quote: 'Our interns deploy on day one. Not because we’re brave, because it’s boring now.',
    highlight: 'because it’s boring now',
    author: { name: 'Omar Haddad', role: 'VP engineering', company: 'Parallel' },
    mark: MARKS.parallel,
    rating: 5,
    source: 'Capterra',
  },
  {
    id: 'elena',
    quote: 'Support answered a Sunday-night question with a fix and a pull request against our repo. In forty minutes.',
    highlight: 'In forty minutes.',
    author: { name: 'Elena Novak', role: 'Tech lead', company: 'Marlowe' },
    mark: MARKS.marlowe,
    source: 'Email',
  },
  {
    id: 'sam',
    quote: 'Edge config changes roll out in seconds and roll back just as fast. We stopped scheduling deploys around traffic.',
    highlight: 'We stopped scheduling deploys around traffic.',
    author: { name: 'Sam Whitaker', role: 'Platform engineer', company: 'Anvil' },
    mark: MARKS.anvil,
    rating: 4,
    source: 'G2',
  },
  {
    id: 'grace',
    quote: 'Preview environments with real data masking got us through a HIPAA review without a single exception.',
    highlight: 'without a single exception',
    author: { name: 'Grace Liu', role: 'Security engineer', company: 'Pinewood' },
    mark: MARKS.pinewood,
    metric: { value: '0', label: 'audit exceptions' },
  },
  {
    id: 'noah',
    quote: 'I expected to tune it for months. We changed two settings and our p95 halved.',
    highlight: 'our p95 halved',
    author: { name: 'Noah Kim', role: 'Performance engineer', company: 'Bluebird' },
    mark: MARKS.bluebird,
    rating: 5,
    source: 'TrustRadius',
  },
  {
    id: 'ava',
    quote: 'Twelve regions, one deploy, one button. Our status page has been boring for a year.',
    highlight: 'boring for a year',
    author: { name: 'Ava Thompson', role: 'Engineering director', company: 'Northstar' },
    mark: MARKS.northstar,
    source: 'Forum',
  },
]

export const RATING: TestimonialWallRating = {
  score: 4.8,
  count: 2314,
  sources: [
    { name: 'G2', score: 4.8 },
    { name: 'Capterra', score: 4.7 },
    { name: 'TrustRadius', score: 4.9 },
  ],
}

export const CTA: TestimonialWallCta = { label: 'Read all reviews', href: '#reviews' }

export const DEFAULT_COPY = {
  eyebrow: 'Wall of love',
  title: 'Teams don’t just use it. They tell people.',
  description: 'Unedited words from engineers, founders and the people who answer the pager.',
  /** The wall's name for assistive technology. */
  wallLabel: 'What customers say',
  /** "4.8 out of 5". */
  outOf: (score: string) => `${score} out of 5`,
  /** "from 2,314 reviews". */
  reviews: (count: string) => `from ${count} reviews`,
  sourcesLabel: 'Review sites',
  /** A quote's stars as read out: "Rated 5 out of 5". */
  rated: (stars: string) => `Rated ${stars} out of 5`,
  pause: 'Pause the wall',
  play: 'Play the wall',
  showAll: 'Show all',
  showFewer: 'Show fewer',
  empty: 'No reviews to show yet.',
  loading: 'Loading reviews',
}
export type TestimonialWallCopy = typeof DEFAULT_COPY
