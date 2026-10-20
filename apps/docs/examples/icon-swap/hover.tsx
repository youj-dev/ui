'use client'

import { ExternalLinkIcon, FileTextIcon, FilmIcon, IconSwap, ImageIcon, type SwapIcon } from '@youj/icons'

const FILES: { name: string; meta: string; icon: SwapIcon }[] = [
  { name: 'Q3 planning.md', meta: '12 KB · edited 2h ago', icon: FileTextIcon },
  { name: 'Launch hero.png', meta: '2.4 MB · edited yesterday', icon: ImageIcon },
  { name: 'Demo cut v4.mp4', meta: '84 MB · edited Monday', icon: FilmIcon },
]

export default function IconSwapHover() {
  return (
    <ul className="w-full max-w-sm divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
      {FILES.map(({ name, meta, icon }) => (
        <li key={name}>
          {/* Uncontrolled: the swap follows the row's hover and keyboard focus. */}
          <button
            type="button"
            className="group flex w-full items-center gap-3 px-3.5 py-3 text-start transition-colors duration-(--yj-duration-fast) ease-standard hover:bg-raised focus-visible:bg-raised focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none focus-visible:ring-inset"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-canvas text-fg-muted group-hover:text-fg group-focus-visible:text-fg">
              <IconSwap from={icon} to={ExternalLinkIcon} transition="slide" size={16} strokeWidth={1.75} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-fg">{name}</span>
              <span className="block text-xs text-fg-muted">{meta}</span>
            </span>
            <span className="text-xs text-fg-muted opacity-0 transition-opacity duration-(--yj-duration-fast) ease-standard group-hover:opacity-100 group-focus-visible:opacity-100">
              Open
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
