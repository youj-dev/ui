'use client'

import { ArrowDownIcon, ArrowUpIcon, CornerDownLeftIcon } from '@youj/icons'
import { Kbd, KbdGroup } from '@youj/react'

const SHORTCUTS = [
  { label: 'Command menu', keys: ['⌘', 'K'] },
  { label: 'New deployment', keys: ['D'] },
  { label: 'Search logs', keys: ['/'] },
  { label: 'Toggle sidebar', keys: ['⌘', 'B'] },
  { label: 'Go to settings', keys: ['G', 'S'], sequence: true },
]

export default function KbdDemo() {
  return (
    <div className="w-full max-w-sm overflow-hidden rounded-xl border border-line bg-surface">
      <ul className="divide-y divide-line">
        {SHORTCUTS.map((shortcut) => (
          <li key={shortcut.label} className="flex items-center justify-between gap-4 px-4 py-2.5 text-ui text-fg">
            {shortcut.label}
            {/* Nested kbd elements are how HTML spells a key combination. */}
            <KbdGroup>
              {shortcut.keys.map((key, i) => (
                <span key={key} className="inline-flex items-center gap-1">
                  {shortcut.sequence && i > 0 && <span className="font-sans text-ui-xs text-fg-muted">then</span>}
                  <Kbd>{key}</Kbd>
                </span>
              ))}
            </KbdGroup>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line bg-canvas px-4 py-2 text-ui-sm text-fg-muted">
        <span className="inline-flex items-center gap-1.5">
          <KbdGroup>
            <Kbd>
              <ArrowUpIcon aria-label="Up arrow" />
            </Kbd>
            <Kbd>
              <ArrowDownIcon aria-label="Down arrow" />
            </Kbd>
          </KbdGroup>
          navigate
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Kbd>
            <CornerDownLeftIcon aria-label="Enter" />
          </Kbd>
          open
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Kbd>esc</Kbd>
          close
        </span>
      </div>
    </div>
  )
}
