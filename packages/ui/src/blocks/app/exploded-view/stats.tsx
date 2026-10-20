'use client'

import { useId } from 'react'
import { Eyebrow } from '../../../components/ui/typography'
import { cn } from '../../../lib/utils'
import { partOf, type ExplodedViewCopy, type ExplodedViewPart, type ExplodedViewSpec, type PartId } from './data'

/* The spec sheet: six figures in mono, units small and muted, under mono
 * capital labels. Each is a button that points at its part: hover or focus
 * lights that part in the drawing (and names it over the drawing), so the
 * numbers and the picture talk about the same thing. */

export function Stats({ copy, specs, parts, lit, onPreview }: { copy: ExplodedViewCopy; specs: ExplodedViewSpec[]; parts: ExplodedViewPart[]; lit: PartId; onPreview: (part: PartId | null) => void }) {
  const hints = useId()
  return (
    <>
      <ul className="grid grid-cols-2 gap-1 sm:grid-cols-3" data-slot="device-stats">
        {specs.map((stat) => {
          const { id, part } = stat
          const on = part === lit
          return (
            <li key={id} className="min-w-0">
              <button
                type="button"
                data-part={part}
                data-lit={on || undefined}
                aria-describedby={`${hints}-${part}`}
                onPointerEnter={(e) => e.pointerType === 'mouse' && onPreview(part)}
                onPointerLeave={() => onPreview(null)}
                onFocus={() => onPreview(part)}
                onBlur={() => onPreview(null)}
                className={cn(
                  'group/stat flex w-full min-w-0 flex-col items-start gap-1.5 rounded-lg px-3 py-2.5 text-start focus-ring',
                  'transition-[background-color] yj-duration-fast ease-standard',
                  'hover:bg-band data-lit:bg-band',
                )}
              >
                <Eyebrow className="flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className={cn(
                      'size-1.5 shrink-0 rounded-full bg-line transition-[background-color] yj-duration-fast ease-standard',
                      on && 'bg-accent',
                    )}
                  />
                  {stat.label}
                </Eyebrow>
                {/* Figures read left to right on an RTL page too: "−20 to +55 °C", "2 × 2.5 GbE". */}
                <span dir="ltr" className="font-mono text-ui text-fg tabular-nums">
                  {stat.figures.map(([value, unit], i) => (
                    <span key={i} className="whitespace-nowrap">
                      {i > 0 && <span className="text-fg-muted"> · </span>}
                      {value}
                      {unit && <span className="ms-1 text-ui-sm text-fg-muted">{unit}</span>}
                    </span>
                  ))}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {/* What each figure points at, read after it. */}
      <div hidden>
        {[...new Set(specs.map((s) => s.part))].map((part) => (
          <span key={part} id={`${hints}-${part}`}>
            {copy.lights(partOf(parts, part).name)}
          </span>
        ))}
      </div>
    </>
  )
}
