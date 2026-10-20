'use client'

import { CheckCircleIcon } from '@youj/icons'
import { Spinner } from '@youj/react'

export default function SpinnerInline() {
  return (
    <ul className="w-full max-w-md divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
      <li className="flex items-center gap-3 px-4 py-3">
        <span className="min-w-0 flex-1 truncate font-mono text-ui text-fg">youj.io</span>
        <span className="inline-flex items-center gap-1.5 text-ui-sm text-success-text">
          <CheckCircleIcon size={14} />
          Valid configuration
        </span>
      </li>
      <li className="flex items-center gap-3 px-4 py-3">
        <span className="min-w-0 flex-1 truncate font-mono text-ui text-fg">docs.youj.io</span>
        <span className="inline-flex items-center gap-1.5 text-ui-sm text-fg-muted">
          {/* On its own, the spinner announces its label politely. */}
          <Spinner size={14} label="Checking DNS for docs.youj.io" />
          <span aria-hidden>Checking DNS</span>
        </span>
      </li>
    </ul>
  )
}
