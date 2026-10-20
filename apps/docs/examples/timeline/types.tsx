'use client'

import { CreditCardIcon, UserPlusIcon } from '@youj/icons'
import { Badge, Timeline, type TimelineEvent, type TimelineEventType } from '@youj/react'

/* Your own event types sit beside the built-in ones (commit, comment, deploy,
 * alert, merge, pull-request). Each names an icon, a tone and a spoken label. */
const TYPES: Record<string, TimelineEventType> = {
  invoice: { icon: CreditCardIcon, tone: 'success', label: 'Invoice' },
  member: { icon: UserPlusIcon, tone: 'accent', label: 'New member' },
}

const hoursAgo = (n: number) => new Date(Date.now() - n * 3_600_000)

const EVENTS: TimelineEvent[] = [
  { id: 'b1', type: 'invoice', title: 'Invoice INV-0192 paid, $1,240.00', time: hoursAgo(0.3), meta: <Badge variant="success">Paid</Badge> },
  { id: 'b2', type: 'member', actor: { name: 'Lena Fischer' }, title: 'joined the Billing team', time: hoursAgo(1.5) },
  { id: 'b3', type: 'comment', actor: { name: 'Omar Haddad' }, title: 'left a note on the Q3 renewal', time: hoursAgo(3) },
]

export default function TimelineTypes() {
  return (
    <div className="w-full max-w-md rounded-xl border border-line bg-surface p-4">
      <Timeline events={EVENTS} types={TYPES} locale="en-US" />
    </div>
  )
}
