'use client'

import type { ReactNode } from 'react'
import { Textarea } from '@youj/react'

const NOTES =
  'Shipped the new pricing page behind the pricing-v2 flag.\nFollow-ups: the OG image, redirects from /plans, and the changelog entry.'

export default function TextareaStates() {
  return (
    <div className="@container w-full max-w-xl">
      <div className="grid gap-x-6 gap-y-5 @md:grid-cols-2">
        <State label="empty">
          <Textarea aria-label="Reply" placeholder="Write a reply…" />
        </State>
        <State label="filled · grows with its content">
          <Textarea aria-label="Release notes" defaultValue={NOTES} />
        </State>
        <State label="invalid">
          <Textarea aria-label="Summary" defaultValue="WIP" aria-invalid />
        </State>
        <State label="disabled">
          <Textarea aria-label="Review notes" defaultValue="Locked while the release is in review." disabled />
        </State>
      </div>
    </div>
  )
}

function State({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-ui-xs text-fg-muted">{label}</p>
      {children}
    </div>
  )
}
