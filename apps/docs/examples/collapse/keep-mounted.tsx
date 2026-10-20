'use client'

import { useId, useState } from 'react'
import { Collapse } from '@youj/motion'
import { ChevronRightIcon } from '@youj/icons'

const field =
  'mt-1.5 h-8 w-full rounded-md border border-line bg-canvas px-2.5 font-mono text-[13px] text-fg outline-none placeholder:text-fg-muted focus-visible:ring-2 focus-visible:ring-accent'

export default function CollapseKeepMounted() {
  const id = useId()
  const [open, setOpen] = useState(true)

  return (
    <div className="flex min-h-[310px] w-full max-w-sm flex-col">
      <form onSubmit={(e) => e.preventDefault()} className="w-full max-w-sm rounded-xl border border-line bg-surface p-4">
        <label className="block text-sm font-medium text-fg">
          Repository
          <input defaultValue="acme/web" className={field} />
        </label>

        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="mt-4 -ms-1 inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-sm text-fg-muted outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className={`inline-flex transition-transform yj-duration-base ease-standard ${open ? 'rotate-90' : ''}`}>
            <ChevronRightIcon size={14} trigger="none" />
          </span>
          Build settings
        </button>

        {/* keepMounted: closed, the fields stay in the DOM (hidden and inert), so what was typed survives. */}
        <Collapse id={id} open={open} keepMounted duration="slow">
          <div className="grid gap-3 pt-3">
            <label className="block text-xs font-medium text-fg-muted">
              Build command
              <input placeholder="pnpm build" className={field} />
            </label>
            <label className="block text-xs font-medium text-fg-muted">
              Output directory
              <input placeholder=".next" className={field} />
            </label>
          </div>
        </Collapse>

        <p className="mt-4 text-xs text-fg-muted">Type a build command, close the section and open it again.</p>
      </form>
    </div>
  )
}
