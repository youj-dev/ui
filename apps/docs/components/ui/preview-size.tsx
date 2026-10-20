'use client'

import { type ReactNode } from 'react'
import { RulerIcon } from '@youj/icons/components/youj/icons/ruler'
import type { YoujScaling } from '@youj/core'
import { DENSITY_OPTIONS, SCALINGS } from '@youj/react/docs/create/size-url'
import { MenuSelect } from '@/components/ui/preview-controls'
import { type PreviewSize } from '@/lib/preview'
import { setPreviewSize, usePreviewSize } from '@/lib/preview-size'

/* The Size control every preview's View options holds (components/showcase/view-options): the layout density (Standard or
 * Compact) and the UI scale (75% to 120%) the preview renders at, what an app
 * sets on its root YoujProvider. A pick re-renders the preview at once and is
 * the reader's, shared by every preview and remembered (lib/preview-size);
 * Reset returns each preview to its own default. */

const DENSITY_CHOICES = DENSITY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))

/** What a preview shows, and whether the reader has picked. */
function useSizeView(fallback: PreviewSize) {
  const item = usePreviewSize(fallback)
  return { density: item.size.density, scaling: item.size.scaling, picked: item.picked }
}

/**
 * The Size control as View options holds it: a Density row and a Scale row, each a menu, each with `row`
 * around it.
 */
export function SizeRows({
  fallback,
  row: Row,
}: {
  fallback: PreviewSize
  row: (props: { label: string; children: ReactNode }) => ReactNode
}) {
  const view = useSizeView(fallback)
  const scaling = view.scaling ?? fallback.scaling
  return (
    <>
      <Row label="Density">
        <MenuSelect label="Density" options={DENSITY_CHOICES} value={view.density} onChange={(density) => setPreviewSize({ density })} />
      </Row>
      <Row label="Scale">
        <MenuSelect
          label="Scale"
          icon={<RulerIcon size={14} strokeWidth={1.75} aria-hidden className="text-fg-subtle" />}
          options={SCALINGS.map((s) => ({ value: s, label: s, detail: s === fallback.scaling ? 'Default' : undefined }))}
          value={scaling}
          onChange={(next) => setPreviewSize({ scaling: next as YoujScaling })}
        />
      </Row>
    </>
  )
}
