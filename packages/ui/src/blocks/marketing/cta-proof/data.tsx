import type { MouseEventHandler, ReactNode } from 'react'
import { cn } from '../../../lib/utils'

/** A call to action, rendered as a link through `linkComponent`. */
export interface CtaProofCta {
  label: string
  href: string
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

export const PRIMARY_CTA: CtaProofCta = { label: 'Start free', href: '#signup' }
export const SECONDARY_CTA: CtaProofCta = { label: 'Talk to sales', href: '#sales' }

const MARKS: Record<string, ReactNode> = {
  arcadia: <path d="M4 19 12 5l8 14z" />,
  lumen: <circle cx="12" cy="12" r="7" />,
  vertex: <path d="M4 5h16l-8 14z" />,
  tandem: (
    <>
      <circle cx="8" cy="12" r="5" />
      <circle cx="16" cy="12" r="5" opacity={0.5} />
    </>
  ),
  helix: <path d="M5 4h4v16H5zM15 4h4v16h-4zM9 10h6v4H9z" />,
  mosaic: <path d="M4 4h7v7H4zM13 13h7v7h-7zM13 4h7v7h-7z" />,
  quanta: <rect x="4" y="4" width="16" height="16" rx="4" />,
  orbital: (
    <>
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
    </>
  ),
}

/** A customer's mark: its `logo`, or the demo's drawn mark for its id. */
export function Mark({ id, logo, className }: { id: string; logo?: ReactNode; className?: string }) {
  if (logo) return <span aria-hidden className={cn('inline-flex size-4 shrink-0 [&>*]:size-full', className)}>{logo}</span>
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn('size-4 shrink-0 fill-current', className)}>
      {MARKS[id]}
    </svg>
  )
}

/** A line of the ledger, and the person quoted for it. */
export interface CtaProofCustomer {
  id: string
  company: string
  /** Its logo, about 16px, drawn in `currentColor`. Default: the demo's mark for the id, if any. */
  logo?: ReactNode
  measure: string
  before: string
  after: string
  /** The change: a share (−0.98) or a multiple (14). */
  change: { value: number; kind: 'share' | 'times' }
  quote: string
  name: string
  role: string
}

/** A further customer named under the ledger. */
export interface CtaProofLogo {
  id: string
  name: string
  logo?: ReactNode
}

export const CUSTOMERS: CtaProofCustomer[] = [
  {
    id: 'arcadia',
    company: 'Arcadia',
    measure: 'Incident recovery',
    before: '42 min',
    after: '48 s',
    change: { value: -0.98, kind: 'share' },
    quote: 'Rollback is a pointer change. The first time we needed it in an incident, it was over before the pager stopped buzzing.',
    name: 'Theo Brandt',
    role: 'CTO, Arcadia',
  },
  {
    id: 'lumen',
    company: 'Lumen',
    measure: 'Time to a preview',
    before: '18 min',
    after: '41 s',
    change: { value: -0.96, kind: 'share' },
    quote: 'Design review happens on the real thing now. Every pull request has a link, and the comments sit on the pixels they’re about.',
    name: 'Mara Okafor',
    role: 'Head of Platform, Lumen',
  },
  {
    id: 'vertex',
    company: 'Vertex',
    measure: 'Monthly infra bill',
    before: '$84,200',
    after: '$57,900',
    change: { value: -0.31, kind: 'share' },
    quote: 'Our traffic doubled the same quarter our bill went down. I didn’t think both of those could be true.',
    name: 'Priya Raman',
    role: 'Staff Engineer, Vertex',
  },
  {
    id: 'tandem',
    company: 'Tandem',
    measure: 'Deploys per day',
    before: '6',
    after: '84',
    change: { value: 14, kind: 'times' },
    quote: 'The CLI is the first deploy tool my team didn’t wrap in a Makefile.',
    name: 'Jonas Ek',
    role: 'Engineering Manager, Tandem',
  },
]

export const MORE: CtaProofLogo[] = [
  { id: 'helix', name: 'Helix' },
  { id: 'mosaic', name: 'Mosaic' },
  { id: 'quanta', name: 'Quanta' },
  { id: 'orbital', name: 'Orbital' },
]

export const DEFAULT_COPY = {
  eyebrow: 'Customers',
  title: 'Every team here started with one deploy',
  description: 'Figures from each team’s own dashboards, a quarter after they moved. Your first deploy is free.',
  /** Names the ledger for assistive tech. */
  linesLabel: 'Measured a quarter after moving',
  columns: ['Customer', 'Measure', 'Before', 'After', 'Change'],
  /** Read before a line's "before" figure. */
  from: ', from ',
  /** Read before a line's "after" figure. */
  to: ' to ',
  readerName: 'Your team',
  readerMeasure: 'First deploy',
  readerQualifier: 'median',
  readerAfter: '58 s',
  /** The count of further teams, set in figures. */
  moreCount: '41,204',
  moreBefore: 'And',
  moreAfter: 'more teams, including',
}

export type CtaProofCopy = typeof DEFAULT_COPY
