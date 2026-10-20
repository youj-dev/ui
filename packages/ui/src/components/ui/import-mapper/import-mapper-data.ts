import type { importMapperLabels } from '@youj/core/labels'
import type { ImportField } from './import-mapper-model'
import { numberFormat } from '../../../lib/utils'

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
/** Stands in for an action the app hasn't wired (`action` is "ImportMapper: onVerb"): warns once in development, then waits like a request. */
export function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  return wait(ms)
}

/** The component's strings: the dictionary's `importMapper…` keys, so a locale pack translates them. */
export type ImportMapperCopy = typeof importMapperLabels

/** "48 KB", in the locale. */
export function formatBytes(bytes: number, locale: string) {
  const [value, unit] = bytes >= 1024 * 1024 ? [bytes / 1024 / 1024, 'megabyte'] : bytes >= 1024 ? [bytes / 1024, 'kilobyte'] : [bytes, 'byte']
  return numberFormat(locale, { style: 'unit', unit, unitDisplay: 'narrow', maximumFractionDigits: 1 }).format(value)
}

/* ── Demo data ─────────────────────────────────────────────────────────────
 * A CRM's contacts: six fields, a sample file whose headers are named
 * differently from them (so the matching has work to do), and a few emails
 * that already exist. Demo content — edit after adding. */

export const DEFAULT_FIELDS: ImportField[] = [
  { id: 'name', label: 'Name', type: 'text', required: true, synonyms: ['full name', 'contact', 'customer'] },
  { id: 'email', label: 'Email', type: 'email', required: true, synonyms: ['e-mail', 'email address', 'mail'] },
  { id: 'phone', label: 'Phone', type: 'text', synonyms: ['mobile', 'telephone', 'tel'] },
  { id: 'company', label: 'Company', type: 'text', synonyms: ['organisation', 'organization', 'account', 'employer'] },
  { id: 'value', label: 'Deal value', type: 'number', synonyms: ['amount', 'deal amount', 'revenue', 'arr'] },
  { id: 'since', label: 'Customer since', type: 'date', synonyms: ['created', 'signup date', 'joined', 'created at'] },
]

const FIRST = ['Ada', 'Grace', 'Linus', 'Margaret', 'Alan', 'Katherine', 'Dennis', 'Barbara', 'Tim', 'Radia', 'Ken', 'Frances']
const LAST = ['Okafor', 'Lindqvist', 'Moreau', 'Tanaka', 'Haddad', 'Brandt', 'Silva', 'Novak', 'Ortiz', 'Kowalski', 'Varga', 'Reyes', 'Ishikawa']
const COMPANY = [
  'Northgate Labs',
  'Cobalt Freight',
  'Hart, Lane & Co',
  'Fernway Health',
  'Lantern Retail',
  'Harbor & Pine',
  'Quarry Systems',
  'Orchard Studio',
]
const DOMAIN = [
  'northgate.example',
  'cobalt.example',
  'hartlane.example',
  'fernway.example',
  'lantern.example',
  'harborpine.example',
  'quarry.example',
  'orchard.example',
]
const NOTES = ['', 'Met at the spring summit', 'Prefers "async" updates', '', 'Renewal in Q3', '']

const person = (i: number) => {
  const first = FIRST[i % 12]!
  const last = LAST[i % 13]!
  return { name: `${first} ${last}`, email: `${first}.${last}@${DOMAIN[i % 8]}`.toLowerCase() }
}

const quote = (value: string) => (/[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value)

/** The sample file: 48 contacts with four wrong values, one email repeated inside the file and three that already exist. */
export const SAMPLE_CSV = (() => {
  const lines = ['Full Name,E-mail,Mobile,Organisation,Deal Amount,Created,Notes']
  for (let i = 0; i < 48; i++) {
    let { name, email } = person(i)
    let amount = String(1200 + ((i * 733) % 9000))
    let created = `202${4 + (i % 3)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 27) + 1).padStart(2, '0')}`
    if (i === 6) email = 'sam.ortiz@'
    if (i === 14) name = ''
    if (i === 22) amount = '12k'
    if (i === 30) created = '31/02/2026'
    if (i === 41) email = person(12).email.toUpperCase()
    const phone = `+1 555 01${String(10 + i).padStart(2, '0')}`
    lines.push([name, email, phone, COMPANY[i % 8]!, amount, created, NOTES[i % 6]!].map(quote).join(','))
  }
  return lines.join('\n') + '\n'
})()

/** Emails the demo "already has", so the duplicate policy has something to decide. */
export const DEMO_EXISTING = [3, 8, 19].map((i) => person(i).email)

export const SAMPLE_NAME = 'contacts-sample.csv'

