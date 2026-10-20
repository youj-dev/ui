'use client'

import { useMemo } from 'react'
import { CheckIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import type { ContactSalesCopy, ContactSalesRegion, ContactSalesValues } from './data'
import { Ticket } from './ticket'
import { dateTimeFormat } from '../../../lib/utils'

/* The confirmation: what was booked or sent, as a sentence the visitor can
 * trust (the time in full and who they'll meet), where the confirmation went,
 * and what happens next; Start over clears it. */

interface DoneProps {
  /** The step's heading level, one below the section's. */
  heading: 'h2' | 'h3' | 'h4'
  sent: ContactSalesValues
  region: ContactSalesRegion | undefined
  locale: string
  copy: ContactSalesCopy
  onAgain: () => void
}

export function Done({ heading: Heading, sent, region, locale, copy, onAgain }: DoneProps) {
  const when = useMemo(() => dateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }), [locale])
  const name = region?.contact.name ?? ''
  const call = sent.mode === 'call' && sent.slot
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        <p className="flex items-center gap-2 text-ui font-medium text-fg">
          <span aria-hidden className="grid size-6 place-items-center rounded-full bg-success-subtle text-success-text">
            <CheckIcon size={14} strokeWidth={2.5} trigger="mount" />
          </span>
          {call ? copy.doneTitleCall : copy.doneTitleMessage}
        </p>
        {call ? (
          <Ticket
            start={sent.slot!.start}
            title={
              <Heading data-yj-step-heading tabIndex={-1} className="rounded-sm text-ui font-semibold text-pretty text-fg outline-none focus-ring">
                {copy.doneCall(when.format(new Date(sent.slot!.start)), name)}
              </Heading>
            }
            locale={locale}
          />
        ) : (
          <Heading data-yj-step-heading tabIndex={-1} className="rounded-sm text-ui-lg font-semibold text-pretty text-fg outline-none focus-ring">
            {copy.doneMessage(name)}
          </Heading>
        )}
        <p className="text-ui text-fg-muted">{copy.doneSent(sent.email, sent.mode)}</p>
      </div>
      <div className="flex flex-col gap-3 border-t border-line pt-5">
        <p className="text-ui-sm font-medium text-fg">{copy.doneNext}</p>
        <ol className="flex flex-col gap-2.5">
          {copy.doneSteps.map((step, i) => (
            <li key={step} className="flex items-start gap-3 text-ui text-fg-muted">
              <span className="grid size-5 shrink-0 place-items-center rounded-full border border-line text-ui-xs font-medium text-fg tabular-nums">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
      <Button variant="outline" className="self-start" onClick={onAgain}>
        {copy.again}
      </Button>
    </div>
  )
}
