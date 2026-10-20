'use client'

import { ChatTypingIndicator } from '@youj/react'

export default function ThinkingIndicators() {
  return (
    <div className="grid w-full max-w-md grid-cols-2 gap-3">
      <div className="flex flex-col gap-2 rounded-xl border border-line bg-canvas p-4">
        <span className="text-ui-xs font-medium tracking-wide text-fg-muted uppercase">Shimmer</span>
        <ChatTypingIndicator />
      </div>
      <div className="flex flex-col gap-2 rounded-xl border border-line bg-canvas p-4">
        <span className="text-ui-xs font-medium tracking-wide text-fg-muted uppercase">Dots</span>
        <ChatTypingIndicator variant="dots" label="Searching the docs…" />
      </div>
    </div>
  )
}
