'use client'

import { useId, useState, type ReactElement, type ReactNode } from 'react'
import { useYouj } from '@youj/core'
import { ChevronDownIcon, SlidersIcon } from '@youj/icons'
import { fieldControlClass } from '@youj/react/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@youj/react/components/ui/popover'
import { MenuSelect, SPEED_LABEL, TOOLBAR_MENU } from '@/components/ui/preview-controls'
import { SizeRows } from '@/components/ui/preview-size'
import { cn } from '@/lib/cn'
import type { PreviewDevice } from '@/lib/device-preview'
import { useMediaQuery } from '@/lib/use-media-query'
import { PREVIEW_SPEEDS, type PreviewMotion, type PreviewSize, type PreviewSpeed } from '@/lib/preview'

export type Device = 'desktop' | 'tablet' | 'phone'

import { ZOOMS, type Zoom } from './zoom'

export { ZOOMS, type Zoom }

/** Below `sm` the frame is already a phone's width: no viewport section. */
const PHONE = '(max-width: 639.98px)'
/** Below the breakpoint a toolbar hides its look from (`lookFrom`), the look is in here instead. */
const LOOK_HERE = { sm: PHONE, lg: '(max-width: 1023.98px)' }

/** A labelled row: the name at the start, its control at the end, one line where it fits. */
function Row({ label, children, className }: { label: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex min-h-control-xs flex-wrap items-center justify-between gap-x-4 gap-y-1.5', className)}>
      <span className="text-ui-sm text-fg-muted">{label}</span>
      <div className="ms-auto flex max-w-full min-w-0 items-center justify-end">{children}</div>
    </div>
  )
}

/** A titled run of rows, spaced from the one before it (the panel shows only the sections it has, so the first is the first drawn). */
function Section({ title, aside, children, className }: { title: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className={cn('flex flex-col gap-2 pt-3 first-of-type:pt-0', className)}>
      <div className="flex h-5 items-center justify-between gap-3">
        <h3 id={id} className="type-label">
          {title}
        </h3>
        {aside}
      </div>
      {children}
    </section>
  )
}

export interface ViewOptionsProps {
  /** The frame's look picker (theme and style), which the toolbar shows from `lookFrom` up: below that it lives here. */
  look?: ReactNode
  /** Where the toolbar starts showing the look (it hides it with `max-sm:hidden` or `max-lg:hidden`): `sm` by default, `lg` for a toolbar with more in it. */
  lookFrom?: 'sm' | 'lg'
  /** A frame that snaps to device widths (a block's or example's): its width, its readout ("1280px · 75%") and, when it zooms, its zoom. */
  viewport?: {
    device: Device
    onDevice: (device: Device) => void
    readout: string
    zoom?: { value: Zoom; onChange: (zoom: Zoom) => void; fit: number }
  }
  /** The demo's own size; absent for a demo that sizes itself (Create's). */
  size?: PreviewSize
  motion: PreviewMotion
  onMotion: (motion: PreviewMotion) => void
  /** A frame that shows either experience of the library (a docs example): Pointer or Touch. */
  input?: { value: PreviewDevice | null; onChange: (device: PreviewDevice) => void }
  /** Something here is off its default: the trigger carries a dot. */
  changed: boolean
  /** Draws the trigger another way (an island's tile): given the Popover's trigger to render through. The panel then opens above it. */
  renderTrigger?: (trigger: ReactElement) => ReactNode
}

/**
 * A preview's secondary settings in one place, so every preview toolbar on the
 * site keeps to the same essentials (its tabs, its pickers, its look, View,
 * Replay): the viewport (device width and zoom), the size the demo renders at
 * (density and scale), how it moves (speed, reduced motion) and how it's
 * operated (pointer or touch), each section only where the frame has it. The
 * kit's Popover, so on touch it's a bottom sheet, which on a phone also holds
 * the look the toolbar has no room for.
 */
export function ViewOptions({ look, lookFrom = 'sm', viewport, size, motion, onMotion, input, changed, renderTrigger }: ViewOptionsProps) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const system = useYouj().reduced
  const reduced = motion.reduced || system
  const phone = useMediaQuery(PHONE)
  const lookHere = useMediaQuery(LOOK_HERE[lookFrom])
  return (
    <Popover open={open} onOpenChange={setOpen}>
      {renderTrigger ? renderTrigger(<PopoverTrigger />) : <PopoverTrigger
        data-size="sm"
        aria-label={`View options${changed ? ', changed' : ''}`}
        title="View options"
        className={cn(fieldControlClass, 'flex w-fit shrink-0 cursor-default items-center gap-1.5 whitespace-nowrap ps-2 pe-1.5 select-none data-popup-open:border-focus', TOOLBAR_MENU)}
      >
        <SlidersIcon size={14} strokeWidth={1.75} aria-hidden className="text-fg-subtle" />
        <span className="max-md:sr-only">View</span>
        {changed && <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-accent" />}
        <ChevronDownIcon size={16} strokeWidth={1.75} active={open} aria-hidden className="text-fg-muted" />
      </PopoverTrigger>}
      <PopoverContent side={renderTrigger ? 'top' : undefined} align={renderTrigger ? 'center' : 'end'} aria-labelledby={`${id}-title`} className="w-[21rem] gap-3">
        <p id={`${id}-title`} className="sr-only">
          View options
        </p>
        {look && lookHere && <Section title="Look">{look}</Section>}
        {viewport && !phone && (
          <Section title="Viewport" aside={<span className="type-label tabular-nums">{viewport.readout}</span>}>
            <Row label="Width">
              <MenuSelect
                label="Viewport"
                value={viewport.device}
                onChange={viewport.onDevice}
                options={[
                  { value: 'desktop', label: 'Desktop' },
                  { value: 'tablet', label: 'Tablet', detail: '768px' },
                  { value: 'phone', label: 'Phone', detail: '390px' },
                ]}
              />
            </Row>
            {viewport.zoom && (
              <Row label={<span title="⌘ − and ⌘ + step through these">Zoom</span>}>
                <MenuSelect
                  label="Zoom"
                  value={viewport.zoom.value}
                  onChange={viewport.zoom.onChange}
                  options={ZOOMS.map((z) => (z === 'fit' ? { value: z, label: 'Fit', detail: `${viewport.zoom!.fit}%` } : { value: z, label: `${z}%` }))}
                />
              </Row>
            )}
          </Section>
        )}
        {size && (
          <Section title="Size">
            <SizeRows fallback={size} row={Row} />
          </Section>
        )}
        <Section title="Motion">
          <Row label="Speed">
            <MenuSelect
              label="Speed"
              disabled={reduced}
              value={reduced ? null : (`${motion.speed}` as `${PreviewSpeed}`)}
              onChange={(next) => onMotion({ speed: Number(next) as PreviewSpeed, reduced: false })}
              options={PREVIEW_SPEEDS.map((s) => ({ value: `${s}` as `${PreviewSpeed}`, label: SPEED_LABEL[s].short, detail: SPEED_LABEL[s].name }))}
            />
          </Row>
          <Row label={system ? 'Reduced by your system' : 'Reduced motion'}>
            <MenuSelect
              label="Reduced motion"
              disabled={system}
              value={reduced ? 'on' : 'off'}
              onChange={(on) => onMotion({ speed: 1, reduced: on === 'on' })}
              options={[
                { value: 'off', label: 'Off' },
                { value: 'on', label: 'On' },
              ]}
            />
          </Row>
        </Section>
        {input && (
          <Section title="Device">
            <Row label="Input">
              <MenuSelect
                label="Device preview"
                value={input.value}
                onChange={input.onChange}
                options={[
                  { value: 'pointer', label: 'Pointer' },
                  { value: 'touch', label: 'Touch' },
                ]}
              />
            </Row>
          </Section>
        )}
      </PopoverContent>
    </Popover>
  )
}
