'use client'

import { ArchiveIcon, ArrowUpRightIcon, MailIcon, TagIcon, UserPlusIcon } from '@youj/icons'
import { createDataGridColumns, type DataGridRowAction, type DataGridStatusOptions } from '../../tables/data-grid'
import { DEFAULT_COPY, HEALTH, RENEWAL, TAGS, type Customer, type CustomersCopy } from './data'

const col = createDataGridColumns<Customer>()

/** A status map with the copy's labels over the demo's tones. */
function labelled<T extends Record<string, { label: string; tone: string }>>(tones: T, labels: Record<keyof T, string>): T {
  return Object.fromEntries(Object.entries(tones).map(([key, value]) => [key, { ...value, label: labels[key as keyof T] }])) as T
}

/** Every column the page can show; the Columns menu brings back the ones it starts without. */
export function customerColumns(
  onAutoRenew: (customer: Customer, value: boolean) => void,
  copy: CustomersCopy = DEFAULT_COPY,
  tags: Record<string, { label: string }> = TAGS,
  currency = 'USD',
  healths: DataGridStatusOptions = labelled(HEALTH, copy.health),
  renewals: DataGridStatusOptions = labelled(RENEWAL, copy.renewal),
) {
  const h = copy.columns
  return [
    col.identity('name', { header: h.name, shape: 'square', secondary: (c) => c.domain, size: 232 }),
    col.status('health', { header: h.health, options: healths, size: 132 }),
    col.text('plan', { header: h.plan, groupable: true, facet: true, size: 108 }),
    col.currency('mrr', { header: h.mrr, currency, unit: copy.perMonth, size: 124 }),
    col.meter('seats', { header: h.seats, max: (c) => c.seatLimit, size: 152 }),
    col.trend('usage', { header: h.usage, size: 164 }),
    col.people('owners', { header: h.owners, size: 112 }),
    col.tags('tags', { header: h.tags, options: tags, size: 200, minSize: 170, meta: { grow: true } }),
    col.date('renewsAt', { header: h.renewsAt, size: 124 }),
    col.status('renewal', { header: h.renewal, options: renewals, size: 144 }),
    col.boolean('autoRenew', { header: h.autoRenew, onToggle: onAutoRenew, size: 112 }),
    col.date('lastSeen', { header: h.lastSeen, size: 124 }),
    col.id('id', { header: h.id, size: 140 }),
    col.link('domain', { header: h.domain, href: (c) => `https://${c.domain}`, size: 188 }),
    col.text('region', { header: h.region, groupable: true, facet: true, size: 140 }),
  ]
}

/** The columns a first visit shows, few enough to fit a frame's page at 1440 without scrolling; the rest wait in the Columns menu. */
export const HIDDEN = { seats: false, owners: false, plan: false, renewal: false, autoRenew: false, lastSeen: false, id: false, domain: false, region: false, renewsAt: false }

export function customerActions(
  handlers: {
    email: (c: Customer) => void
    open: (c: Customer) => void
    assign: (c: Customer) => void
    tag: (c: Customer) => void
    archive: (c: Customer) => void
  },
  labels: CustomersCopy['actions'] = DEFAULT_COPY.actions,
): (c: Customer) => DataGridRowAction<Customer>[] {
  return () => [
    { label: labels.email, icon: MailIcon, inline: true, onSelect: handlers.email },
    { label: labels.open, icon: ArrowUpRightIcon, inline: true, onSelect: handlers.open },
    { label: labels.assign, icon: UserPlusIcon, onSelect: handlers.assign },
    { label: labels.tag, icon: TagIcon, onSelect: handlers.tag },
    { label: labels.archive, icon: ArchiveIcon, destructive: true, separated: true, onSelect: handlers.archive },
  ]
}
