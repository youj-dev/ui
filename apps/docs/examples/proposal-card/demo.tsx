'use client'

import { useState } from 'react'
import { CheckIcon, LockIcon, SparklesIcon } from '@youj/icons'
import { Button, ProposalCard, type ProposalStatus } from '@youj/react'

export default function ProposalCardDemo() {
  const [status, setStatus] = useState<ProposalStatus>('pending')
  return (
    <ProposalCard
      headingLevel={2}
      className="w-full max-w-sm"
      source={
        <>
          <SparklesIcon size={12} /> Route agent · 92% confidence
        </>
      }
      title="Reroute load 4821 via Ridge Rd"
      description="Congestion on Harbor Fwy has cut speed by 24%. The delivery window stays intact."
      options={[
        { id: 'current', label: 'Harbor Fwy · current', value: '15:49', detail: '+47 min', tone: 'danger' },
        { id: 'proposed', label: 'Ridge Rd · proposed', value: '15:18', detail: '−31 min', proposed: true },
      ]}
      facts={[
        { label: 'Time saved', value: '31 min', tone: 'success' },
        { label: 'Extra distance', value: '+4.2 mi' },
        { label: 'Window', value: 'Kept', tone: 'success' },
      ]}
      note={
        <span className="inline-flex items-center gap-1.5">
          <LockIcon size={12} /> Route changes need a dispatcher’s approval.
        </span>
      }
      status={status}
      resolution={
        <span className="flex items-center justify-between gap-2">
          {status === 'approved' ? 'Approved · driver notified' : 'Dismissed · keeping Harbor Fwy'}
          <Button size="sm" variant="ghost" onClick={() => setStatus('pending')}>
            Undo
          </Button>
        </span>
      }
      actions={
        <>
          <Button size="sm" onClick={() => setStatus('approved')}>
            <CheckIcon size={14} /> Approve reroute
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setStatus('dismissed')}>
            Dismiss
          </Button>
        </>
      }
    />
  )
}
