import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import {
  ArrowUpRightIcon,
  CalendarIcon,
  ChevronRightIcon,
  CreditCardIcon,
  KeyIcon,
  ShieldAlertIcon,
  TimerIcon,
  UserPlusIcon,
  UsersIcon,
  WebhookIcon,
} from '@youj/icons'
import { ActionList, ActionListItem, type ActionListProps } from './action-list'
import { Button } from './button'

const meta: Meta<ActionListProps> = {
  title: 'UI/Data/Action List',
  component: ActionList,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Things to act on, one per row: an icon tile in the row’s `tone`, a title and one line of `detail`, an optional `meta` chip (the date, amount or state that makes it urgent, in `metaTone`) and the row’s own `action`. The header names the list (`title`, `description`), counts it (`count`, which can be more than the rows shown) and holds a “view all” `action`. `emphasis` sets one row apart as the one to do first. Rows are a PresenceList: a row the app removes fades out and the rest close the gap. Below 20rem of its own width the chip and action wrap under the text. Reduced motion: rows come and go at once.',
      },
    },
  },
}
export default meta
type Story = StoryObj<ActionListProps>

const panel = 'w-[min(40rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-5'

const viewAll = (
  <Button variant="ghost" size="sm" className="text-fg-muted">
    All 9 <ChevronRightIcon size={14} className="rtl:-scale-x-100" />
  </Button>
)

/** A workspace's open problems, most urgent first: each row says why and offers the one fix. */
export const ReviewQueue: Story = {
  name: 'Review queue',
  render: () => <Queue className={panel} />,
}

function Queue({ className }: { className: string }) {
  return (
    <ActionList className={className} title="Waiting on you" count={4} description="From the last 30 days of usage and billing, most urgent first." action={viewAll}>
      <ActionListItem
        key="cert"
        icon={<ShieldAlertIcon />}
        tone="danger"
        title="Signing certificate expires soon"
        detail="api.northwind.dev stops verifying webhooks when it lapses."
        meta={
          <>
            <CalendarIcon /> Nov 2
          </>
        }
        action={
          <Button variant="secondary" size="sm" onClick={fn()}>
            Rotate key
          </Button>
        }
      />
      <ActionListItem
        key="seats"
        icon={<UsersIcon />}
        tone="warning"
        title="Three seats over the plan"
        detail="Design added three editors on Monday; the plan includes 25."
        meta="+€87 / mo"
        action={
          <Button variant="secondary" size="sm" onClick={fn()}>
            Review seats
          </Button>
        }
      />
      <ActionListItem
        key="card"
        icon={<CreditCardIcon />}
        tone="info"
        title="Card on file ends this month"
        detail="Update it before the October invoice is drawn."
        meta="Oct 28"
        action={
          <Button variant="secondary" size="sm" onClick={fn()}>
            Update card
          </Button>
        }
      />
      <ActionListItem
        key="hook"
        icon={<WebhookIcon />}
        tone="neutral"
        title="Webhook retries piling up"
        detail="412 deliveries to /hooks/orders failed in the last hour."
        meta="Retrying"
        metaTone="warning"
        action={
          <Button variant="secondary" size="sm" onClick={fn()}>
            Open logs
          </Button>
        }
      />
    </ActionList>
  )
}

/** Setup steps, the first emphasised as the one to do now; the rest have no chip. */
export const SetupSteps: Story = {
  name: 'Setup steps',
  render: () => (
    <ActionList
      className="w-[min(26rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-4"
      title="Finish setting up"
      action={
        <Button variant="outline" size="sm">
          <ArrowUpRightIcon size={14} /> View all
        </Button>
      }
    >
      <ActionListItem
        key="keys"
        emphasis
        tone="accent"
        icon={<KeyIcon />}
        title="Create a production key"
        detail="Test keys stop working at launch."
        meta="Do first"
        action={<Button size="sm">Create</Button>}
      />
      <ActionListItem key="budget" icon={<TimerIcon />} title="Set a spend alert" detail="So a runaway job pages someone." action={<Button variant="ghost" size="sm">Set</Button>} />
      <ActionListItem key="team" icon={<UserPlusIcon />} title="Invite your on-call" detail="Incidents need an owner before the first one." action={<Button variant="ghost" size="sm">Invite</Button>} />
    </ActionList>
  ),
}

const ROWS = [
  { id: 'a', icon: <ShieldAlertIcon />, tone: 'danger' as const, title: 'Two admins without 2FA', detail: 'Ana and Rui can sign in with a password alone.', meta: 'Today' },
  { id: 'b', icon: <UsersIcon />, tone: 'warning' as const, title: 'Guest access ends Friday', detail: 'Four contractors lose access to the Billing space.', meta: 'Fri' },
  { id: 'c', icon: <KeyIcon />, tone: 'info' as const, title: 'Unused token found', detail: 'ci-legacy hasn’t been used in 94 days.', meta: '94 days' },
]

/** Resolving a row removes it: it fades and the list closes the gap, and the count follows. */
export const Resolving: Story = {
  render: function Render() {
    const [rows, setRows] = useState(ROWS)
    return (
      <div className="flex flex-col items-start gap-3">
        <ActionList className={panel} title="Security review" count={rows.length}>
          {rows.map((row) => (
            <ActionListItem
              key={row.id}
              icon={row.icon}
              tone={row.tone}
              title={row.title}
              detail={row.detail}
              meta={row.meta}
              action={
                <Button variant="secondary" size="sm" onClick={() => setRows((r) => r.filter((x) => x.id !== row.id))}>
                  Resolve
                </Button>
              }
            />
          ))}
        </ActionList>
        <Button variant="ghost" size="sm" onClick={() => setRows(ROWS)}>
          Reset
        </Button>
      </div>
    )
  },
}

/** Narrow: the chip and the action wrap under the text, and nothing truncates the action. */
export const Narrow: Story = {
  render: () => <Queue className="w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-4" />,
}
