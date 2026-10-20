import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { MailIcon } from '@youj/icons/components/youj/icons/mail'
import { TrashIcon } from '@youj/icons/components/youj/icons/trash'
import { Button } from '../button'
import { ChatToolApproval, type ToolApprovalStatus } from './chat-tool-approval'

const meta: Meta<typeof ChatToolApproval> = {
  title: 'UI/Chat/ToolApproval',
  component: ChatToolApproval,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'An agent asks before it runs a risky tool: its name and icon, what it wants in plain words, the exact arguments (long values fold, sensitive ones are masked), why, and a risk tier shown as an icon and a word. People answer Allow once, Always allow for a scope or Deny, or Edit the arguments first (validated). Pending, approved, denied, expired, then running, done or failed. Enter never approves a high-risk request. Each state change is announced once.',
      },
    },
  },
}
export default meta

const EMAIL = {
  to: 'finance@acme.test',
  subject: 'Q3 invoice 4821 is overdue',
  body: 'Hi team,\n\nInvoice 4821 (USD 18,400) was due on 30 September and is still open. Could you confirm a payment date by Friday? I attached the PDF and the purchase order so you have everything in one place.\n\nThanks,\nMaya',
  api_key: 'yk_demo_example_key_0000',
}

/** A high-risk request: Edit the arguments, then Allow once, Always allow for the scope, or Deny. Focus starts on the summary. */
export const Hero: StoryObj = {
  render: () => (
    <div className="flex w-full max-w-[min(560px,calc(100vw-2rem))] flex-col gap-3">
      <ChatToolApproval
        name="delete_rows"
        icon={<TrashIcon size={14} strokeWidth={1.75} />}
        summary="Delete 1,204 rows from the orders table"
        reason="They are test orders older than 90 days and the cleanup job asked for a hard delete."
        risk="high"
        args={{ table: 'orders', where: "env = 'test' AND created_at < now() - interval '90 days'", limit: 5000 }}
        scope="this project"
        approver="Maya Chen"
      />
    </div>
  ),
}

export const Risks: StoryObj = {
  render: () => (
    <div className="flex w-full max-w-[min(560px,calc(100vw-2rem))] flex-col gap-3">
      <ChatToolApproval name="search_docs" summary="Search the internal docs for “rollback”" risk="low" args={{ query: 'rollback' }} />
      <ChatToolApproval
        name="send_email"
        icon={<MailIcon size={14} strokeWidth={1.75} />}
        summary="Email finance about the overdue invoice"
        reason="You asked me to chase invoice 4821."
        args={EMAIL}
        scope="messages to finance@acme.test"
      />
      <ChatToolApproval name="deploy" summary="Promote orion to production" risk="high" args={{ project: 'orion', target: 'production' }} />
    </div>
  ),
}

const STATES: ToolApprovalStatus[] = ['pending', 'approved', 'denied', 'expired', 'running', 'done', 'failed']

/** Every state, driven from outside with `status`. */
export const States: StoryObj = {
  render: function Render() {
    const [status, setStatus] = useState<ToolApprovalStatus>('pending')
    return (
      <div className="flex w-full max-w-[min(560px,calc(100vw-2rem))] flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          {STATES.map((s) => (
            <Button key={s} size="xs" variant={s === status ? 'default' : 'outline'} onClick={() => setStatus(s)}>
              {s}
            </Button>
          ))}
        </div>
        <ChatToolApproval
          name="deploy"
          summary="Promote orion to production"
          risk="high"
          args={{ project: 'orion', target: 'production' }}
          status={status}
          resolution={{ by: 'Maya Chen', at: new Date(2026, 9, 12, 16, 20), reason: 'Not before the freeze ends.' }}
          error="403: this token cannot promote to production."
          duration={4200}
        />
      </div>
    )
  },
}
