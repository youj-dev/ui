'use client'

import { useId, useMemo, type ReactNode } from 'react'
import { deriveTheme, palettes, styles, type ControlSize, type PaletteId, type RadiusScale, type StyleId } from '@youj/core'
import { CopyIcon, MoonIcon, RotateCcwIcon, SunIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { AsyncButton } from '../../../components/ui/async-button'
import { ColorPicker } from '../../../components/ui/color-picker'
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group'
import { SegmentedControl, SegmentedControlItem } from '../../../components/ui/segmented-control'
import { Eyebrow } from '../../../components/ui/typography'
import { cn } from '../../../lib/utils'
import { COPY, CONTROL_SIZES, RADII, sideOf, type Mode, type Recipe } from './data'

/* The builder's controls, composed from public parts: palettes as cards
 * drawn in their own colors, a segmented control for the style, the
 * palettes' accents as swatches plus a color picker, and segmented controls
 * for corners, control size and mode. Each group is named by its label. */

interface ControlsProps {
  recipe: Recipe
  onChange: (change: Partial<Recipe>) => void
  onPalette: (id: PaletteId) => void
  onStyle: (id: StyleId) => void
  onReset: () => void
  onCopy: () => Promise<unknown>
}

function Row({ label, children }: { label: (id: string) => ReactNode; children: (id: string) => ReactNode }) {
  const id = useId()
  return (
    <div className="flex flex-col gap-2">
      {label(id)}
      {children(id)}
    </div>
  )
}

const Label = ({ id, children }: { id: string; children: ReactNode }) => (
  <Eyebrow id={id} render={<p />}>
    {children}
  </Eyebrow>
)

/** A corner drawn at a radius; intrinsic shapes, so fixed sizes. */
const CORNER: Record<RadiusScale, string> = { none: 'rounded-none', sm: 'rounded-ss-[2px]', md: 'rounded-ss-[4px]', lg: 'rounded-ss-[6px]', xl: 'rounded-ss-[--spacing(2)]', full: 'rounded-ss-[14px]' }

export function Controls({ recipe, onChange, onPalette, onStyle, onReset, onCopy }: ControlsProps) {
  const derived = useMemo(() => new Map(palettes.map((t) => [t.id, deriveTheme(t)])), [])
  const mode = recipe.mode
  const font = styles.find((s) => s.id === recipe.style)?.fonts?.sans

  return (
    <div className="flex flex-col gap-5">
      <Row label={(id) => <Label id={id}>{COPY.palette}</Label>}>
        {(id) => (
          <RadioGroup aria-labelledby={id} value={recipe.palette} onValueChange={(next) => onPalette(next as PaletteId)} className="grid grid-cols-2 gap-2">
            {palettes.map((t) => {
              const p = derived.get(t.id)![mode]
              return (
                <label
                  key={t.id}
                  className={cn(
                    'relative flex cursor-pointer flex-col gap-1.5 rounded-lg border border-line p-1.5 transition-[border-color,box-shadow] yj-duration-fast ease-standard',
                    'hover:border-line-control has-data-checked:border-accent has-data-checked:ring-1 has-data-checked:ring-accent',
                    'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus',
                  )}
                >
                  <RadioGroupItem value={t.id} className="sr-only" />
                  <span aria-hidden className="flex h-9 items-center justify-between rounded-sm border px-2" style={{ background: p.canvas, borderColor: p.line, color: p.fg, fontFamily: font }}>
                    <span className="text-ui font-semibold">Aa</span>
                    <span className="size-3 rounded-full" style={{ background: p.accent }} />
                  </span>
                  <span className="px-0.5 text-ui-sm font-medium text-fg">{t.name}</span>
                </label>
              )
            })}
          </RadioGroup>
        )}
      </Row>

      <Row label={(id) => <Label id={id}>{COPY.style}</Label>}>
        {(id) => (
          <SegmentedControl aria-labelledby={id} value={recipe.style} onValueChange={(next) => onStyle(next as StyleId)} className="w-full">
            {styles.map((s) => (
              <SegmentedControlItem key={s.id} value={s.id} className="flex-1 px-1">
                {s.name}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        )}
      </Row>

      <Row label={(id) => <Label id={id}>{COPY.accent}</Label>}>
        {(id) => (
          <div className="flex flex-col gap-3">
            <RadioGroup aria-labelledby={id} value={recipe.accent} onValueChange={(next) => onChange({ accent: next as PaletteId })} className="flex flex-wrap gap-2.5">
              {palettes.map((t) => (
                <RadioGroupItem
                  key={t.id}
                  value={t.id}
                  aria-label={`${t.name} accent`}
                  className="size-6 ring-offset-2 ring-offset-surface data-checked:ring-2 data-checked:ring-fg [&>span]:hidden"
                  style={{ background: sideOf(t.accent, mode), borderColor: 'transparent' }}
                />
              ))}
            </RadioGroup>
            <ColorPicker
              aria-label={COPY.custom}
              value={recipe.custom}
              onValueChange={(custom) => onChange({ custom, accent: 'custom' })}
              swatches={[]}
              className={cn('min-w-0', recipe.accent === 'custom' && 'border-fg')}
            />
          </div>
        )}
      </Row>

      <Row label={(id) => <Label id={id}>{COPY.radius}</Label>}>
        {(id) => (
          <SegmentedControl aria-labelledby={id} value={recipe.radius} onValueChange={(radius) => onChange({ radius: radius as RadiusScale })} className="w-full">
            {RADII.map((r) => (
              <SegmentedControlItem key={r.value} value={r.value} aria-label={r.name} className="flex-1">
                <span aria-hidden className={cn('size-3.5 translate-x-px translate-y-px border-s-[1.5px] border-t-[1.5px] border-current', CORNER[r.value])} />
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        )}
      </Row>

      <Row label={(id) => <Label id={id}>{COPY.controlSize}</Label>}>
        {(id) => (
          <SegmentedControl aria-labelledby={id} value={recipe.controlSize} onValueChange={(controlSize) => onChange({ controlSize: controlSize as ControlSize })} className="w-full">
            {CONTROL_SIZES.map((d) => (
              <SegmentedControlItem key={d.value} value={d.value} className="flex-1">
                {d.label}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        )}
      </Row>

      <div>
        <Row label={(id) => <Label id={id}>{COPY.mode}</Label>}>
          {(id) => (
            <SegmentedControl aria-labelledby={id} value={mode} onValueChange={(next) => onChange({ mode: next as Mode })} className="w-full">
              <SegmentedControlItem value="light" aria-label={COPY.light} className="flex-1">
                <SunIcon size={15} strokeWidth={1.75} />
              </SegmentedControlItem>
              <SegmentedControlItem value="dark" aria-label={COPY.dark} className="flex-1">
                <MoonIcon size={15} strokeWidth={1.75} />
              </SegmentedControlItem>
            </SegmentedControl>
          )}
        </Row>
      </div>

      <div className="flex items-center gap-2 border-t border-line pt-4">
        <Button variant="ghost" onClick={onReset} className="me-auto">
          <RotateCcwIcon size={15} strokeWidth={1.75} />
          {COPY.reset}
        </Button>
        <AsyncButton variant="secondary" onAction={onCopy} successLabel={COPY.copied}>
          <CopyIcon size={15} strokeWidth={1.75} />
          {COPY.copy}
        </AsyncButton>
      </div>
    </div>
  )
}
