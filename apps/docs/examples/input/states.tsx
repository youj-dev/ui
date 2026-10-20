'use client'

import type { ReactNode } from 'react'
import { Input } from '@youj/react'

export default function InputStates() {
  return (
    <div className="@container w-full max-w-xl">
      <div className="grid gap-x-6 gap-y-5 @md:grid-cols-2">
        <State label="empty">
          <Input aria-label="Project name" placeholder="Project name" />
        </State>
        <State label="filled">
          <Input aria-label="Display name" defaultValue="Priya Raman" />
        </State>
        <State label="invalid">
          <Input aria-label="Email" defaultValue="priya@" aria-invalid />
        </State>
        <State label="disabled">
          <Input aria-label="Plan" defaultValue="Managed by your organization" disabled />
        </State>
        <State label="read-only">
          <Input aria-label="Project ID" defaultValue="prj_7f3a91c2e8" readOnly className="font-mono text-ui-sm" />
        </State>
        <State label="file">
          <Input aria-label="Logo" type="file" />
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
