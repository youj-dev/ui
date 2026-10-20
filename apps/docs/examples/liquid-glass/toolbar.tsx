'use client'

import { useState } from 'react'
import { LiquidGlass } from '@youj/motion/interactions'
import { BoldIcon, ItalicIcon, LinkIcon, ListIcon, UnderlineIcon } from '@youj/icons'

const TOOLS = [
  { id: 'bold', label: 'Bold', Icon: BoldIcon },
  { id: 'italic', label: 'Italic', Icon: ItalicIcon },
  { id: 'underline', label: 'Underline', Icon: UnderlineIcon },
  { id: 'link', label: 'Link', Icon: LinkIcon },
  { id: 'list', label: 'List', Icon: ListIcon },
]

export default function LiquidGlassToolbar() {
  const [on, setOn] = useState<Set<string>>(() => new Set(['bold']))
  const toggle = (id: string) =>
    setOn((s) => {
      const next = new Set(s)
      if (!next.delete(id)) next.add(id)
      return next
    })

  return (
    <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-line bg-surface p-6">
      {/* The bar floats over the text, so the glass has something to blur. */}
      <p className="text-lg font-semibold tracking-tight text-fg">Release notes</p>
      <p className="mt-2 text-sm leading-relaxed text-fg-muted">
        Search now matches comments and attachments. Saved views sync across devices, and the inbox groups related updates so a busy thread reads as
        one item. Exports keep your column order.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-fg-muted">
        Charts gain a compare mode: pick two ranges and the second draws as a dashed line over the first. Shared links open on the same range and
        filters you were looking at, and embeds follow the viewer's theme.
      </p>
      <div className="absolute inset-x-0 bottom-5 flex justify-center">
        <LiquidGlass className="rounded-full">
          <div role="toolbar" aria-label="Formatting" className="flex items-center gap-1 p-1.5">
            {TOOLS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                aria-label={label}
                aria-pressed={on.has(id)}
                onClick={() => toggle(id)}
                className="grid size-9 place-items-center rounded-full text-fg-muted outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-accent aria-pressed:bg-selected aria-pressed:text-fg"
              >
                <Icon size={16} aria-hidden />
              </button>
            ))}
          </div>
        </LiquidGlass>
      </div>
    </div>
  )
}
