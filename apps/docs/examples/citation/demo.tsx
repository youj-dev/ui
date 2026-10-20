'use client'

import { ChatMessage, type ChatSource } from '@youj/react'

const SOURCES: ChatSource[] = [
  {
    title: 'Regions and pricing',
    url: 'https://youj.io/docs/regions',
    snippet: 'Per-region pricing for functions: requests, duration and bandwidth, updated monthly.',
  },
  {
    title: 'Measuring cold starts',
    url: 'https://youj.io/blog/cold-starts',
    snippet: 'How we measure cold starts: 1 GB functions, 15 minutes idle, p50 and p95 over 7 days.',
  },
]

export default function CitationDemo() {
  return (
    <div className="w-full max-w-2xl">
      {/* `[1]` in the text becomes a chip for sources[0]; the row of sources follows the answer. */}
      <ChatMessage
        role="assistant"
        name="Youj"
        sources={SOURCES}
        content="**iad1** has the fastest cold starts, and **fra1** is the cheapest at 10M requests a month [1]. Cold starts are measured on a 1 GB function after 15 minutes idle [2]."
      />
    </div>
  )
}
