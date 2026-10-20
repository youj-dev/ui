'use client'

import { Separator } from '@youj/react'

export default function SeparatorDemo() {
  return (
    <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-5">
      <p className="text-ui-lg font-medium text-fg">youj-web</p>
      <p className="mt-1 text-ui text-fg-muted">The marketing site and docs, deployed from main.</p>
      <Separator className="my-4" />
      {/* Vertical separators stretch to the height of their row. */}
      <div className="flex h-5 items-center gap-3 text-ui text-fg-muted">
        <span>Deployments</span>
        <Separator orientation="vertical" />
        <span>Domains</span>
        <Separator orientation="vertical" />
        <span>Settings</span>
      </div>
    </div>
  )
}
