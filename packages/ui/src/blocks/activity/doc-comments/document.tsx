'use client'

import { memo, type KeyboardEvent, type RefObject } from 'react'
import { cn } from '../../../lib/utils'
import type { DocCommentsAnchor, DocCommentsDoc } from './data'
import { segments } from './layout'

/* The document, with every thread's words highlighted. A highlight is a
 * button in the text (its name is the words, its description the comments
 * on them): pointing at it lights its card, pressing it opens the thread.
 * Where two threads overlap, the highlight is deeper. The text itself is
 * only text, so a selection maps back to plain offsets. */

export interface MarkedThread {
  id: string
  anchor: DocCommentsAnchor
  resolved?: boolean
}

export interface DocumentProps {
  doc: DocCommentsDoc
  threads: readonly MarkedThread[]
  /** A new comment's words, while its first comment is being written. */
  draft: DocCommentsAnchor | null
  active: string | null
  linked: string | null
  /** The id prefix of each thread's description (`${describedBy}-${id}`), rendered elsewhere. */
  describedBy: string
  headingLevel: 2 | 3 | 4
  ref?: RefObject<HTMLDivElement | null>
  onActivate: (id: string, focusCard: boolean) => void
  onLink: (id: string | null) => void
}

export const Document = memo(function Document({
  doc,
  threads,
  draft,
  active,
  linked,
  describedBy,
  headingLevel,
  ref,
  onActivate,
  onLink,
}: DocumentProps) {
  const Heading = (['h2', 'h3', 'h4'] as const)[headingLevel - 2]!
  // Each thread gets one tab stop: its first run of words.
  const seen = new Set<string>()
  return (
    <div ref={ref} data-slot="doc" className="relative flex flex-col gap-3">
      {doc.blocks.map((block) => {
        const anchors = [
          ...threads.filter((t) => t.anchor.block === block.id).map((t) => ({ id: t.id, start: t.anchor.start, end: t.anchor.end })),
          ...(draft?.block === block.id ? [{ id: '', start: draft.start, end: draft.end }] : []),
        ]
        const Tag = block.type === 'heading' ? Heading : 'p'
        return (
          <Tag
            key={block.id}
            data-yj-block={block.id}
            className={cn(
              block.type === 'heading'
                ? 'mt-3 text-ui-lg font-semibold tracking-tight text-fg first:mt-0'
                : 'text-ui leading-relaxed text-pretty text-fg',
            )}
          >
            {segments(block.text, anchors).map((run) => {
              if (!run.ids.length) return run.text
              const ids = run.ids.filter(Boolean)
              const first = ids.find((id) => !seen.has(id))
              for (const id of ids) seen.add(id)
              if (!ids.length) {
                return (
                  <mark
                    key={run.start}
                    data-yj-draft=""
                    className="rounded-xs bg-accent-subtle text-fg shadow-[inset_0_-2px_0_var(--color-accent-line)] [box-decoration-break:clone]"
                  >
                    {run.text}
                  </mark>
                )
              }
              const top = ids[ids.length - 1]!
              const resolved = ids.every((id) => threads.find((t) => t.id === id)?.resolved)
              const onKeyDown = (event: KeyboardEvent) => {
                if (event.key !== 'Enter' && event.key !== ' ') return
                event.preventDefault()
                onActivate(ids.includes(active ?? '') ? active! : top, true)
              }
              return (
                <mark
                  key={run.start}
                  role="button"
                  tabIndex={first ? 0 : -1}
                  data-yj-threads={ids.join(' ')}
                  data-active={ids.includes(active ?? '') || undefined}
                  data-yj-linked={ids.includes(linked ?? '') || undefined}
                  data-yj-resolved={resolved || undefined}
                  aria-describedby={ids.map((id) => `${describedBy}-${id}`).join(' ')}
                  onClick={() => onActivate(ids.includes(active ?? '') ? active! : top, false)}
                  onKeyDown={onKeyDown}
                  onPointerEnter={() => onLink(top)}
                  onPointerLeave={() => onLink(null)}
                  onFocus={() => onLink(top)}
                  onBlur={() => onLink(null)}
                  className={cn(
                    'cursor-pointer rounded-xs text-fg outline-none [box-decoration-break:clone] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus',
                    'transition-[background-color,box-shadow] yj-duration-fast ease-standard',
                    resolved
                      ? 'bg-transparent shadow-[inset_0_-1px_0_var(--color-line-strong)] hover:bg-hover data-yj-linked:bg-hover data-active:bg-hover'
                      : cn(
                          'bg-warning-subtle shadow-[inset_0_-2px_0_var(--color-warning-line)]',
                          'hover:bg-warning-line data-yj-linked:bg-warning-line data-active:bg-warning-line data-active:shadow-[inset_0_-2px_0_var(--color-warning)]',
                          ids.length > 1 && 'bg-warning-line',
                        ),
                  )}
                >
                  {run.text}
                </mark>
              )
            })}
          </Tag>
        )
      })}
    </div>
  )
})
