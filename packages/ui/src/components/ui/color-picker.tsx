'use client'

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import { PipetteIcon } from '@youj/icons/components/youj/icons/pipette'
import { isPerMode, palettes } from '@youj/core'
import { SlidingIndicator } from '@youj/motion'
import { ChevronDownIcon } from '@youj/icons/components/youj/icons/chevron-down'
import { useYouj } from '@youj/core/lib/youj/provider'
import { useComponentLabels } from '@youj/core/labels'
import { colorPickerLabels } from '@youj/core/labels'
import { cn } from '../../lib/utils'
import { Button } from './button'
import { fieldControlClass } from './input'
import { InputGroup, InputGroupAddon, InputGroupInput } from './input-group'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { SHEET_NO_DRAG, useSheetPresentation, type OverlayPresentation } from './presentation'
import { Slider } from './slider'

/* A color, picked in a popover: a saturation/brightness area, a hue slider,
 * hex and OKLCH fields, swatches (the theme presets' accents by default) and
 * the browser's eyedropper where it exists.
 * - The area is one focusable thumb (role="slider", valuetext naming both
 *   axes): drag or click anywhere, arrows step saturation (←→) and brightness
 *   (↑↓), Shift for 10. The thumb tracks the pointer 1:1 and glides on the
 *   fast token when the color changes from elsewhere (a swatch, a field).
 * - The hue is the youj Slider on a spectrum track.
 * - The fields commit on Enter or blur; something unreadable is marked
 *   invalid and put back on blur.
 * - The selected swatch is ringed by a SlidingIndicator that glides between
 *   swatches on the smooth spring.
 * Color is held as HSV, so the hue survives grays and black. Reduced motion:
 * the thumb and the ring jump.
 *
 * On touch the same picker is a bottom sheet (Popover's sheet): the area is
 * taller and its thumb bigger, swatches are 44px, fields take 16px type. The
 * area and the hue slider are marked `data-sheet-no-drag`, so dragging the
 * color down never pulls the sheet away; the handle, the fields and the gaps
 * still do. `presentation="popover"` keeps the popover on touch; "sheet"
 * forces the sheet. */

type Rgb = [number, number, number]
interface Hsv {
  h: number
  s: number
  v: number
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

function hsvToRgb({ h, s, v }: Hsv): Rgb {
  const f = (n: number) => {
    const k = (n + h / 60) % 6
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1))
  }
  return [f(5), f(3), f(1)]
}

function rgbToHsv([r, g, b]: Rgb, hue = 0): Hsv {
  const max = Math.max(r, g, b)
  const d = max - Math.min(r, g, b)
  let h = hue
  if (d > 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6)
    else if (max === g) h = 60 * ((b - r) / d + 2)
    else h = 60 * ((r - g) / d + 4)
  }
  return { h: (h + 360) % 360, s: max === 0 ? 0 : d / max, v: max }
}

function rgbToHex(rgb: Rgb) {
  return '#' + rgb.map((c) => Math.round(clamp01(c) * 255).toString(16).padStart(2, '0')).join('')
}

function hexToRgb(hex: string): Rgb | null {
  const m = hex.trim().replace(/^#/, '').match(/^([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (!m) return null
  const h = m[1]!.length === 3 ? [...m[1]!].map((c) => c + c).join('') : m[1]!
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as Rgb
}

/** sRGB → OKLCH [l, c, h]. */
function rgbToOklch(rgb: Rgb): [number, number, number] {
  const [r, g, b] = rgb.map(toLinear) as Rgb
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const C = Math.hypot(A, B)
  return [L, C, C < 1e-4 ? 0 : ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360]
}

/** OKLCH → sRGB, clipped to the gamut. */
function oklchToRgb([L, C, H]: [number, number, number]): Rgb {
  const a = C * Math.cos((H * Math.PI) / 180)
  const b = C * Math.sin((H * Math.PI) / 180)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((c) => clamp01(toGamma(clamp01(c)))) as Rgb
}

/** Bare channels ("0.54 0.25 268") or the CSS function, lightness as a number or a percentage → [l, c, h]. */
function parseOklch(text: string): [number, number, number] | null {
  const body = text.trim().replace(/^oklch\(|\)$/gi, '')
  const parts = body.split(/[\s,/]+/).filter(Boolean)
  if (parts.length < 3) return null
  const l = parts[0]!.endsWith('%') ? parseFloat(parts[0]!) / 100 : parseFloat(parts[0]!)
  const c = parts[1]!.endsWith('%') ? (parseFloat(parts[1]!) / 100) * 0.4 : parseFloat(parts[1]!)
  const h = parseFloat(parts[2]!)
  if ([l, c, h].some((n) => Number.isNaN(n)) || l < 0 || l > 1 || c < 0) return null
  return [l, c, h]
}

const round = (n: number, digits: number) => Number(n.toFixed(digits))
const oklchText = ([l, c, h]: [number, number, number]) => `${round(l, 3)} ${round(c, 3)} ${round(h, 1)}`
const oklchCss = (rgb: Rgb) => `oklch(${oklchText(rgbToOklch(rgb))})` // youj-allow: formats the picked color

/** Reads a hex or OKLCH color into sRGB. */
function readColor(text: string): Rgb | null {
  const hex = hexToRgb(text)
  if (hex) return hex
  const lch = parseOklch(text)
  return lch ? oklchToRgb(lch) : null
}

interface Swatch {
  value: string
  label: string
}

/** The palettes' accents; for a palette that tunes its accent per mode, the side for `mode`. */
const presetSwatches = (name: (theme: string) => string, mode: 'light' | 'dark' = 'light'): Swatch[] =>
  palettes.map((t) => ({ value: isPerMode(t.accent) ? t.accent[mode] : (t.accent ?? ''), label: name(t.name) }))

interface ColorPickerProps {
  /** A hex or OKLCH color string. */
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** What onValueChange reports. Default 'hex'. */
  format?: 'hex' | 'oklch'
  /** Default: the theme presets' accents. Pass [] for none. */
  swatches?: Swatch[]
  disabled?: boolean
  /** Names the trigger. Default 'Color'. */
  'aria-label'?: string
  id?: string
  className?: string
  /** `auto` (the default) is a popover under a pointer and a bottom sheet on touch; force either one. */
  presentation?: OverlayPresentation
  /** The trigger is the swatch alone, for a color that sits inside another control (ColorOpacityField). The hex is still in its name. */
  swatchOnly?: boolean
}

const noDrag = { [SHEET_NO_DRAG]: '' }

function ColorPicker({
  value: valueProp,
  defaultValue = palettes[0].accent.light,
  onValueChange,
  format = 'hex',
  swatches: swatchesProp,
  disabled,
  'aria-label': labelProp,
  id,
  className,
  presentation = 'auto',
  swatchOnly,
}: ColorPickerProps) {
  const labels = useComponentLabels(colorPickerLabels)
  const sheet = useSheetPresentation(presentation)
  const label = labelProp ?? labels.colour
  const swatches = swatchesProp ?? presetSwatches(labels.accentSwatch)
  const [hsv, setHsvState] = useState<Hsv>(() => rgbToHsv(readColor(valueProp ?? defaultValue) ?? [0, 0, 0]))
  const rgb = hsvToRgb(hsv)
  const hex = rgbToHex(rgb)

  // Follow a controlled value, keeping our hue (and saturation at black) when it names the color we have.
  useEffect(() => {
    if (valueProp === undefined) return
    const next = readColor(valueProp)
    if (!next) return
    setHsvState((prev) => (rgbToHex(next) === rgbToHex(hsvToRgb(prev)) ? prev : rgbToHsv(next, prev.h)))
  }, [valueProp])

  const setHsv = (next: Hsv) => {
    setHsvState(next)
    const out = hsvToRgb(next)
    onValueChange?.(format === 'oklch' ? oklchCss(out) : rgbToHex(out))
  }
  const setRgb = (next: Rgb) => setHsv(rgbToHsv(next, hsv.h))

  return (
    <Popover>
      <PopoverTrigger
        id={id}
        data-slot="color-picker-trigger"
        disabled={disabled}
        aria-label={`${label}, ${hex}`}
        className={cn(
          swatchOnly
            ? 'inline-flex size-control-sm shrink-0 items-center justify-center own:rounded-sm focus-ring disabled:cursor-not-allowed disabled:opacity-50'
            : [fieldControlClass, 'inline-flex h-control w-40 items-center gap-2 own:ps-1.5 own:pe-2 text-start own:data-popup-open:border-focus'],
          className,
        )}
      >
        <span
          aria-hidden
          className="size-5 shrink-0 rounded-sm shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-fg)_12%,transparent)]"
          style={{ backgroundColor: hex }}
        />
        {!swatchOnly && (
          <>
            <span className="flex-1 truncate own:font-mono own:text-ui-sm own:uppercase">{hex}</span>
            <ChevronDownIcon size={14} strokeWidth={1.75} className="own:text-fg-muted" />
          </>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" presentation={presentation} aria-label={label} className={sheet ? 'gap-4' : 'w-72 gap-3 own:p-3'}>
        <ColorArea hsv={hsv} onChange={setHsv} />
        <div className="own:flex items-center gap-2">
          <Slider
            {...noDrag}
            aria-label={labels.hue}
            min={0}
            max={359}
            value={Math.round(hsv.h)}
            onValueChange={(h) => setHsv({ ...hsv, h: Array.isArray(h) ? h[0]! : h })}
            format={{ style: 'unit', unit: 'degree' }}
            style={{ '--yj-thumb': rgbToHex(hsvToRgb({ h: hsv.h, s: 1, v: 1 })) } as CSSProperties}
            className={cn(
              '[&_[data-slot=slider-track]]:h-2.5 [&_[data-slot=slider-range]]:hidden',
              '[&_[data-slot=slider-track]]:bg-[linear-gradient(to_right,red,yellow,lime,cyan,blue,magenta,red)]',
              '[&_[data-slot=slider-thumb]>span]:border-[white] [&_[data-slot=slider-thumb]>span]:bg-(--yj-thumb)',
            )}
          />
          <EyeDropperButton onPick={setRgb} />
        </div>
        <ColorFields rgb={rgb} onCommit={setRgb} />
        {swatches.length > 0 && (
          <div role="group" aria-label={labels.swatches} className="relative isolate own:flex flex-wrap gap-1.5 touch:gap-1">
            {swatches.map((swatch) => {
              const swatchRgb = readColor(swatch.value)
              const swatchHex = swatchRgb ? rgbToHex(swatchRgb) : undefined
              return (
                <button
                  key={swatch.value}
                  type="button"
                  aria-label={swatch.label}
                  aria-pressed={swatchHex === hex}
                  onClick={() => swatchRgb && setRgb(swatchRgb)}
                  className="grid size-7 place-items-center rounded-md focus-ring touch:size-11"
                >
                  <span
                    className="size-5 rounded-sm shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-fg)_12%,transparent)] touch:size-8 touch:rounded-md"
                    style={{ backgroundColor: swatchHex }}
                  />
                </button>
              )
            })}
            <SlidingIndicator
              match='[aria-pressed="true"]'
              className="own:rounded-md own:bg-transparent own:shadow-[inset_0_0_0_2px_var(--color-fg)]"
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

function ColorArea({ hsv, onChange }: { hsv: Hsv; onChange: (hsv: Hsv) => void }) {
  const k = useYouj()
  const labels = useComponentLabels(colorPickerLabels)
  const area = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const pure = rgbToHex(hsvToRgb({ h: hsv.h, s: 1, v: 1 }))

  const pick = (event: PointerEvent<HTMLDivElement>) => {
    const r = area.current!.getBoundingClientRect()
    onChange({ ...hsv, s: clamp01((event.clientX - r.left) / r.width), v: clamp01(1 - (event.clientY - r.top) / r.height) })
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 0.1 : 0.01
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl'
    const dx = { ArrowLeft: -step, ArrowRight: step }[event.key as 'ArrowLeft'] ?? 0
    const dy = { ArrowUp: step, ArrowDown: -step }[event.key as 'ArrowUp'] ?? 0
    if (!dx && !dy) return
    event.preventDefault()
    onChange({ ...hsv, s: clamp01(hsv.s + (rtl ? -dx : dx)), v: clamp01(hsv.v + dy) })
  }

  const percent = (n: number) => `${Math.round(n * 100)}%`
  return (
    <div
      ref={area}
      {...noDrag}
      data-dragging={dragging || undefined}
      data-reduced-motion={k.reduced || undefined}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId)
        event.currentTarget.querySelector<HTMLElement>('[role=slider]')?.focus()
        setDragging(true)
        pick(event)
      }}
      onPointerMove={(event) => dragging && pick(event)}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
      className="group/area relative own:h-36 w-full cursor-crosshair touch-none own:rounded-md select-none own:touch:h-48"
      style={{
        backgroundColor: pure,
        backgroundImage: 'linear-gradient(to top, black, transparent), linear-gradient(to right, white, transparent)',
      }}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-fg)_10%,transparent)]" />
      <div
        role="slider"
        tabIndex={0}
        aria-label={labels.saturationBrightness}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(hsv.s * 100)}
        aria-valuetext={labels.saturationBrightnessValue(percent(hsv.s), percent(hsv.v))}
        onKeyDown={onKeyDown}
        className={cn(
          'absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[white] shadow-md focus-ring touch:size-6',
          // Glides when the color changes from elsewhere; tracks 1:1 while dragged.
          'transition-[left,top] yj-duration-fast ease-standard group-data-dragging/area:transition-none',
        )}
        style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, backgroundColor: rgbToHex(hsvToRgb(hsv)) }}
      />
    </div>
  )
}

function ColorFields({ rgb, onCommit }: { rgb: Rgb; onCommit: (rgb: Rgb) => void }) {
  const hex = rgbToHex(rgb)
  const lch = oklchText(rgbToOklch(rgb))
  return (
    // One row each: an OKLCH value runs to 17 characters ("0.628 0.258 359.9"), too wide to share a row with hex.
    <div className="own:grid gap-1.5">
      <ColorField label="HEX" aria-label="Hex" value={hex.toUpperCase()} parse={hexToRgb} onCommit={onCommit} />
      <ColorField label="OKLCH" aria-label="OKLCH" value={lch} parse={(t) => { const p = parseOklch(t); return p ? oklchToRgb(p) : null }} onCommit={onCommit} />
    </div>
  )
}

function ColorField({
  label,
  value,
  parse,
  onCommit,
  'aria-label': ariaLabel,
}: {
  label: string
  value: string
  parse: (text: string) => Rgb | null
  onCommit: (rgb: Rgb) => void
  'aria-label': string
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const invalid = draft !== null && parse(draft) === null
  const commit = () => {
    if (draft === null) return
    const next = parse(draft)
    if (next) onCommit(next)
    setDraft(null)
  }
  return (
    <InputGroup className="h-control-sm">
      {/* A fixed label column, so the two values start on the same line. */}
      <InputGroupAddon className="w-14 justify-start own:ps-2 text-ui-xs font-medium tracking-wide">{label}</InputGroupAddon>
      <InputGroupInput
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        spellCheck={false}
        autoComplete="off"
        value={draft ?? value}
        onChange={(event) => setDraft(event.currentTarget.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit()
          if (event.key === 'Escape' && draft !== null) {
            event.stopPropagation()
            setDraft(null)
          }
        }}
        className="own:ps-1.5 font-mono text-ui-sm"
      />
    </InputGroup>
  )
}

interface EyeDropperResult {
  sRGBHex: string
}

function EyeDropperButton({ onPick }: { onPick: (rgb: Rgb) => void }) {
  const labels = useComponentLabels(colorPickerLabels)
  // Known only in the browser: render nothing on the server and where it's missing.
  const [supported, setSupported] = useState(false)
  useEffect(() => setSupported(typeof window !== 'undefined' && 'EyeDropper' in window), [])
  if (!supported) return null
  const Dropper = (window as unknown as { EyeDropper: new () => { open: () => Promise<EyeDropperResult> } }).EyeDropper
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={labels.pickColourFromScreen}
      // Drawn at the field size, hit at 44px on touch.
      className="touch:after:absolute touch:after:-inset-1"
      onClick={async () => {
        try {
          const { sRGBHex } = await new Dropper().open()
          const rgb = readColor(sRGBHex)
          if (rgb) onPick(rgb)
        } catch {
          // Cancelled with Escape: nothing to do.
        }
      }}
    >
      <PipetteIcon />
    </Button>
  )
}

export { ColorPicker, presetSwatches, type ColorPickerProps, type Swatch }
