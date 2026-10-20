'use client'

import { useRef, useState, type ReactNode } from 'react'
import { PlusIcon } from '@youj/icons'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
  SegmentedControl,
  SegmentedControlItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Switch,
  Textarea,
  Toggle,
} from '@youj/react'
import { ColorControl } from '@/components/icons/color-control'
import type { Ink, InkId } from '@/components/icons/settings'
import { PanelNote, PanelRow as Row, PanelSection } from '@/components/showroom/hero'
import { autoLabelSize, LABEL_EFFECTS, LABEL_FONTS, LABEL_POSITIONS, labelLines, labelTypeSet, type LabelFont, type LabelLook } from './catalog'

/* The panel's controls, three groups on one grid (PanelRow: the name, the control, its value; every row the controls'
 * height): Size & speed (both go into the code, and the stage draws the loader at that size, as large as its room
 * allows, at that pace), Colors (the explorers' color control: Default, the theme's tokens, Custom; the stage and the
 * thumbnails wear them) and Label, shown or not from its title: its text (the first label, edited in place; every
 * label, one a line, in an editor laid over the panel, so a longer edit never pushes a row), where it sits (segments)
 * and how it moves (a menu, its effects being many), and its type over or under the drawing: a face with capitals at
 * its row's end, and a size. */

export const SIZE_RANGE = [24, 360] as const
export const SPEED_RANGE = [0.5, 2] as const
const FONT_SIZE_RANGE = [10, 24] as const

/** A speed as the panel says it: `1×`, `1.25×`, `0.5×`. */
export const speedName = (speed: number) => `${Math.round(speed * 100) / 100}×`

/* The two colors. Default leaves its prop out of the code. */
const COLORS = {
  primary: {
    title: 'Primary color',
    codes: { default: 'currentColor', muted: '--color-fg-muted', accent: '--color-accent', success: '--color-success', warning: '--color-warning', danger: '--color-danger' },
    note: (
      <>
        The ink: it inks the stage and every thumbnail, and goes into the code as the <code className="code-inline">color</code> prop. Default is the color of
        the text around it.
      </>
    ),
    swatch: undefined,
    omit: [],
  },
  secondary: {
    title: 'Secondary color',
    codes: { default: '--color-accent', muted: '--color-fg-muted', accent: '--color-accent', success: '--color-success', warning: '--color-warning', danger: '--color-danger' },
    note: (
      <>
        The accent: the one mark that matters, and a shown label’s light and caret. It goes into the code as the <code className="code-inline">accentColor</code>{' '}
        prop; Default is your theme’s accent.
      </>
    ),
    swatch: 'var(--color-accent)',
    omit: ['accent'],
  },
} satisfies Record<string, { title: string; codes: Record<InkId, string>; note: ReactNode; swatch: string | undefined; omit: InkId[] }>

/** A colored part: Default is its theme color, and a pick goes into `colors`, at its place. */
function PartColor({ name, color, i, ink, onChange }: { name: string; color: string; i: number; ink: Ink; onChange: (ink: Ink) => void }) {
  const codes = { default: '--color-accent', muted: '--color-fg-muted', accent: '--color-accent', success: '--color-success', warning: '--color-warning', danger: '--color-danger' }
  const note = (
    <>
      The {name.toLowerCase()}: a pick goes into the code in the <code className="code-inline">colors</code> prop, as its {ORDINALS[i]} color. Default is the theme color, derived from your accent.
    </>
  )
  return <ColorControl ink={ink} onChange={onChange} title={`${name} color`} codes={codes} note={note} defaultSwatch={color} wide />
}

const ORDINALS = ['first', 'second', 'third', 'fourth']

const TONES = [
  { value: 'mono', label: 'Mono' },
  { value: 'theme', label: 'Theme' },
] as const

/** One of a loader's two colors: the primary (`color`) or the secondary (`accentColor`), named by its row; the button says which color it is. */
function LoaderColor({ which, ink, onChange }: { which: keyof typeof COLORS; ink: Ink; onChange: (ink: Ink) => void }) {
  const c = COLORS[which]
  return <ColorControl ink={ink} onChange={onChange} title={c.title} codes={c.codes} note={c.note} defaultSwatch={c.swatch} omit={c.omit} wide />
}

export interface TuneProps {
  size: number
  onSize: (size: number) => void
  /** The speed over the loader's own tempo (the code's `speed`), slower to faster; its loop at 1, in seconds. */
  speed: number
  onSpeed: (speed: number) => void
  base: number
  ink: Ink
  accent: Ink
  onInk: (ink: Ink) => void
  onAccent: (ink: Ink) => void
  /** Its colored parts (none for a loader without), whether they're in the theme's colors or Mono (its two colors alone), and each one's pick. */
  partColors?: { part: string; color: string }[]
  tone: 'theme' | 'mono'
  onTone: (tone: 'theme' | 'mono') => void
  parts: Ink[]
  onPart: (i: number, ink: Ink) => void
  label: LabelLook
  onLabel: (patch: Partial<LabelLook>) => void
}

export function Tune({ size, onSize, speed, onSpeed, base, ink, accent, onInk, onAccent, partColors, tone, onTone, parts, onPart, label, onLabel }: TuneProps) {
  const typeSet = labelTypeSet(label)
  const fontSize = label.fontSize ?? autoLabelSize(size)
  return (
    <>
      <PanelSection id="loader-size" title="Size & speed" end={<PanelNote>As the stage draws it, and in the code</PanelNote>}>
        <Row label="Size" value={`${size} px`}>
          <Slider
            aria-label="Size"
            min={SIZE_RANGE[0]}
            max={SIZE_RANGE[1]}
            step={4}
            value={size}
            onValueChange={(v) => onSize(Array.isArray(v) ? v[0]! : v)}
            getAriaValueText={(_, v) => `${v} pixels`}
            className="min-w-0 flex-1"
          />
        </Row>
        <Row label="Speed" value={speedName(speed)}>
          <Slider
            aria-label="Speed"
            min={SPEED_RANGE[0]}
            max={SPEED_RANGE[1]}
            step={0.05}
            value={speed}
            onValueChange={(v) => onSpeed(Array.isArray(v) ? v[0]! : v)}
            getAriaValueText={(_, v) => `${speedName(v)}, ${(base / v).toFixed(1)} seconds a loop`}
            className="min-w-0 flex-1"
          />
        </Row>
      </PanelSection>

      <PanelSection id="loader-colors" title="Colors">
        <Row label="Primary">
          <LoaderColor which="primary" ink={ink} onChange={onInk} />
        </Row>
        <Row label="Secondary">
          <LoaderColor which="secondary" ink={accent} onChange={onAccent} />
        </Row>
        {/* Mono (the default): its two colors alone; Theme: its colored parts in the theme's colors, each one's own pick under it. */}
        <Row label="Color">
          <Segments label="Color" options={[...TONES]} value={tone} onChange={onTone} />
        </Row>
        {tone === 'theme' &&
          partColors?.map(({ part, color }, i) => (
            <Row key={part} label={part}>
              <PartColor name={part} color={color} i={i} ink={parts[i] ?? 'default'} onChange={(next) => onPart(i, next)} />
            </Row>
          ))}
      </PanelSection>

      <PanelSection
        id="loader-label"
        title="Label"
        end={
          <span className="flex h-6 shrink-0 items-center gap-2">
            <span aria-hidden className="text-[12px] text-fg-muted select-none">
              Show
            </span>
            <Switch aria-label="Show the label" checked={label.show} onCheckedChange={(show) => onLabel({ show })} />
          </span>
        }
      >
        <Row label="Text">
          <LabelField text={label.text} onChange={(text) => onLabel({ text })} />
        </Row>
        <Row label="Position">
          <Segments label="Position" options={LABEL_POSITIONS} value={label.position} disabled={!label.show} onChange={(position) => onLabel({ position })} />
        </Row>
        <Row label="Effect">
          <Effect value={label.effect} disabled={!label.show} onChange={(effect) => onLabel({ effect })} />
        </Row>
        {/* Over or under the drawing the type is the label's own; beside it, the line's. */}
        <Row
          label="Font"
          value={
            <Toggle
              aria-label="Capitals"
              title="Capitals"
              variant="outline"
              size="sm"
              disabled={!typeSet}
              pressed={label.caps}
              onPressedChange={(caps) => onLabel({ caps })}
              className="w-[3.25rem] font-mono text-[11px] tracking-[0.08em]"
            >
              AA
            </Toggle>
          }
        >
          <Font value={label.font} disabled={!typeSet} onChange={(font) => onLabel({ font })} />
        </Row>
        <Row label="Font size" value={`${fontSize} px`}>
          <Slider
            aria-label="Font size"
            min={FONT_SIZE_RANGE[0]}
            max={FONT_SIZE_RANGE[1]}
            step={1}
            value={fontSize}
            disabled={!typeSet}
            onValueChange={(v) => onLabel({ fontSize: Array.isArray(v) ? v[0]! : v })}
            getAriaValueText={(_, v) => `${v} pixels`}
            className="min-w-0 flex-1"
          />
        </Row>
      </PanelSection>
    </>
  )
}

/**
 * The label's text, one line at rest whatever it holds: the first label, typed in place, and at its end how many more
 * take turns after it (or a way to add some). That opens every label, one a line, in an editor laid over the field and
 * the rows under it, so the panel never moves while it grows.
 */
function LabelField({ text, onChange }: { text: string; onChange: (text: string) => void }) {
  const field = useRef<HTMLDivElement>(null)
  const editor = useRef<HTMLTextAreaElement>(null)
  const [open, setOpen] = useState(false)
  const [first = '', ...rest] = text.split('\n')
  const more = labelLines(rest.join('\n')).length
  const count = labelLines(text).length
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <InputGroup ref={field} className="h-control-sm">
        <InputGroupInput
          aria-label="Label text"
          value={first}
          placeholder="Loading"
          maxLength={120}
          onChange={(e) => onChange([e.currentTarget.value, ...rest].join('\n'))}
          className="text-[12.5px]"
        />
        <InputGroupAddon align="inline-end">
          <PopoverTrigger
            render={
              <InputGroupButton
                size={more ? 'xs' : 'icon-xs'}
                aria-label={more ? `Every label: ${count}, one a line` : 'Add labels that take turns'}
                className="font-mono text-[11px] tabular-nums"
              />
            }
          >
            {more ? <span dir="ltr">+{more}</span> : <PlusIcon size={14} strokeWidth={1.75} />}
          </PopoverTrigger>
        </InputGroupAddon>
      </InputGroup>
      {/* Over the field, its first line where the field's was, as wide as the field: the rows under it stay put. */}
      <PopoverContent
        anchor={field}
        side="bottom"
        align="start"
        sideOffset={({ anchor }) => -anchor.height}
        initialFocus={() => {
          const box = editor.current
          box?.focus({ preventScroll: true })
          box?.setSelectionRange(box.value.length, box.value.length)
          return false
        }}
        aria-label="Labels"
        className="w-(--anchor-width) max-w-[calc(100vw-1rem)] gap-0 overflow-hidden p-0"
      >
        <Textarea
          ref={editor}
          aria-label="Label text, one a line"
          value={text}
          placeholder={'Loading\nAlmost there'}
          maxLength={240}
          rows={Math.min(Math.max(text.split('\n').length + 1, 3), 7)}
          onChange={(e) => onChange(e.currentTarget.value)}
          // shape: the popover is the editor; its text sits bare in it above the hint bar
          className="field-sizing-fixed min-h-0 resize-none rounded-none border-0 px-2.5 py-[7px] text-[12.5px] leading-[18px] shadow-none focus-visible:ring-0"
        />
        <div className="flex items-center gap-3 border-t border-line py-1.5 ps-2.5 pe-1.5">
          <p className="min-w-0 flex-1 text-[11.5px] leading-4 text-fg-muted">One a line. Several take turns; the first is said first.</p>
          <PopoverClose render={<InputGroupButton size="xs" className="shrink-0" />}>Done</PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
  )
}

/** A shown label's face: the theme's label voice, or Sans, Mono or Serif, each named in its own face. */
function Font({ value, disabled, onChange }: { value: LabelFont; disabled: boolean; onChange: (font: LabelFont) => void }) {
  const items = Object.fromEntries(LABEL_FONTS.map((o) => [o.value, o.label]))
  return (
    <Select items={items} value={value} disabled={disabled} onValueChange={(next) => next && onChange(next as LabelFont)}>
      <SelectTrigger size="sm" aria-label="Font" className="w-full min-w-0 text-[12.5px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} className="min-w-(--anchor-width)">
        {LABEL_FONTS.map((o) => (
          <SelectItem key={o.value} value={o.value} className="text-[12.5px]" style={o.css ? { fontFamily: o.css } : undefined}>
            {o.label}
            {o.value === 'theme' && <span className="ms-auto ps-4 text-[11.5px] text-fg-muted">Its label voice</span>}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** How a shown label moves: six effects, so a menu, each with a line on what it does. */
function Effect({ value, disabled, onChange }: { value: LabelLook['effect']; disabled: boolean; onChange: (effect: LabelLook['effect']) => void }) {
  const items = Object.fromEntries(LABEL_EFFECTS.map((o) => [o.value, o.label]))
  return (
    <Select items={items} value={value} disabled={disabled} onValueChange={(next) => next && onChange(next as LabelLook['effect'])}>
      <SelectTrigger size="sm" aria-label="Effect" className="w-full min-w-0 text-[12.5px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} className="min-w-(--anchor-width)">
        {LABEL_EFFECTS.map((o) => (
          <SelectItem key={o.value} value={o.value} className="text-[12.5px]">
            {o.label}
            <span className="ms-auto ps-4 text-[11.5px] text-fg-muted">{o.hint}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** A choice among a few, as segments at the row's height, sharing its width. */
function Segments<T extends string>({ label, options, value, disabled, onChange }: { label: string; options: { value: T; label: string }[]; value: T; disabled?: boolean; onChange: (value: T) => void }) {
  return (
    <SegmentedControl aria-label={label} size="sm" value={value} disabled={disabled} onValueChange={(next) => onChange(next as T)} className="w-full">
      {options.map((o) => (
        <SegmentedControlItem key={o.value} value={o.value} className="min-w-0 px-1.5 text-[12.5px]">
          <span className="truncate">{o.label}</span>
        </SegmentedControlItem>
      ))}
    </SegmentedControl>
  )
}
