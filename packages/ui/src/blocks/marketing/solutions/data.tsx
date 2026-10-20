import type { MouseEventHandler, ReactNode } from 'react'
import { CodeIcon, PaletteIcon, TargetIcon } from '@youj/icons'

/** A number in the role's live panel, and its value in each industry. */
export interface SolutionsStat {
  label: string
  /** The value by industry id. An industry without one shows a dash. */
  values: Record<string, { value: number; format?: Intl.NumberFormatOptions; suffix?: string }>
}

/** A role: a tab, its pitch and its panel. */
export interface SolutionsRole {
  id: string
  /** The tab's label ("Engineers"). */
  label: string
  /** A 16px glyph for the tab. */
  icon?: ReactNode
  headline: string
  description: string
  /** What the role gets, as short phrases. */
  points: string[]
  /** Up to three numbers for the panel. */
  stats: SolutionsStat[]
  /** What just happened, for the panel's feed, by industry id. */
  feed: Record<string, string[]>
  cta?: { href: string; onClick?: MouseEventHandler<HTMLAnchorElement> }
}

/** An industry: a segment of the switch and what is said in its voice. */
export interface SolutionsIndustry {
  id: string
  label: string
  /** A customer quote that follows the industry, whatever the role. */
  quote: { text: string; name: string; role: string }
}

export const ROLES: SolutionsRole[] = [
  {
    id: 'engineering',
    label: 'Engineers',
    icon: <CodeIcon size={16} />,
    headline: 'Ship without the Friday dread',
    description: 'Every push is previewed, every deploy can be undone in a second, and every metric is split by the deploy that moved it.',
    points: ['A preview URL on every pull request', 'Instant rollback, no rebuild', 'Traces and vitals tagged with the deploy'],
    stats: [
      { label: 'Deploys a day', values: { commerce: { value: 24 }, fintech: { value: 9 }, media: { value: 31 } } },
      { label: 'Median rollback', values: { commerce: { value: 0.8, format: { maximumFractionDigits: 1 }, suffix: ' s' }, fintech: { value: 1.1, format: { maximumFractionDigits: 1 }, suffix: ' s' }, media: { value: 0.7, format: { maximumFractionDigits: 1 }, suffix: ' s' } } },
      { label: 'Change failure rate', values: { commerce: { value: 2.1, format: { maximumFractionDigits: 1 }, suffix: '%' }, fintech: { value: 0.9, format: { maximumFractionDigits: 1 }, suffix: '%' }, media: { value: 3.4, format: { maximumFractionDigits: 1 }, suffix: '%' } } },
    ],
    feed: {
      commerce: ['Checkout promoted to 100% after a clean canary', 'Cart service rolled back in 0.8 s', 'Preview ready for “Add Klarna” (PR 482)'],
      fintech: ['Ledger service rolled back in 1.1 s', 'Audit log exported to the SIEM', 'Production deploy approved by two reviewers'],
      media: ['Homepage cache purged in 38 regions', 'Live-blog function scaled to 4,000 requests a second', 'Preview ready for “Election night” (PR 91)'],
    },
    cta: { href: '#solutions-engineering' },
  },
  {
    id: 'design',
    label: 'Designers',
    icon: <PaletteIcon size={16} />,
    headline: 'Review the real thing, not a screenshot',
    description: 'Comments pinned to the pixels, on a live preview, with visual diffs against production, so feedback lands where the work is.',
    points: ['Comment on any preview, no login needed', 'Visual diffs on every pull request', 'Approve a design in the page it lives on'],
    stats: [
      { label: 'Review rounds', values: { commerce: { value: 1.6, format: { maximumFractionDigits: 1 } }, fintech: { value: 2.2, format: { maximumFractionDigits: 1 } }, media: { value: 1.3, format: { maximumFractionDigits: 1 } } } },
      { label: 'Hours to approval', values: { commerce: { value: 6 }, fintech: { value: 14 }, media: { value: 3 } } },
      { label: 'Visual bugs caught', values: { commerce: { value: 38, suffix: '%' }, fintech: { value: 52, suffix: '%' }, media: { value: 41, suffix: '%' } } },
    ],
    feed: {
      commerce: ['Mara pinned a comment on the product card', 'Visual diff: 3 changes on /checkout', 'Design approved on the live preview'],
      fintech: ['Priya flagged contrast on the statements table', 'Visual diff: 1 change on /transfer', 'Compliance sign-off attached to the preview'],
      media: ['Kenji pinned a comment on the article header', 'Visual diff: 7 changes on /live', 'Typography approved on the live preview'],
    },
    cta: { href: '#solutions-design' },
  },
  {
    id: 'product',
    label: 'Product managers',
    icon: <TargetIcon size={16} />,
    headline: 'Know what shipped, and what it did',
    description: 'A release feed anyone can read, flags and canaries that let you test in production, and numbers per release instead of per quarter.',
    points: ['A plain-language release feed', 'Roll out behind a flag, promote on the numbers', 'Conversion and vitals per release'],
    stats: [
      { label: 'Releases a week', values: { commerce: { value: 18 }, fintech: { value: 6 }, media: { value: 25 } } },
      { label: 'Days to first value', values: { commerce: { value: 3 }, fintech: { value: 9 }, media: { value: 2 } } },
      { label: 'Experiments live', values: { commerce: { value: 12 }, fintech: { value: 4 }, media: { value: 17 } } },
    ],
    feed: {
      commerce: ['One-tap checkout is live for 25% of visitors', 'Experiment “Free shipping bar” reached significance', 'Release notes sent to support'],
      fintech: ['Instant transfers are live for business accounts', 'Experiment “Simplified KYC” reached significance', 'Release notes sent to compliance'],
      media: ['The new newsletter signup is live for 50% of readers', 'Experiment “Sticky headline” reached significance', 'Release notes sent to the newsroom'],
    },
    cta: { href: '#solutions-product' },
  },
]

export const INDUSTRIES: SolutionsIndustry[] = [
  { id: 'commerce', label: 'Commerce', quote: { text: 'Sale day used to mean a freeze. Now it is a Tuesday.', name: 'Mara Okafor', role: 'Head of Platform, Lumen' } },
  { id: 'fintech', label: 'Fintech', quote: { text: 'Audit logs and approvals were a setting, not a project. Compliance signed off in a week.', name: 'Theo Brandt', role: 'CTO, Northstar' } },
  { id: 'media', label: 'Media', quote: { text: 'We shipped through election night without a single page. Nothing fell over.', name: 'Kenji Mori', role: 'Frontend Lead, Mosaic' } },
]

export const DEFAULT_COPY = {
  eyebrow: 'Solutions',
  title: 'Built for the way your team works',
  description: 'Pick who you are and what you build. The pitch, the numbers and the activity all change to match.',
  roleLabel: 'Who are you?',
  industryLabel: 'What do you build?',
  /** The call to action's text: "See how Commerce engineers ship". */
  cta: (role: string, industry: string) => `See how ${industry} ${role.toLowerCase()} do it`,
  /** The panel's title: "Engineers in Commerce". */
  panel: (role: string, industry: string) => `${role} in ${industry}`,
  feedLabel: 'Recent activity',
  statsLabel: 'Key numbers',
  noValue: '–',
  /** Announced when the selection changes. */
  showing: (role: string, industry: string) => `Showing ${role} in ${industry}`,
}
export type SolutionsCopy = typeof DEFAULT_COPY
