'use client'

import type { ElementType } from 'react'
import { MailIcon } from '@youj/icons'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Button, buttonVariants } from '../../../components/ui/button'
import { Sparkline } from '../../../components/ui/sparkline'
import { safeLink } from '../../../lib/safe-href'
import { DEFAULT_COPY, type Customer, type CustomersCopy } from './data'

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return ((words[0]?.[0] ?? '') + (words.length > 1 ? (words.at(-1)?.[0] ?? '') : '')).toUpperCase() || '?'
}

/** Under an open row: who to talk to, how usage is moving, and the account's vitals. */
export function CustomerDetail({
  customer,
  onEmail,
  onOpen,
  copy = DEFAULT_COPY,
  href: rawHref,
  linkComponent: Link = 'a',
}: {
  customer: Customer
  onEmail: (c: Customer) => void
  onOpen?: (c: Customer) => void
  copy?: CustomersCopy
  /** The account's page: View account becomes a link to it. */
  href?: string
  linkComponent?: ElementType
}) {
  const href = safeLink(rawHref)
  const last = Math.round(customer.usage[customer.usage.length - 1] ?? 0)
  const vitals: [string, string][] = [
    [copy.tickets, String(customer.tickets)],
    [copy.nps, String(customer.nps)],
    [copy.region, customer.region],
    [copy.seats, copy.seatsOf(customer.seats, customer.seatLimit)],
  ]
  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_minmax(0,1fr)]">
      <section aria-label={copy.contact} className="flex flex-col gap-3">
        <h4 className="text-ui-xs font-medium tracking-wide text-fg-muted uppercase">{copy.contact}</h4>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{initials(customer.contact.name)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-medium text-fg">{customer.contact.name}</span>
            <span className="truncate text-ui-sm text-fg-muted">
              {customer.contact.role} · {customer.contact.email}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onEmail(customer)}>
            <MailIcon size={14} /> {copy.email}
          </Button>
          {href ? (
            <Link href={href} className={buttonVariants({ variant: 'ghost', size: 'sm' })} onClick={() => onOpen?.(customer)}>
              {copy.viewAccount}
            </Link>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => onOpen?.(customer)}>
              {copy.viewAccount}
            </Button>
          )}
        </div>
      </section>
      <section aria-label={copy.usage} className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <h4 className="text-ui-xs font-medium tracking-wide text-fg-muted uppercase">{copy.usageHeading}</h4>
          <span className="font-mono text-ui-sm text-fg tabular-nums">{last}</span>
        </div>
        <Sparkline data={customer.usage} className="h-14" label={copy.usageLabel(customer.name)} />
      </section>
      <dl className="grid grid-cols-2 gap-3 self-start">
        {vitals.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-0.5">
            <dt className="text-ui-xs text-fg-muted">{label}</dt>
            <dd className="font-mono text-ui text-fg tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
