'use client'

import { ActivityIcon } from '@youj/icons'
import { FlowField } from '@youj/motion/backgrounds'

export default function FlowFieldQuiet() {
  return (
    <div className="relative isolate w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-canvas">
      {/* Sparse, slow and deaf to the pointer: a sense of flow behind a status card, nothing more. */}
      <FlowField density={0.5} intensity={0.6} speed={0.6} scale={1.6} interactive={false} />
      <div aria-hidden className="absolute inset-0 bg-radial from-canvas from-30% to-transparent to-75%" />
      <div className="relative flex flex-col items-center px-6 py-14 text-center">
        <span className="grid size-10 place-items-center rounded-xl border border-line bg-surface text-fg shadow-sm">
          <ActivityIcon size={18} />
        </span>
        <p className="mt-4 text-sm font-medium text-fg">All regions are flowing</p>
        <p className="mt-1 max-w-xs text-sm text-fg-muted">Requests are being served from the nearest edge, with no failures in the last hour.</p>
      </div>
    </div>
  )
}
