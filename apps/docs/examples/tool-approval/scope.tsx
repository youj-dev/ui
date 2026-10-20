'use client'

import { useState } from 'react'
import { Button, ChatToolApproval, type ToolApprovalDecision } from '@youj/react'
import { MailIcon, RefreshIcon } from '@youj/icons'

const BODY =
  'Hi team,\n\nInvoice 4821 (USD 18,400) was due on 30 September and is still open. Could you confirm a payment date by Friday? I attached the PDF and the purchase order so you have everything in one place.\n\nThanks,\nMaya'

export default function ToolApprovalScope() {
  const [run, setRun] = useState(0)
  const [trusted, setTrusted] = useState(false)

  // After "Always allow", the app remembers the scope and would skip the card next time.
  const remember = (d: ToolApprovalDecision) => setTrusted(d.decision === 'allow' && d.scope === 'always')

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <ChatToolApproval
        key={run}
        name="send_email"
        icon={<MailIcon size={14} strokeWidth={1.75} />}
        summary="Email finance about the overdue invoice"
        reason="You asked me to chase invoice 4821."
        args={{ to: 'finance@acme.test', subject: 'Invoice 4821 is overdue', body: BODY, api_key: 'yk_demo_example_key_0000' }}
        scope="messages to finance@acme.test"
        approver="Maya Chen"
        onDecision={remember}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-ui-sm text-fg-muted">{trusted ? 'Remembered: later emails to finance@acme.test skip this card.' : 'Nothing remembered yet.'}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setTrusted(false)
            setRun((n) => n + 1)
          }}
        >
          <RefreshIcon size={14} strokeWidth={1.75} />
          Ask again
        </Button>
      </div>
    </div>
  )
}
