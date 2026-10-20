'use client'

import { useEffect, useRef, useState } from 'react'
import { useYouj } from '@youj/core'
import { CodeIcon, CopyIcon, DownloadIcon, FlaskIcon, MoreHorizontalIcon } from '@youj/icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@youj/react'
import { Island, IslandButton } from '@/components/explorer/island'
import { isState, type Entry } from './catalog'
import type { IconFileKind } from './download'

/* What a card's island offers, per kind of icon. Under a pointer: Copy (the
 * React code, with its import), Code (the large code modal) and Download
 * (SVG, PNG or a React component of the drawing), or, for a swap pair, Open
 * in Chain (a pair of Youj icons, or a state icon). On touch,
 * where a tap reveals the island instead: Copy, Code and More, which holds
 * the rest. Every action is the explorer's (actions),
 * so the cards share one code dialog and one way to save a file. */

export interface IconCardActions {
  /** Copies the React code; resolves true once it's on the clipboard. */
  copy: (entry: Entry) => Promise<boolean>
  /** Opens the code modal; focus comes back to `opener` when it closes. */
  code: (entry: Entry, opener?: HTMLElement) => void
  save: (entry: Entry, kind: IconFileKind, from: HTMLElement) => void
  chain: (entry: Entry) => void
}

const glyph = { size: 15, strokeWidth: 1.75 } as const

const FILES: { kind: IconFileKind; label: string; hint: string }[] = [
  { kind: 'svg', label: 'SVG', hint: '.svg' },
  { kind: 'png', label: 'PNG', hint: '@4x.png' },
  { kind: 'tsx', label: 'React component', hint: '.tsx' },
]

interface IconIslandProps {
  entry: Entry
  actions: IconCardActions
  touch: boolean
  list: boolean
  /** Holds the island up while a menu it opened is open. */
  onPin: (pinned: boolean) => void
  /** Hands focus back to the card. */
  onEscape: () => void
}

export function IconIsland({ entry, actions, touch, list, onPin, onEscape }: IconIslandProps) {
  const k = useYouj()
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const root = useRef<HTMLSpanElement>(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = async () => {
    if (!(await actions.copy(entry))) return
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), k.ms('deliberate') * 3)
  }
  const save = (kind: IconFileKind) => actions.save(entry, kind, root.current ?? document.body)
  const pair = entry.kind === 'pair'
  const chain = (pair && entry.from.kind === 'youj' && entry.to.kind === 'youj') || isState(entry)

  return (
    <Island label={`${entry.name}: actions`} placement={list ? 'end' : 'bottom'} onEscape={onEscape}>
      <span ref={root} hidden />
      <IslandButton label={copied ? 'Copied' : 'Copy React code'} onClick={copy}>
        <CopyIcon {...glyph} active={copied} />
      </IslandButton>
      <IslandButton label="Get the code" onClick={(e) => actions.code(entry, e.currentTarget)}>
        <CodeIcon {...glyph} />
      </IslandButton>
      {touch ? (
        <DropdownMenu onOpenChange={onPin}>
          <IslandButton label="More" render={<DropdownMenuTrigger />}>
            <MoreHorizontalIcon {...glyph} />
          </IslandButton>
          <DropdownMenuContent>
            {chain && (
              <DropdownMenuItem onClick={() => actions.chain(entry)}>
                <FlaskIcon {...glyph} />
                Open in Chain
              </DropdownMenuItem>
            )}
            {!pair && (
              <>
                {chain && <DropdownMenuSeparator />}
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Download</DropdownMenuLabel>
                  {FILES.map((f) => (
                    <DropdownMenuItem key={f.kind} onClick={() => save(f.kind)}>
                      <DownloadIcon {...glyph} />
                      {f.label}
                      <span className="ms-auto ps-4 text-[11.5px] text-fg-subtle tabular-nums">{f.hint}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : pair ? (
        chain && (
          <IslandButton label="Open in Chain" onClick={() => actions.chain(entry)}>
            <FlaskIcon {...glyph} />
          </IslandButton>
        )
      ) : (
        <DropdownMenu onOpenChange={onPin}>
          <IslandButton label="Download" render={<DropdownMenuTrigger />}>
            <DownloadIcon {...glyph} />
          </IslandButton>
          <DropdownMenuContent align="center" sideOffset={8} className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Download</DropdownMenuLabel>
              {FILES.map((f) => (
                <DropdownMenuItem key={f.kind} onClick={() => save(f.kind)}>
                  {f.label}
                  <span className="ms-auto ps-4 text-[11.5px] text-fg-subtle tabular-nums">{f.hint}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </Island>
  )
}
