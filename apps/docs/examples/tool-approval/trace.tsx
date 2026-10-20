'use client'

import { ChatToolApproval, ChatToolCall } from '@youj/react'

// Resolved requests sit in the trace as one quiet line each, with who decided and when.
export default function ToolApprovalTrace() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-2">
      <p className="text-ui-xs font-medium tracking-wide text-fg-muted uppercase">Agent trace</p>
      <ChatToolCall name="get_invoice" args={{ id: 4821 }} status="success" duration={420} result={{ id: 4821, amount: 18400, status: 'overdue' }} />
      <ChatToolApproval
        name="send_email"
        summary="Email finance about invoice 4821"
        risk="medium"
        args={{ to: 'finance@acme.test', subject: 'Invoice 4821 is overdue' }}
        status="done"
        duration={880}
        resolution={{ by: 'Maya Chen', at: new Date(2026, 9, 12, 16, 20) }}
      />
      <ChatToolApproval
        name="refund_payment"
        summary="Refund USD 18,400 to Acme"
        risk="high"
        args={{ payment: 'pay_91ac', amount: 18400, currency: 'USD', token: 'tok_live_77' }}
        status="denied"
        resolution={{ by: 'Maya Chen', at: new Date(2026, 9, 12, 16, 22), reason: 'Finance confirmed the payment is on its way.' }}
      />
      <ChatToolApproval name="deploy" summary="Promote orion to production" risk="high" args={{ project: 'orion', target: 'production' }} status="expired" />
      <ChatToolApproval
        name="delete_rows"
        summary="Delete 1,204 test orders"
        risk="high"
        args={{ table: 'orders', limit: 5000 }}
        status="failed"
        error="Permission denied: the role can't delete from orders."
        resolution={{ by: 'Maya Chen', at: new Date(2026, 9, 12, 16, 31) }}
      />
    </div>
  )
}
