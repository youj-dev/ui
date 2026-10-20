'use client'

import { useId } from 'react'
import { ArrowUpIcon, AtSignIcon, PaperclipIcon, SparklesIcon } from '@youj/icons'
import { ShimmerBorder } from '@youj/motion/interactions'

const ICON_BUTTON =
  'grid size-8 place-items-center rounded-lg text-fg-muted outline-none hover:bg-raised hover:text-fg focus-visible:ring-2 focus-visible:ring-accent'

export default function ShimmerBorderDemo() {
  const id = useId()
  return (
    <div className="w-full max-w-lg">
      <p className="mb-3 text-center text-sm text-fg-muted">Good afternoon, Ada. What should we ship today?</p>
      {/* Focus the prompt, or hover it: the light lengthens and blooms. */}
      <ShimmerBorder className="rounded-2xl">
        <div className="relative z-2">
          <label htmlFor={id} className="sr-only">
            Ask the assistant
          </label>
          <textarea
            id={id}
            rows={3}
            placeholder="Ask anything about your workspace…"
            className="block w-full resize-none bg-transparent px-4 pt-4 text-[15px] leading-6 text-fg outline-none placeholder:text-fg-muted"
          />
          <div className="flex items-center gap-1 px-2 pb-2">
            <button type="button" aria-label="Attach a file" className={ICON_BUTTON}>
              <PaperclipIcon size={16} />
            </button>
            <button type="button" aria-label="Mention a teammate" className={ICON_BUTTON}>
              <AtSignIcon size={16} />
            </button>
            <span className="ms-1 inline-flex items-center gap-1.5 rounded-md border border-line px-2 py-1 font-mono text-[11px] text-fg-muted max-sm:hidden">
              <SparklesIcon size={12} className="text-accent" />
              reasoning · high
            </span>
            <button
              type="button"
              aria-label="Send"
              className="ms-auto grid size-8 place-items-center rounded-lg bg-fg text-canvas outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              <ArrowUpIcon size={16} />
            </button>
          </div>
        </div>
      </ShimmerBorder>
    </div>
  )
}
