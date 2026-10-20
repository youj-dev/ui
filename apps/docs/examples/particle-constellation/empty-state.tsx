'use client'

import { PlusIcon, ServerIcon } from '@youj/icons'
import { ParticleConstellation } from '@youj/motion/backgrounds'

export default function ParticleConstellationEmptyState() {
  return (
    <div className="relative isolate w-full max-w-lg overflow-hidden rounded-2xl border border-dashed border-line-strong bg-canvas">
      {/* Sparse and still under the pointer: a hint of the graph to come, not a show. */}
      <ParticleConstellation density={0.45} intensity={0.7} linkDistance={150} interactive={false} />
      <div aria-hidden className="absolute inset-0 bg-radial from-canvas from-30% to-transparent to-75%" />
      <div className="relative flex flex-col items-center px-6 py-14 text-center">
        <span className="grid size-10 place-items-center rounded-xl border border-line bg-surface text-fg shadow-sm">
          <ServerIcon size={18} />
        </span>
        <p className="mt-4 text-sm font-medium text-fg">No services connected yet</p>
        <p className="mt-1 max-w-xs text-sm text-fg-muted">Connect a repository and Youj maps how your services talk to each other.</p>
        <button
          type="button"
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-fg px-3.5 py-2 text-sm font-medium text-canvas focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none"
        >
          <PlusIcon size={15} />
          Connect a service
        </button>
      </div>
    </div>
  )
}
