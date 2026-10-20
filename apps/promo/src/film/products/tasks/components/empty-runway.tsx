'use client'

import { FlagIcon, PlusIcon } from '@youj/icons'
import { Button } from '@youj/react/components/ui/button'
import { Kbd } from '@youj/react/components/ui/kbd'

/** A project with nothing on its runway yet: the shape of one, drawn faintly, and the first step. */
export function EmptyRunway({ launchIn, onAdd }: { launchIn: number; onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 px-6 pt-[8vh] pb-16 text-center">
      {/* A runway with nothing on it: three dashed places for bars, a handoff between two, and the flag. */}
      <svg aria-hidden viewBox="0 0 320 96" className="w-full max-w-sm text-fg-subtle">
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4">
          <rect x="8" y="12" width="96" height="16" rx="6" />
          <rect x="120" y="40" width="112" height="16" rx="6" />
          <rect x="72" y="68" width="80" height="16" rx="6" />
          <path d="M 104 20 C 116 20, 108 48, 120 48" />
        </g>
        <line x1="288" y1="4" x2="288" y2="92" stroke="currentColor" strokeWidth="2" />
        <path d="M 288 6 L 304 12 L 288 18 Z" fill="currentColor" />
      </svg>
      <div className="flex max-w-md flex-col gap-2">
        <h2 className="text-xl font-semibold tracking-tight text-fg">Nothing on the runway yet</h2>
        <p className="text-ui-lg leading-relaxed text-pretty text-fg-muted">
          The launch is {launchIn} days out. Put the first task on the runway, then the next; Tandem draws the handoffs between them and tells you if anything will land late.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={onAdd} data-yj-trigger="">
          <PlusIcon size={15} /> Add the first task
        </Button>
        <span className="flex items-center gap-1.5 text-ui-sm text-fg-muted">
          or press <Kbd>N</Kbd>
        </span>
      </div>
      <p className="flex items-center gap-1.5 text-ui-sm text-fg-muted">
        <FlagIcon size={12} /> The launch flag is already set.
      </p>
    </div>
  )
}
