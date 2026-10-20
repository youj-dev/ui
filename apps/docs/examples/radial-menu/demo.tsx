'use client'

import { useState } from 'react'
import { CodeIcon, FrameIcon, PenToolIcon, ShapesIcon, TypeIcon } from '@youj/icons'
import { RadialMenu, type RadialMenuItem } from '@youj/react'

const tools: RadialMenuItem[] = [
  { id: 'frame', label: 'Frame', icon: <FrameIcon /> },
  { id: 'text', label: 'Text', icon: <TypeIcon /> },
  { id: 'shape', label: 'Shape', icon: <ShapesIcon /> },
  { id: 'pen', label: 'Pen', icon: <PenToolIcon /> },
  { id: 'code', label: 'Code', icon: <CodeIcon /> },
]

export default function RadialMenuDemo() {
  // The ring renders inside this frame: `contain: paint` makes it the box the ring stays within.
  const [frame, setFrame] = useState<HTMLDivElement | null>(null)
  const [tool, setTool] = useState(tools[0] as RadialMenuItem)
  return (
    <div ref={setFrame} className="flex h-[380px] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-line bg-canvas text-fg [contain:paint]">
      <header className="flex items-center gap-2 border-b border-line bg-surface px-4 py-2.5 text-ui">
        <span className="font-semibold">Landing page</span>
        <span className="ms-auto flex items-center gap-2 text-fg-muted">
          <span className="grid size-6 place-items-center rounded-md bg-selected text-fg [&_svg]:size-4">{tool.icon}</span>
          {tool.label}
        </span>
      </header>
      <RadialMenu
        items={tools}
        onSelect={setTool}
        container={frame}
        startAngle={-72}
        label="Tools"
        aria-label="Canvas. Press and hold, or press Enter, to pick a tool."
        className="relative flex-1 bg-well"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 m-auto h-32 w-56 rounded-lg border border-line bg-surface shadow-sm" />
        <p aria-hidden className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-ui-sm text-fg-subtle">
          Press and hold anywhere, drag to a tool, let go
        </p>
      </RadialMenu>
    </div>
  )
}
