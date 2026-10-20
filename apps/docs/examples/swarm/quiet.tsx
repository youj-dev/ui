'use client'

import { UsersIcon } from '@youj/icons'
import { Swarm } from '@youj/motion/backgrounds'

export default function SwarmQuiet() {
  return (
    <div className="relative isolate w-full max-w-lg overflow-hidden rounded-2xl border border-dashed border-line-strong bg-canvas">
      {/* A small, slow flock that ignores the pointer: company for an empty room. */}
      <Swarm density={0.5} intensity={0.7} speed={0.7} interactive={false} />
      <div aria-hidden className="absolute inset-0 bg-radial from-canvas from-30% to-transparent to-75%" />
      <div className="relative flex flex-col items-center px-6 py-14 text-center">
        <span className="grid size-10 place-items-center rounded-xl border border-line bg-surface text-fg shadow-sm">
          <UsersIcon size={18} />
        </span>
        <p className="mt-4 text-sm font-medium text-fg">No one else is here yet</p>
        <p className="mt-1 max-w-xs text-sm text-fg-muted">Invite your team and they will show up here as they join.</p>
      </div>
    </div>
  )
}
