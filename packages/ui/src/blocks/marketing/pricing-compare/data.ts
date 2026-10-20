import type { MouseEventHandler } from 'react'

/** A call to action: always a link, rendered with `linkComponent`. */
export interface PricingCompareCta {
  label: string
  href: string
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

/** A plan's column in the comparison: its sticky header and its values. */
export interface PricingComparePlan {
  id: string
  name: string
  /** The price as shown, already formatted ("$19", "Custom"). */
  price: string
  /** What the price is per ("seat / mo"); left out for a custom price. */
  per?: string
  /** The call to action in the sticky header; none without it. */
  cta?: PricingCompareCta
}

/** A comparison cell: included (`true`), not included (`false`), or a value. */
export type PricingCompareCell = boolean | string

/** A feature row: one value per plan, in plan order, and an optional tooltip explaining it. */
export interface PricingCompareRow {
  feature: string
  tip?: string
  values: PricingCompareCell[]
}

/** A group of rows that folds away under its name. */
export interface PricingCompareGroup {
  name: string
  rows: PricingCompareRow[]
}

export const PLANS: PricingComparePlan[] = [
  { id: 'hobby', name: 'Hobby', price: '$0', per: 'forever', cta: { label: 'Start free', href: '#signup-hobby' } },
  { id: 'pro', name: 'Pro', price: '$19', per: 'seat / mo', cta: { label: 'Start a trial', href: '#signup-pro' } },
  { id: 'scale', name: 'Scale', price: '$79', per: 'seat / mo', cta: { label: 'Start a trial', href: '#signup-scale' } },
  { id: 'enterprise', name: 'Enterprise', price: 'Custom', cta: { label: 'Talk to sales', href: '#sales' } },
]
export const RECOMMENDED = 'pro'

export const GROUPS: PricingCompareGroup[] = [
  {
    name: 'Deploys',
    rows: [
      { feature: 'Preview deployments', tip: 'A live URL for every branch and pull request.', values: [true, true, true, true] },
      { feature: 'Concurrent builds', tip: 'Builds that run at once before the next one queues.', values: ['1', '4', '12', 'Custom'] },
      { feature: 'Build machines', tip: 'Dedicated machines keep your builds off shared queues.', values: ['Shared', 'Shared', 'Dedicated', 'Dedicated'] },
      { feature: 'Instant rollback', tip: 'Point production back at any earlier deploy, without a rebuild.', values: [false, true, true, true] },
      { feature: 'Deploy approvals', tip: 'Require a reviewer before a deploy reaches production.', values: [false, false, true, true] },
    ],
  },
  {
    name: 'Edge and performance',
    rows: [
      { feature: 'Regions', tip: 'Where your pages and functions run, close to your users.', values: ['38', '38', '38', '38 + private'] },
      { feature: 'Bandwidth', tip: 'Data served to visitors each month before overage.', values: ['100 GB', '1 TB / seat', '5 TB / seat', 'Custom'] },
      { feature: 'Image optimization', tip: 'Resized, modern-format images served from the edge.', values: [false, true, true, true] },
      { feature: 'Firewall rules', tip: 'Custom rules that block or challenge traffic at the edge.', values: ['3', '40', 'Unlimited', 'Unlimited'] },
    ],
  },
  {
    name: 'Collaboration',
    rows: [
      { feature: 'Team members', tip: 'People who can deploy. Reviewers are always free.', values: ['1', 'Up to 50', 'Unlimited', 'Unlimited'] },
      { feature: 'Preview comments', tip: 'Comments pinned to the pixels they’re about, on any preview.', values: [false, true, true, true] },
      { feature: 'Custom roles', tip: 'Decide exactly who can deploy, promote and change settings.', values: [false, false, true, true] },
    ],
  },
  {
    name: 'Security and compliance',
    rows: [
      { feature: 'SSO with SAML', tip: 'Sign in through Okta, Entra ID or any SAML provider.', values: [false, false, true, true] },
      { feature: 'SCIM provisioning', tip: 'People join and leave with your directory, automatically.', values: [false, false, true, true] },
      { feature: 'Audit logs', tip: 'Who changed what and when, exportable to your SIEM.', values: [false, '30 days', '1 year', 'Unlimited'] },
      { feature: 'SOC 2 Type II report', tip: 'Our latest audit report, under NDA.', values: [false, false, true, true] },
    ],
  },
  {
    name: 'Support',
    rows: [
      { feature: 'Uptime SLA', tip: 'Service credits if we miss it.', values: [false, '99.9%', '99.99%', '99.99%'] },
      { feature: 'Support', tip: 'How to reach us, and how fast we answer.', values: ['Community', 'Email, 1 day', 'Email, 4 hours', 'Named engineer'] },
    ],
  },
]

export const DEFAULT_COPY = {
  eyebrow: 'Compare plans',
  title: 'Every feature, every plan, side by side',
  description: 'The whole list, with nothing hidden behind “and more”. Hover or focus any feature to see what it means.',
  /** The note above the feature column in the sticky header; empty hides it. */
  priceNote: 'Prices billed yearly, per seat. Monthly billing costs 20% more.',
  recommended: 'Recommended',
  planPicker: 'Plan to compare',
  featureColumn: 'Feature',
  included: 'Included',
  notIncluded: 'Not included',
  about: (feature: string) => `About ${feature}`,
  ctaLabel: (cta: string, plan: string) => `${cta}, ${plan}`,
}

export type PricingCompareCopy = typeof DEFAULT_COPY
