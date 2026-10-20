'use client'

import { memo, type ReactNode } from 'react'
import { ArrowRightIcon } from '@youj/icons'
import { cn } from '../../../lib/utils'
import type { VersionHistoryCopy, VersionHistoryDoc } from './data'
import { diffBlocks, diffProperties, type BlockDiff, type Piece } from './diff'

/* A version of the document, with what changed since the one it's compared
 * to marked in place: inserted words underlined on green, removed words
 * struck through on red (real ins and del, each saying "Added" or "Removed"
 * to a screen reader), whole blocks marked at the edge. Each change is a
 * stop for Previous and Next change. Changed properties come first, as
 * before → after. Without Show changes, it's the version as it read. */

const insClass = 'rounded-xs bg-success-subtle text-fg no-underline shadow-[inset_0_-1px_0_var(--color-success-line)] [box-decoration-break:clone]'
const delClass = 'rounded-xs bg-danger-subtle text-fg-muted line-through decoration-danger-text [box-decoration-break:clone]'
const stop = 'rounded-xs outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus'

function Hunk({ pieces, copy }: { pieces: Piece[]; copy: VersionHistoryCopy }) {
  return (
    <span data-yj-change="" tabIndex={-1} className={stop}>
      {pieces.map((piece, i) =>
        piece.op === 'insert' ? (
          <ins key={i} className={insClass}>
            <span className="sr-only">{copy.added}: </span>
            {piece.text}
          </ins>
        ) : (
          <del key={i} className={delClass}>
            <span className="sr-only">{copy.removed}: </span>
            {piece.text}
          </del>
        ),
      )}
    </span>
  )
}

/** Equal text as is; each run of changes as one stop. */
function pieces(list: Piece[], copy: VersionHistoryCopy) {
  const out: ReactNode[] = []
  let hunk: Piece[] = []
  const close = () => {
    if (hunk.length) out.push(<Hunk key={out.length} pieces={hunk} copy={copy} />)
    hunk = []
  }
  for (const piece of list) {
    if (piece.op === 'equal') {
      close()
      out.push(piece.text)
    } else hunk.push(piece)
  }
  close()
  return out
}

export interface Changes {
  blocks: BlockDiff[]
  properties: ReturnType<typeof diffProperties>
}

/** What changed from `base` to `doc`: the blocks with their pieces, and the properties. With no base, nothing's marked. */
export function changesOf(doc: VersionHistoryDoc, base: VersionHistoryDoc | null): Changes {
  if (!base) return { blocks: doc.blocks.map((b) => ({ ...b, change: null, pieces: [{ op: 'equal', text: b.text }] })), properties: [] }
  return { blocks: diffBlocks(base.blocks, doc.blocks), properties: diffProperties(base.properties, doc.properties) }
}

/** How many stops Previous and Next change walk: each property, each whole block, each run of changed words. */
export function stopsIn(changes: Changes) {
  let stops = changes.properties.length
  for (const block of changes.blocks) {
    if (block.change === 'inserted' || block.change === 'deleted') stops++
    else
      for (let i = 0; i < block.pieces.length; i++)
        if (block.pieces[i]!.op !== 'equal' && block.pieces[i - 1]?.op !== 'delete' && block.pieces[i - 1]?.op !== 'insert') stops++
  }
  return stops
}

export const Preview = memo(function Preview({ changes, copy, headingLevel }: { changes: Changes; copy: VersionHistoryCopy; headingLevel: 3 | 4 }) {
  const { blocks, properties } = changes
  const Heading = headingLevel === 3 ? 'h3' : 'h4'
  return (
    <div data-slot="version-preview" className="flex flex-col gap-3">
      {properties.length > 0 && (
        <dl
          aria-label={copy.properties}
          className="mb-1 grid grid-cols-[auto_minmax(0,1fr)] gap-y-0.5 rounded-lg border border-line-subtle bg-band p-1.5 text-ui-sm"
        >
          {properties.map(({ key, from, to }) => (
            <div key={key} data-yj-change="" tabIndex={-1} className={cn('col-span-2 grid grid-cols-subgrid items-center gap-x-4 px-1.5 py-1', stop)}>
              <dt className="text-fg-muted">{key}</dt>
              <dd className="flex min-w-0 flex-wrap items-center gap-1.5">
                {from !== undefined && (
                  <del className={delClass}>
                    <span className="sr-only">{copy.removed}: </span>
                    {from}
                  </del>
                )}
                {from !== undefined && to !== undefined && <ArrowRightIcon aria-hidden size={12} className="text-fg-subtle rtl:-scale-x-100" />}
                {to !== undefined ? (
                  <ins className={insClass}>
                    <span className="sr-only">{copy.added}: </span>
                    {to}
                  </ins>
                ) : (
                  <span className="text-fg-subtle">{copy.empty}</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {blocks.map((block) => {
        const Tag = block.type === 'heading' ? Heading : 'p'
        const whole = block.change === 'inserted' || block.change === 'deleted'
        return (
          <Tag
            key={`${block.id}-${block.change ?? 'same'}`}
            data-yj-change={whole ? '' : undefined}
            tabIndex={whole ? -1 : undefined}
            className={cn(
              block.type === 'heading'
                ? 'mt-2 text-ui-lg font-semibold tracking-tight text-fg first:mt-0'
                : 'text-ui leading-relaxed text-pretty text-fg',
              whole && cn(stop, 'relative -ms-3 border-s-2 ps-2.5', block.change === 'inserted' ? 'border-success-line' : 'border-danger-line'),
            )}
          >
            {whole ? (
              block.change === 'inserted' ? (
                <ins className={insClass}>
                  <span className="sr-only">{copy.added}: </span>
                  {block.pieces[0]!.text}
                </ins>
              ) : (
                <del className={delClass}>
                  <span className="sr-only">{copy.removed}: </span>
                  {block.pieces[0]!.text}
                </del>
              )
            ) : (
              pieces(block.pieces, copy)
            )}
          </Tag>
        )
      })}
    </div>
  )
})
