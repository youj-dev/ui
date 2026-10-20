import type { MouseEventHandler } from 'react'

/** A cell: has it (`true`), partly (`'partial'`), doesn't (`false`), or a value to read. */
export type ComparisonCell = boolean | 'partial' | { text: string }

/** A product in the table: yours first, then the alternatives. */
export interface ComparisonProduct {
  id: string
  name: string
  /** One line under the name ("Managed edge platform"). */
  tagline?: string
  /** The price as shown ("From $19"). */
  price?: string
  cta?: { label: string; href: string; onClick?: MouseEventHandler<HTMLAnchorElement> }
}

/** A feature row: one cell per product, in product order, and an optional tooltip explaining it. */
export interface ComparisonRow {
  feature: string
  tip?: string
  values: ComparisonCell[]
}

/** A group of rows under a heading. */
export interface ComparisonGroup {
  name: string
  rows: ComparisonRow[]
}

export const PRODUCTS: ComparisonProduct[] = [
  { id: 'northwind', name: 'Northwind', tagline: 'Managed edge platform', price: 'From $19 / seat', cta: { label: 'Start free', href: '#signup' } },
  { id: 'cumulus', name: 'Cumulus', tagline: 'Cloud functions suite', price: 'From $25 / seat' },
  { id: 'relay', name: 'Relay', tagline: 'Static hosting', price: 'From $9 / site' },
  { id: 'diy', name: 'Self-hosted', tagline: 'Your own servers', price: 'Your ops time' },
]

export const GROUPS: ComparisonGroup[] = [
  {
    name: 'Deploys',
    rows: [
      { feature: 'Preview for every pull request', tip: 'A live URL, with the branch’s own data, for each pull request.', values: [true, true, true, 'partial'] },
      { feature: 'Instant rollback', tip: 'Point production back at any earlier deploy without a rebuild.', values: [true, 'partial', false, false] },
      { feature: 'Canary releases', tip: 'Send a slice of traffic to the new build and promote on the numbers.', values: [true, false, false, 'partial'] },
      { feature: 'Monorepo support', tip: 'One project per directory, builds only what changed.', values: [true, true, 'partial', 'partial'] },
    ],
  },
  {
    name: 'Performance',
    rows: [
      { feature: 'Edge regions', tip: 'Where pages and functions run, close to visitors.', values: [{ text: '38' }, { text: '14' }, { text: '3' }, { text: '1' }] },
      { feature: 'Function cold start', tip: 'Time from request to first instruction on an idle function.', values: [{ text: '< 5 ms' }, { text: '~60 ms' }, false, { text: '~250 ms' }] },
      { feature: 'Image optimization', tip: 'Resized, modern-format images served from the edge.', values: [true, true, 'partial', false] },
    ],
  },
  {
    name: 'Security and compliance',
    rows: [
      { feature: 'SSO with SAML', values: [true, true, false, 'partial'] },
      { feature: 'SOC 2 Type II', tip: 'An independent audit of controls over a period, not a point in time.', values: [true, true, true, false] },
      { feature: 'Audit logs', tip: 'Who changed what and when, exportable to your SIEM.', values: [true, 'partial', false, false] },
      { feature: 'Private networking', tip: 'Reach your own VPC without exposing it to the internet.', values: ['partial', true, false, true] },
    ],
  },
  {
    name: 'Support',
    rows: [
      { feature: 'Response time', tip: 'First reply on a business-critical ticket.', values: [{ text: '1 hour' }, { text: '4 hours' }, { text: '2 days' }, false] },
      { feature: 'Named engineer', values: [true, 'partial', false, false] },
    ],
  },
]

export const DEFAULT_COPY = {
  eyebrow: 'Compare',
  title: 'How Northwind stacks up',
  description: 'Feature by feature against the tools teams usually weigh us against. Hover or focus any feature to see what it means.',
  /** The note above the feature column. */
  verified: 'Checked September 2026 against public documentation.',
  /** The link after the note; empty hides it. */
  correct: 'Spot a mistake? Tell us.',
  featureColumn: 'Feature',
  /** The switch that hides rows every product agrees on. */
  differencesOnly: 'Only show differences',
  /** The coverage line under a product: "27 of 30 features". */
  coverage: (have: number, total: number) => `${have} of ${total} features`,
  coverageLabel: 'Coverage',
  ours: 'Ours',
  included: 'Included',
  partial: 'Partly',
  notIncluded: 'Not included',
  about: (feature: string) => `About ${feature}`,
  /** Names the phone picker that chooses the alternative shown beside ours. */
  picker: 'Compare Northwind with',
  /** Shown when "differences only" leaves nothing. */
  noDifferences: 'Every product does the same on these features.',
  /** A call to action's accessible name: "Start free, Northwind". */
  ctaLabel: (cta: string, product: string) => `${cta}, ${product}`,
}
export type ProductComparisonCopy = typeof DEFAULT_COPY
