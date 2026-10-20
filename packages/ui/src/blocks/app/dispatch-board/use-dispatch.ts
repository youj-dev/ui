'use client'

import { useState } from 'react'
import { toast } from '../../../components/ui/toast'
import { LOADS, PROPOSALS, type Decision } from './data'
import { applyDecisions, proposalFor, type Decisions } from './model'

/** The board's state: the selected load and the dispatcher's decisions, with every load as they leave it. */
export function useDispatch(defaultLoad = 'LD-4821') {
  const [selectedId, setSelectedId] = useState(defaultLoad)
  const [decisions, setDecisions] = useState<Decisions>({})
  const loads = applyDecisions(LOADS, PROPOSALS, decisions)
  const selected = loads.find((l) => l.id === selectedId) ?? loads[0]!
  const proposal = proposalFor(PROPOSALS, selected.id)
  const pending = PROPOSALS.filter((p) => (decisions[p.id] ?? 'pending') === 'pending')

  const decide = (id: string, decision: Decision) => {
    setDecisions((all) => ({ ...all, [id]: decision }))
    if (decision === 'pending') return
    const title = PROPOSALS.find((p) => p.id === id)!.title
    toast(decision === 'approved' ? `Approved: ${title}` : `Dismissed: ${title}`, {
      description: decision === 'approved' ? 'The driver and the customer are notified.' : 'The plan stays as it was.',
      action: { label: 'Undo', onClick: () => setDecisions((all) => ({ ...all, [id]: 'pending' })) },
    })
  }

  return { loads, selected, select: setSelectedId, proposal, proposals: PROPOSALS, decisions, pending, decide }
}

export type DispatchState = ReturnType<typeof useDispatch>
