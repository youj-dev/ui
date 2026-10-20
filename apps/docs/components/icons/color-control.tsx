'use client'

import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { CheckIcon } from '@youj/icons'
import { Button, ColorPicker } from '@youj/react'
import { cn } from '@/lib/cn'
import { AdaptivePanel } from './adaptive'
import { DEFAULT_CUSTOM_INK, INKS, inkColor, isCustomInk, type Ink, type InkId } from './settings'

/* The icons' color, in one control. Its button shows the color in use; its
 * panel is one choice among the theme's tokens (Default is currentColor: the
 * icon takes the color of the text around it) and Custom, any color, picked
 * with the kit's ColorPicker beside it. Picking a custom color chooses
 * Custom at once; choosing Custom brings back the last one picked. The color
 * paints the grid, the details stage and the chain, and it's in what you
 * copy and download: a token as its class (`text-accent`), a custom color as
 * a style, a hex in a file. */

const TOKEN_CODE: Record<InkId, string> = {
  default: 'currentColor',
  muted: 'text-fg-muted',
  accent: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
}

/** The color's name, for the button and its accessible name. */
export function inkName(ink: Ink) {
  return isCustomInk(ink) ? ink.toUpperCase() : INKS.find((i) => i.id === ink)!.label
}

function Swatch({ color, className }: { color: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('size-4 shrink-0 rounded-full shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-fg)_16%,transparent)]', className)}
      style={{ background: color }}
    />
  )
}

interface ColorControlProps {
  ink: Ink
  onChange: (ink: Ink) => void
  /** Names the control and its panel: another explorer's color ("Animation color"). Default "Icon color". */
  title?: string
  /** What each token writes in the code, beside its name. Default: the icon's class. */
  codes?: Record<InkId, string>
  /** The panel's last line: what the color reaches. */
  note?: ReactNode
  /** What Default looks like, when it isn't the text color (a secondary color's Default is the theme's accent). */
  defaultSwatch?: string
  /** Tokens to leave out (one that Default already is). */
  omit?: readonly InkId[]
  /** The button names its color at every width and fills its row at the panel's control height (in a panel of controls); in a toolbar it shows its swatch alone until there's room. */
  wide?: boolean
  /** What the toolbar's button says beside its swatch, once there's room, where the color's name alone wouldn't tell two controls apart ("Primary"). Its accessible name still names the color. */
  caption?: string
  className?: string
}

export function ColorControl({
  ink,
  onChange,
  title = 'Icon color',
  codes = TOKEN_CODE,
  note = 'Paints the grid, the details and the chain, and goes into the code you copy and the files you download.',
  defaultSwatch,
  omit = [],
  wide = false,
  caption,
  className,
}: ColorControlProps) {
  const custom = isCustomInk(ink)
  // The last custom color, so choosing Custom again brings it back.
  const [last, setLast] = useState<`#${string}`>(custom ? ink : DEFAULT_CUSTOM_INK)
  const rows = useRef<(HTMLButtonElement | null)[]>([])
  const inks = INKS.filter((i) => !omit.includes(i.id))
  const swatchOf = (id: InkId) => (id === 'default' && defaultSwatch) || inkColor(id)
  const options = [...inks.map((i) => i.id), 'custom'] as const
  const current = custom ? 'custom' : ink

  const choose = (id: (typeof options)[number]) => onChange(id === 'custom' ? last : id)
  const pickCustom = (hex: string) => {
    const value = hex.toLowerCase() as `#${string}`
    setLast(value)
    onChange(value)
  }

  // A radio group: one tab stop; the arrows move and choose.
  const onKeyDown = (e: KeyboardEvent, i: number) => {
    const next = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: options.length - 1 }[e.key]
    if (next === undefined) return
    e.preventDefault()
    const target = (next + options.length) % options.length
    rows.current[target]?.focus()
    choose(options[target]!)
  }

  const row = (id: (typeof options)[number], i: number, label: string, swatch: string, code?: string) => {
    const checked = current === id
    return (
      <button
        key={id}
        ref={(el) => {
          rows.current[i] = el
        }}
        type="button"
        role="radio"
        aria-checked={checked}
        tabIndex={checked ? 0 : -1}
        onClick={() => choose(id)}
        onKeyDown={(e) => onKeyDown(e, i)}
        className={cn(
          'flex h-9 w-full min-w-0 items-center gap-2.5 rounded-md px-2 text-start text-[13px] text-fg transition-colors yj-duration-fast ease-standard focus-ring touch:h-11',
          checked ? 'bg-hover' : 'hover:bg-hover',
        )}
      >
        <Swatch color={swatch} className={cn(checked && 'ring-2 ring-fg ring-offset-2 ring-offset-overlay')} />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {code && <span className="shrink-0 font-mono text-[11px] text-fg-subtle">{code}</span>}
        <span className="grid size-4 shrink-0 place-items-center">{checked && <CheckIcon size={14} strokeWidth={2.25} trigger="mount" />}</span>
      </button>
    )
  }

  return (
    <AdaptivePanel
      title={title}
      heading
      align="end"
      className="w-72 gap-3"
      actions={
        ink !== 'default' ? (
          <Button variant="ghost" size="xs" className="-me-1.5" onClick={() => onChange('default')}>
            Reset
          </Button>
        ) : null
      }
      trigger={
        <Button
          variant="outline"
          size={wide ? 'sm' : 'default'}
          aria-label={`${title}: ${inkName(ink)}`}
          className={cn('shrink-0 gap-2 font-normal text-fg', wide ? 'w-full justify-start' : 'max-sm:px-2.5', className)}
        >
          <Swatch color={custom ? ink : swatchOf(ink)} />
          <span className={cn(wide ? 'truncate' : 'hidden xl:inline', custom && !caption && 'font-mono text-[12px]')}>{caption ?? inkName(ink)}</span>
        </Button>
      }
    >
      <div className="flex flex-col gap-0.5">
        <div role="radiogroup" aria-label={title} className="flex flex-col gap-0.5">
          {inks.map((i, index) => row(i.id, index, i.label, swatchOf(i.id), codes[i.id]))}
          {row('custom', inks.length, 'Custom', last)}
        </div>
        {/* The custom color's own picker, on the Custom row's line. */}
        <div className="mt-1 flex items-center gap-2 border-t border-line ps-2 pt-2.5">
          <span className="flex-1 text-[12.5px] text-fg-muted">Custom color</span>
          <ColorPicker
            aria-label="Custom color"
            value={last}
            onValueChange={pickCustom}
            className={cn('h-control-sm w-36', custom && 'border-fg')}
          />
        </div>
      </div>
      <p className="text-[12px] leading-relaxed text-pretty text-fg-muted">{note}</p>
    </AdaptivePanel>
  )
}
