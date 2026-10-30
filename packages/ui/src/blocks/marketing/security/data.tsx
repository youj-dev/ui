import type { ReactNode } from 'react'
import { EyeIcon, FingerprintIcon, KeyIcon, LockIcon, ServerIcon, ShieldCheckIcon } from '@youj/icons'
import type { UptimeDay } from '../../../components/ui/history-strip'

/** A certification or attestation. */
export interface SecurityCertification {
  id: string
  /** "SOC 2 Type II". */
  name: string
  /** What it covers, in a line. */
  scope: string
  status: 'certified' | 'in-progress'
  /** Who audited it. */
  issuer?: string
  /** When it needs renewing, a timestamp in milliseconds; shown as "Valid through …". */
  validThrough?: number
  /** Whether the report can be asked for. Default: only when certified. */
  requestable?: boolean
  /** A glyph drawn in a 24×24 viewBox (the children of an `<svg>`); without it, the name's initials. */
  mark?: ReactNode
}

/** A region data can live in. */
export interface SecurityRegion {
  id: string
  /** The picker's label ("United States"). */
  label: string
  /** Where, specifically ("Virginia and Oregon"). */
  location: string
  lon: number
  lat: number
  /** What stays in the region. */
  stays: string[]
  /** What is processed outside it, and why. */
  global?: string[]
}

/** A policy or document. */
export interface SecurityPolicy {
  id: string
  title: string
  description: string
  /** When it was last updated, a timestamp in milliseconds. */
  updated: number
  /** "PDF", "Page"… */
  kind: string
  href: string
}

/** One practice, as a tile. */
export interface SecurityPractice {
  title: string
  description: string
  icon?: ReactNode
}

/** The live status. */
export interface SecurityStatus {
  state: 'operational' | 'degraded' | 'outage'
  /** When it was last checked, a timestamp in milliseconds. */
  checkedAt: number
  /** The uptime over the strip's period, 0 to 1. */
  uptime: number
  /** The status page. */
  href: string
  /** Daily uptime, oldest first, for the strip. */
  days?: UptimeDay[]
}

export const NOW = Date.UTC(2026, 8, 29, 9, 0)
const day = (offset: number) => new Date(NOW - offset * 86_400_000).toISOString().slice(0, 10)

export const STATUS: SecurityStatus = {
  state: 'operational',
  checkedAt: NOW - 2 * 60_000,
  uptime: 0.9999,
  href: '#status',
  days: Array.from({ length: 90 }, (_, i) => ({ date: day(89 - i), uptime: i === 31 ? 0.998 : i === 62 ? 0.9985 : 1, note: i === 31 ? 'Elevated errors in one region, 3 minutes' : i === 62 ? 'Delayed builds, 2 minutes' : undefined })),
}

export const CERTIFICATIONS: SecurityCertification[] = [
  { id: 'soc2', name: 'SOC 2 Type II', scope: 'Security, availability and confidentiality, audited over 12 months.', status: 'certified', issuer: 'Schellman', validThrough: Date.UTC(2027, 2, 31), mark: <path d="M12 3 4 6v6c0 4.5 3.2 7.8 8 9 4.8-1.2 8-4.5 8-9V6z" /> },
  { id: 'iso27001', name: 'ISO 27001', scope: 'Our information security management system, certified across all locations.', status: 'certified', issuer: 'BSI', validThrough: Date.UTC(2028, 0, 15), mark: <circle cx="12" cy="12" r="8" /> },
  { id: 'gdpr', name: 'GDPR', scope: 'A data processing agreement, EU data residency and a named data protection officer.', status: 'certified', mark: <path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.2 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z" /> },
  { id: 'hipaa', name: 'HIPAA', scope: 'A business associate agreement for covered entities on the Scale plan.', status: 'certified', mark: <path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z" /> },
  { id: 'pci', name: 'PCI DSS', scope: 'Level 1 service provider, for teams that handle card data on Northwind.', status: 'in-progress', issuer: 'Expected Q1 2027', requestable: false, mark: <rect x="3" y="6" width="18" height="12" rx="2" /> },
  { id: 'fedramp', name: 'FedRAMP Moderate', scope: 'Authorization for US federal workloads.', status: 'in-progress', issuer: 'In readiness assessment', requestable: false, mark: <path d="M4 20V10l8-6 8 6v10z" /> },
]

export const REGIONS: SecurityRegion[] = [
  { id: 'us', label: 'United States', location: 'Virginia and Oregon', lon: -77, lat: 38, stays: ['Source code and build artifacts', 'Customer databases and backups', 'Request logs and traces'], global: ['Edge cache of public pages, which only holds what you already publish'] },
  { id: 'eu', label: 'European Union', location: 'Frankfurt and Dublin', lon: 8.7, lat: 50.1, stays: ['Source code and build artifacts', 'Customer databases and backups', 'Request logs and traces', 'Support access, by EU staff only'], global: ['Edge cache of public pages, which only holds what you already publish'] },
  { id: 'apac', label: 'Asia Pacific', location: 'Tokyo and Sydney', lon: 139.7, lat: 35.7, stays: ['Source code and build artifacts', 'Customer databases and backups'], global: ['Request logs and traces, for 30 days, to our US region', 'Support access, from our follow-the-sun team'] },
]

export const POLICIES: SecurityPolicy[] = [
  { id: 'whitepaper', title: 'Security whitepaper', description: 'Architecture, encryption, access control and incident response in 18 pages.', updated: Date.UTC(2026, 7, 12), kind: 'PDF', href: '#whitepaper' },
  { id: 'dpa', title: 'Data processing agreement', description: 'The standard terms, with the EU standard contractual clauses attached. Countersign online.', updated: Date.UTC(2026, 5, 3), kind: 'PDF', href: '#dpa' },
  { id: 'subprocessors', title: 'Subprocessors', description: 'Every company that touches customer data on our behalf, what for, and where.', updated: Date.UTC(2026, 8, 1), kind: 'Page', href: '#subprocessors' },
  { id: 'pentest', title: 'Penetration test summary', description: 'The latest independent test: scope, findings by severity and what we fixed.', updated: Date.UTC(2026, 6, 20), kind: 'PDF', href: '#pentest' },
  { id: 'vdp', title: 'Vulnerability disclosure policy', description: 'How to report an issue, what we promise in return, and our safe harbor.', updated: Date.UTC(2026, 0, 9), kind: 'Page', href: '#disclosure' },
]

export const PRACTICES: SecurityPractice[] = [
  { title: 'Encrypted everywhere', description: 'TLS 1.3 in transit, AES-256 at rest, keys rotated every 90 days.', icon: <LockIcon size={18} /> },
  { title: 'Least privilege', description: 'Production access is just-in-time, approved by a second person and logged.', icon: <KeyIcon size={18} /> },
  { title: 'SSO and SCIM', description: 'Sign in with your identity provider; people leave when your directory says so.', icon: <FingerprintIcon size={18} /> },
  { title: 'Audit logs', description: 'Every change, who made it and from where, exportable to your SIEM.', icon: <EyeIcon size={18} /> },
  { title: 'Isolated builds', description: 'Each build runs in its own sandbox that is destroyed when it finishes.', icon: <ServerIcon size={18} /> },
  { title: 'Tested continuously', description: 'Annual penetration tests, a bug bounty and automated scanning on every commit.', icon: <ShieldCheckIcon size={18} /> },
]

export const DEFAULT_COPY = {
  eyebrow: 'Security and trust',
  title: 'Your data, your region, your auditors’ questions answered',
  description: 'Everything a security review asks for, in one place and kept current: certifications, where data lives, policies and live status.',
  /** The status headline by state. */
  state: { operational: 'All systems operational', degraded: 'Some systems degraded', outage: 'Service disruption' },
  /** "99.99% uptime over the last 90 days". */
  uptime: (percent: string, days: number) => `${percent} uptime over the last ${days} days`,
  /** "Checked 2 minutes ago". */
  checked: (ago: string) => `Checked ${ago}`,
  statusPage: 'View the status page',
  statusStrip: 'Daily uptime',
  certifications: 'Certifications',
  certified: 'Certified',
  inProgress: 'In progress',
  /** "Valid through Mar 2027". */
  validThrough: (date: string) => `Valid through ${date}`,
  /** "Audited by Schellman". */
  auditedBy: (issuer: string) => `Audited by ${issuer}`,
  requestReport: 'Request the report',
  requesting: 'Requesting…',
  requested: 'Requested',
  /** A request button's accessible name: "Request the report, SOC 2 Type II". */
  requestLabel: (name: string) => `Request the report, ${name}`,
  residency: 'Data residency',
  residencyDescription: 'Choose where your data lives. It stays there, and the list says exactly what that includes.',
  regionLabel: 'Region',
  /** "Stays in Frankfurt and Dublin". */
  staysIn: (location: string) => `Stays in ${location}`,
  processedElsewhere: 'Processed outside the region',
  mapLabel: 'Data center regions',
  practices: 'How we protect it',
  policies: 'Policies and documents',
  /** "Updated Sep 12, 2026". */
  updated: (date: string) => `Updated ${date}`,
  failed: 'That didn’t send. Try again.',
}
export type MarketingSecurityCopy = typeof DEFAULT_COPY
