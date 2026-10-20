'use client'

import { useState } from 'react'
import { CopyIcon, LinkIcon, PencilIcon, ShareIcon, TrashIcon } from '@youj/icons'
import { RadialMenu, type RadialMenuItem } from '@youj/react'

const actions: RadialMenuItem[] = [
  { id: 'rename', label: 'Rename', icon: <PencilIcon /> },
  { id: 'copy', label: 'Duplicate', icon: <CopyIcon /> },
  { id: 'link', label: 'Copy link', icon: <LinkIcon /> },
  { id: 'share', label: 'Share', icon: <ShareIcon /> },
  { id: 'delete', label: 'Delete', icon: <TrashIcon /> },
]

export default function RadialMenuArc() {
  const [frame, setFrame] = useState<HTMLDivElement | null>(null)
  const [picked, setPicked] = useState<string | null>(null)
  return (
    <div ref={setFrame} className="flex h-[340px] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-line bg-canvas text-fg [contain:paint]">
      <p className="m-auto text-ui text-fg-muted">{picked ? `Picked ${picked}` : 'Click the button in the bar below'}</p>
      <footer className="flex justify-center border-t border-line bg-surface py-3">
        <RadialMenu
          items={actions}
          trigger="click"
          startAngle={-90}
          sweep={180}
          radius={96}
          container={frame}
          onSelect={(item) => setPicked(item.label)}
          label="Actions"
          aria-label="Actions"
          className="grid size-11 place-items-center rounded-full bg-accent text-ui-lg font-semibold text-on-accent shadow-md"
        >
          +
        </RadialMenu>
      </footer>
    </div>
  )
}
