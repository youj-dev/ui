'use client'

import { RotateCcwIcon } from '@youj/icons'
import type { YoujDensity, YoujScaling } from '@youj/core/lib/youj/provider'
import { Button } from '../../components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components/ui/tooltip'
import { InspectorSection, InspectorSelect, type InspectorOption } from '../inspector'
import { DEFAULT_SIZE, DENSITY_OPTIONS, SCALINGS, sameSize, sizeLabel, type SizeConfig } from './size-url'

const DENSITIES: InspectorOption<YoujDensity>[] = DENSITY_OPTIONS.map((o) => ({ ...o, detail: o.value === DEFAULT_SIZE.density ? 'default' : undefined }))

const SCALES: InspectorOption<YoujScaling>[] = SCALINGS.map((scaling) => ({
  value: scaling,
  label: scaling,
  detail: scaling === DEFAULT_SIZE.scaling ? 'default' : undefined,
}))

/**
 * Create's size: the layout density and the UI scale the exported root
 * YoujProvider sets (`density`, `scaling`), as two inspector rows under a
 * "Size" title, with a reset to the standard size (roomy, 100%) once either
 * moved. Controlled: the value lives in Create's state and link (size-url.ts),
 * and the preview and export read it there. The density row is "Layout"
 * (its options Standard and Compact), since the theme beside it has a Control
 * size of its own, the control height.
 */
export function SizeControl({ value, onChange, className }: { value: SizeConfig; onChange: (size: SizeConfig) => void; className?: string }) {
  const edited = !sameSize(value, DEFAULT_SIZE)
  const reset = `Reset to the default size (${sizeLabel(DEFAULT_SIZE)})`
  return (
    <InspectorSection
      title="Size"
      className={className}
      action={
        edited ? (
          <Tooltip>
            <TooltipTrigger render={<Button variant="ghost" size="icon-xs" aria-label={reset} onClick={() => onChange(DEFAULT_SIZE)} className="size-6 shrink-0 text-fg-muted" />}>
              <RotateCcwIcon size={13} />
            </TooltipTrigger>
            <TooltipContent>{reset}</TooltipContent>
          </Tooltip>
        ) : undefined
      }
    >
      <InspectorSelect label="Layout" value={value.density} options={DENSITIES} rich onChange={(density) => onChange({ ...value, density })} />
      <InspectorSelect label="Scale" value={value.scaling} options={SCALES} onChange={(scaling) => onChange({ ...value, scaling })} />
    </InspectorSection>
  )
}
