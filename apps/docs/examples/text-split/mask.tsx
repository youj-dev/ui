'use client'

import { TextSplit } from '@youj/motion'

export default function TextSplitMask() {
  return (
    <div className="grid w-full max-w-xl gap-10 sm:grid-cols-2">
      <figure>
        <TextSplit as="p" by="chars" inView={false} duration="slow" className="text-5xl font-semibold tracking-tight text-fg">
          Shipped
        </TextSplit>
        <figcaption className="mt-3 font-mono text-xs text-fg-muted">rise</figcaption>
      </figure>
      <figure>
        {/* Each character slides up from behind its own line box: travel defaults to 105% of its height. */}
        <TextSplit as="p" by="chars" mask inView={false} duration="slow" className="text-5xl font-semibold tracking-tight text-fg">
          Shipped
        </TextSplit>
        <figcaption className="mt-3 font-mono text-xs text-fg-muted">rise + mask</figcaption>
      </figure>
    </div>
  )
}
