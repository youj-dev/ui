'use client'

import type { CSSProperties } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../components/ui/tooltip'
import { cn } from '../../../lib/utils'
import type { Annotation, AnnotationTone } from './data'

/* The annotation lane over the plot: one mark per annotated bucket, a ring
 * in the annotation's tone over a dashed guide (the plot draws the guide).
 * Each mark is a button named with what happened, the day and the
 * sentence on it. Pointing at it or focusing it puts the crosshair on its
 * day, so the header reads that day with the note; its tip (pointer and
 * keyboard) shows the sentence; pressing it calls `onSelect`. Two notes on
 * one bucket share a mark and are named together. */

const TONE: Record<AnnotationTone, string> = {
  neutral: 'var(--color-fg-muted)',
  accent: 'var(--color-accent)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
  info: 'var(--color-info)',
}

interface AnnotationsProps {
  annotations: Map<number, Annotation[]>
  label: string
  active: number | null
  /** Where bucket `i` sits across the plot, in percent. */
  xOf: (i: number) => number
  dateOf: (i: number) => string
  onActiveChange: (index: number | null) => void
  onSelect?: (annotation: Annotation) => void
  style: CSSProperties
}

function Annotations({ annotations, label, active, xOf, dateOf, onActiveChange, onSelect, style }: AnnotationsProps) {
  return (
    <div role="group" aria-label={label} className="absolute" style={style}>
      {[...annotations.entries()].map(([i, notes]) => {
        const first = notes[0]!
        const name = notes.map((a) => `${a.label}, ${dateOf(i)}${a.description ? `: ${a.description}` : ''}`).join('; ')
        return (
          <Tooltip key={i}>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  aria-label={name}
                  data-slot="metric-chart-annotation"
                  data-active={active === i || undefined}
                  className={cn(
                    'group/note absolute top-0.5 grid size-4 -translate-x-1/2 place-items-center rounded-full border-[1.5px] border-(--note) bg-surface outline-hidden focus-ring',
                    'transition-[scale] yj-duration-fast ease-standard hover:scale-110 data-active:scale-110 reduced:hover:scale-100 reduced:data-active:scale-100',
                    // A 24px target around the 16px mark.
                    'before:absolute before:-inset-1',
                  )}
                  style={{ left: `${xOf(i)}%`, '--note': TONE[first.tone ?? 'neutral'] } as CSSProperties}
                  onPointerEnter={() => onActiveChange(i)}
                  onFocus={() => onActiveChange(i)}
                  onBlur={() => onActiveChange(null)}
                  onClick={() => notes.forEach((a) => onSelect?.(a))}
                >
                  <span className="size-1.5 rounded-full bg-(--note) transition-[scale] yj-duration-fast ease-standard group-hover/note:scale-150 group-data-active/note:scale-150 reduced:scale-100" />
                </button>
              }
            />
            <TooltipContent side="top" className="max-w-60 flex-col items-start gap-0.5 py-1.5">
              {notes.map((a) => (
                <span key={a.id} className="flex flex-col">
                  <span>
                    {a.label} <span className="font-normal text-fg-muted">· {dateOf(i)}</span>
                  </span>
                  {a.description && <span className="font-normal text-fg-muted">{a.description}</span>}
                </span>
              ))}
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}

export { Annotations }
