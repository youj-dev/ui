'use client'

import type { ReactNode } from 'react'
import { FlipHorizontalIcon, FlipVerticalIcon, RotateCcwIcon, RotateCwIcon, ZoomInIcon, ZoomOutIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { SegmentedControl, SegmentedControlItem } from '../../../components/ui/segmented-control'
import { Slider } from '../../../components/ui/slider'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../components/ui/tooltip'
import type { ImageEditorAspect, ImageEditorCopy, ImageEditorEdit } from './data'
import { splitRotation } from './geometry'
import { numberFormat } from '../../../lib/utils'

/* The panel's tools: the crop (each choice drawn at its own ratio), the
 * straighten slider in degrees (±45, a tick at level), turn and flip, and
 * zoom. They commit to the edit, and the stage and previews glide to it. */

const MAX_ZOOM = 8

interface ControlsProps {
  edit: ImageEditorEdit
  aspects: ImageEditorAspect[]
  copy: ImageEditorCopy
  onAspect: (id: string) => void
  onStraighten: (degrees: number) => void
  onZoom: (zoom: number) => void
  onTurn: (quarters: number) => void
  onFlip: (axis: 'x' | 'y') => void
}

function Tool({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline" size="icon-sm" aria-label={label} onClick={onClick} />}>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

/** A crop's shape, drawn small: a rectangle at its ratio inside a 16px square. */
function Shape({ ratio }: { ratio: number | 'original' }) {
  const r = ratio === 'original' ? 1.4 : ratio
  const w = r >= 1 ? 14 : 14 * r
  const h = r >= 1 ? 14 / r : 14
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="size-4 shrink-0">
      <rect
        x={(16 - w) / 2}
        y={(16 - h) / 2}
        width={w}
        height={h}
        rx="1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeDasharray={ratio === 'original' ? '2 1.5' : undefined}
      />
    </svg>
  )
}

const label = 'text-ui-sm font-medium text-fg-muted'

export function Controls({ edit, aspects, copy, onAspect, onStraighten, onZoom, onTurn, onFlip }: ControlsProps) {
  const { straighten } = splitRotation(edit.rotation)
  const degrees = numberFormat(copy.locale, { maximumFractionDigits: 1, signDisplay: 'exceptZero' }).format(straighten)
  const percent = numberFormat(copy.locale, { style: 'percent', maximumFractionDigits: 0 })
  return (
    <div className="flex flex-col gap-5">
      {aspects.length > 1 && (
        <section className="flex flex-col gap-2">
          <h3 className={label}>{copy.crop}</h3>
          {/* Two lines a choice (its shape over its name), so the track grows to fit them. */}
          {/* shape: two lines a choice, so the track grows to fit them: `!` frees the height the control fixes */}
          <SegmentedControl variant="pill" aria-label={copy.crop} value={edit.aspect} onValueChange={onAspect} className="h-auto! w-full">
            {aspects.map((a) => (
              <SegmentedControlItem key={a.id} value={a.id} className="min-w-0 flex-1 flex-col gap-1 px-1 py-1.5 text-ui-xs">
                <Shape ratio={a.ratio} />
                <span className="max-w-full truncate">{a.label}</span>
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        </section>
      )}
      <section className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h3 className={label}>{copy.straighten}</h3>
          <output aria-hidden className="text-ui-sm text-fg tabular-nums">
            {copy.degrees(degrees)}
          </output>
        </div>
        <div className="relative">
          {/* Level, marked under the track's middle. */}
          <span aria-hidden className="absolute start-1/2 top-0 h-full w-px bg-line-strong" />
          <Slider
            aria-label={copy.straighten}
            // Level is the middle, not an end: no fill from the start.
            className="[&_[data-slot=slider-range]]:bg-transparent"
            min={-45}
            max={45}
            step={0.5}
            value={straighten}
            onValueChange={(next) => onStraighten(Array.isArray(next) ? next[0]! : next)}
            getAriaValueText={(_, v) => copy.degrees(numberFormat(copy.locale, { maximumFractionDigits: 1 }).format(v))}
          />
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <Tool label={copy.rotateLeft} onClick={() => onTurn(-1)}>
            <RotateCcwIcon />
          </Tool>
          <Tool label={copy.rotateRight} onClick={() => onTurn(1)}>
            <RotateCwIcon />
          </Tool>
          <span aria-hidden className="mx-1 h-4 w-px bg-line" />
          <Tool label={copy.flipHorizontal} onClick={() => onFlip('x')}>
            <FlipHorizontalIcon />
          </Tool>
          <Tool label={copy.flipVertical} onClick={() => onFlip('y')}>
            <FlipVerticalIcon />
          </Tool>
        </div>
      </section>
      <section className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h3 className={label}>{copy.zoom}</h3>
          <output aria-hidden className="text-ui-sm text-fg tabular-nums">
            {percent.format(edit.zoom)}
          </output>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-xs" aria-label={copy.zoomOut} disabled={edit.zoom <= 1} onClick={() => onZoom(edit.zoom / 1.25)}>
            <ZoomOutIcon />
          </Button>
          <Slider
            aria-label={copy.zoom}
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={edit.zoom}
            onValueChange={(next) => onZoom(Array.isArray(next) ? next[0]! : next)}
            getAriaValueText={(_, v) => percent.format(v)}
          />
          <Button variant="ghost" size="icon-xs" aria-label={copy.zoomIn} disabled={edit.zoom >= MAX_ZOOM} onClick={() => onZoom(edit.zoom * 1.25)}>
            <ZoomInIcon trigger="none" />
          </Button>
        </div>
      </section>
    </div>
  )
}
