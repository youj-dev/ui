'use client'

import { CalendarIcon, ChevronRightIcon, CreditCardIcon, ShieldAlertIcon, UsersIcon } from '@youj/icons'
import { ActionList, ActionListItem, Button } from '@youj/react'

export default function ActionListDemo() {
  return (
    <ActionList
      className="w-full max-w-xl rounded-2xl border border-line bg-surface p-5"
      title="Waiting on you"
      count={9}
      headingLevel={2}
      description="From the last 30 days of usage and billing, most urgent first."
      action={
        <Button variant="ghost" size="sm" className="text-fg-muted">
          View all <ChevronRightIcon size={14} className="rtl:-scale-x-100" />
        </Button>
      }
    >
      <ActionListItem
        key="cert"
        icon={<ShieldAlertIcon />}
        tone="danger"
        title="Signing certificate expires soon"
        detail="Webhooks stop verifying when it lapses."
        meta={
          <>
            <CalendarIcon /> Nov 2
          </>
        }
        action={
          <Button variant="secondary" size="sm">
            Rotate key
          </Button>
        }
      />
      <ActionListItem
        key="seats"
        icon={<UsersIcon />}
        tone="warning"
        title="Three seats over the plan"
        detail="Design added three editors; the plan includes 25."
        meta="+€87 / mo"
        action={
          <Button variant="secondary" size="sm">
            Review seats
          </Button>
        }
      />
      <ActionListItem
        key="card"
        icon={<CreditCardIcon />}
        tone="info"
        title="Card on file ends this month"
        detail="Update it before the October invoice."
        meta="Oct 28"
        action={
          <Button variant="secondary" size="sm">
            Update card
          </Button>
        }
      />
    </ActionList>
  )
}
