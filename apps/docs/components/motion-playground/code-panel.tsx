'use client'

import { useMemo, useState } from 'react'
import { lines as highlight } from '@/components/create/highlight'
import { InlineCode } from '@/components/docs/inline-code'
import { CopyButton } from '@/components/ui/copy-button'
import { cn } from '@/lib/cn'
import type { Snippet } from './code'

/* The code a view takes, beside what each part of it does. A note's number
 * sits in the gutter on the first line it explains; pointing at a note or at
 * one of its lines lights the other, so the prose and the code read together.
 * The gutter stays put while long lines scroll. On a phone the notes follow
 * the code. */

export function CodePanel({ snippet }: { snippet: Snippet }) {
  const [hot, setHot] = useState<number | null>(null)
  const rows = useMemo(() => highlight(snippet.code.replace(/\n$/, '')), [snippet.code])
  const noteAt = (line: number) => snippet.notes.findIndex((n) => line >= n.from && line <= n.to)

  return (
    <div className="grid border-t border-line lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <div className="min-w-0 bg-canvas">
        <div className="flex h-11 items-center gap-2 border-b border-line ps-4 pe-1.5">
          <span className="type-label">Code</span>
          <span className="min-w-0 flex-1 truncate type-small text-fg-muted">{snippet.file}</span>
          <CopyButton value={snippet.code} label="Copy code" />
        </div>
        <pre
          // A named region: it takes focus so the keyboard can scroll it, and a <pre> alone can't carry a name.
          role="region"
          tabIndex={0}
          aria-label={`${snippet.file}, the code for this view`}
          className="overflow-x-auto py-3 code-text yj-scrollbar focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none focus-visible:ring-inset"
        >
          <code className="grid w-max min-w-full">
            {rows.map((row, i) => {
              const line = i + 1
              const note = noteAt(line)
              const first = note >= 0 && snippet.notes[note]!.from === line
              const lit = note >= 0 && note === hot
              return (
                <span
                  key={i}
                  onPointerEnter={note >= 0 ? () => setHot(note) : undefined}
                  onPointerLeave={note >= 0 ? () => setHot(null) : undefined}
                  className={cn('grid grid-cols-[3.75rem_max-content] pe-6 transition-colors yj-duration-fast ease-standard', lit && 'bg-accent-subtle')}
                >
                  {/* The gutter, pinned while the code scrolls: the note a line starts, then its number. */}
                  <span
                    aria-hidden
                    className={cn(
                      'sticky start-0 flex items-center justify-between gap-1 bg-canvas ps-2.5 pe-3 text-[11px] text-fg-subtle tabular-nums select-none',
                      lit && 'bg-accent-subtle shadow-[inset_2px_0_0_var(--color-accent)] rtl:shadow-[inset_-2px_0_0_var(--color-accent)]',
                    )}
                  >
                    {first ? <NoteMark index={note} lit={lit} /> : <span />}
                    {line}
                  </span>
                  <span className="text-(--code-fg)">
                    {row.length ? row.map((piece, j) => (piece.color ? <span key={j} style={{ color: piece.color }}>{piece.text}</span> : piece.text)) : ' '}
                  </span>
                </span>
              )
            })}
          </code>
        </pre>
      </div>

      <div className="min-w-0 border-t border-line bg-surface lg:border-t-0 lg:border-s">
        <div className="flex h-11 items-center border-b border-line px-4">
          <h2 className="type-label">How it works</h2>
        </div>
        <ol className="flex flex-col gap-0.5 p-2">
          {snippet.notes.map((note, i) => (
            <li
              key={`${note.from}-${i}`}
              onPointerEnter={() => setHot(i)}
              onPointerLeave={() => setHot(null)}
              className={cn(
                'flex gap-3 rounded-lg px-2.5 py-2 text-[13px] leading-relaxed text-fg-muted transition-colors yj-duration-fast ease-standard',
                hot === i && 'bg-hover text-fg',
              )}
            >
              <NoteMark index={i} lit={hot === i} className="mt-[3px]" />
              <span className="min-w-0 flex-1">
                <InlineCode text={note.text} />
                <span className="ms-1.5 font-mono text-[10.5px] whitespace-nowrap text-fg-muted">
                  <span className="sr-only">Lines </span>
                  <span aria-hidden>L</span>
                  {note.from === note.to ? note.from : `${note.from}–${note.to}`}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

function NoteMark({ index, lit, className }: { index: number; lit: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-[1.125rem] shrink-0 place-items-center rounded-[5px] border font-sans text-[10px] leading-none font-medium tabular-nums transition-colors yj-duration-fast ease-standard',
        lit ? 'border-accent bg-accent text-on-accent' : 'border-line-strong bg-surface text-fg',
        className,
      )}
    >
      {index + 1}
    </span>
  )
}
