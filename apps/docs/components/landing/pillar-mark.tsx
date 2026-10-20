'use client'

import { pillarGlyph } from '@/components/site/pillar-icons'
import { cn } from '@/lib/cn'
import type { PillarId } from '@/lib/nav'

/** A part's glyph on a small keyline tile. It plays when its `data-yj-trigger` group is hovered. */
export function PillarMark({ id, className }: { id: PillarId; className?: string }) {
  const Glyph = pillarGlyph[id]
  return (
    <span aria-hidden className={cn('grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-canvas text-fg', className)}>
      <Glyph size={18} strokeWidth={1.5} />
    </span>
  )
}
