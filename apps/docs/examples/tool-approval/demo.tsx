'use client'

import { useState } from 'react'
import { Button, ChatToolApproval, type ToolApprovalDecision } from '@youj/react'
import { RefreshIcon, TrashIcon } from '@youj/icons'

export default function ToolApprovalDemo() {
  const [run, setRun] = useState(0)
  const [last, setLast] = useState<ToolApprovalDecision>()

  // High risk: focus starts on the summary, Enter never approves, and Edit lets you narrow the delete first.
  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <ChatToolApproval
        key={run}
        name="delete_rows"
        icon={<TrashIcon size={14} strokeWidth={1.75} />}
        summary="Delete 1,204 rows from the orders table"
        reason="They are test orders older than 90 days, and the cleanup job asked for a hard delete."
        risk="high"
        args={{ table: 'orders', where: "env = 'test' AND created_at < now() - interval '90 days'", limit: 5000 }}
        validate={(key, value) => (key === 'limit' && (value as number) > 10000 ? 'Deleting more than 10,000 rows needs a ticket.' : undefined)}
        approver="Maya Chen"
        onDecision={setLast}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate font-mono text-ui-sm text-fg-muted">
          {last ? `onDecision → ${last.decision}, ${last.scope}, limit ${String(last.args.limit)}` : 'onDecision hasn’t fired'}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setLast(undefined)
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
