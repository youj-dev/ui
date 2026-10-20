'use client'

import { useId, type CSSProperties, type ReactNode } from 'react'
import { Collapsible, CollapsibleChevron, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible'
import { Field, FieldLabel } from '../components/ui/field'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../components/ui/select'
import { Switch } from '../components/ui/switch'
import { cn } from '../lib/utils'

/* The inspector: property rows for tools like the theme builder and Create.
 * Each row is a quiet label and its control, one line tall, so a column of
 * settings reads at a glance and grows by a row, never a new widget. Choices
 * are menus (a leading glyph, the name, a muted detail, and a note in the
 * menu), on/off is a switch, and fine-tuning waits behind an Advanced
 * disclosure. Docs tooling, not shipped in the packages. */

/** A label column and a control column: one line per setting. */
const row = 'grid w-full grid-cols-[minmax(0,5.75rem)_minmax(0,1fr)] items-center gap-x-3'
const label = 'w-auto min-w-0 truncate text-ui-sm leading-5 font-normal text-fg-muted'

/** A titled run of rows. Titled groups, not headings: the inspector sits under whatever heading its page gives it. */
export function InspectorSection({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  const id = useId()
  return (
    <div role="group" aria-labelledby={id} className={cn('flex min-w-0 flex-col gap-2', className)}>
      <div className="flex h-6 items-center justify-between gap-2">
        <div id={id} className="text-[12px] leading-none font-medium text-fg-muted">
          {title}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

/** The label cell: the name, and a small action beside it (a reset), so every control keeps the column's full width. */
const labelCell = 'flex min-w-0 items-center gap-0.5'

/** A row for any control: the label names it (pass the control's id), the control fills the rest. */
export function InspectorRow({
  label: name,
  htmlFor,
  action,
  children,
  className,
}: {
  label: string
  htmlFor?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn(row, 'min-h-control-sm', className)}>
      <span className={labelCell}>
        <label htmlFor={htmlFor} className={label}>
          {name}
        </label>
        {action}
      </span>
      <div className="flex min-w-0 items-center gap-1.5">{children}</div>
    </div>
  )
}

export interface InspectorOption<T extends string> {
  value: T
  label: string
  /** Muted text after the name, in the menu and on the trigger: `600`, `32px`. */
  detail?: string
  /** A line under the name, in the menu only. */
  note?: string
  /** A leading visual, in the menu and on the trigger: a swatch, an icon. */
  glyph?: ReactNode
  /** A bigger picture, in the menu only: a wireframe. */
  thumb?: ReactNode
  /** The name's own style: a typeface shown in itself. */
  style?: CSSProperties
  /** The menu group it's listed under. */
  group?: string
}

function OptionFace<T extends string>({ option, inTrigger }: { option: InspectorOption<T>; inTrigger?: boolean }) {
  const picture = inTrigger ? option.glyph : (option.thumb ?? option.glyph)
  return (
    <span className={cn('flex min-w-0 flex-1 items-center', option.thumb && !inTrigger ? 'gap-3' : 'gap-2')}>
      {picture && (
        <span aria-hidden className="flex shrink-0 items-center">
          {picture}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex min-w-0 items-baseline gap-2">
          {/* On the trigger a name is set like every other value; the menu shows it in its own face and size. */}
          <span className="min-w-0 truncate" style={inTrigger ? undefined : option.style}>
            {option.label}
          </span>
          {option.detail && <span className="ms-auto shrink-0 text-ui-xs text-fg-muted tabular-nums">{option.detail}</span>}
        </span>
        {!inTrigger && option.note && <span className="line-clamp-2 text-ui-xs leading-4 text-pretty whitespace-normal text-fg-muted">{option.note}</span>}
      </span>
    </span>
  )
}

/**
 * A setting with a few named values, as a menu. `rich` menus (glyphs or
 * notes, long lists) drop below the trigger at their own width instead of
 * lining the choice up over it. `onOpen` runs as the menu is about to open:
 * on hover and focus too, so whatever it loads (a typeface) is on its way.
 */
export function InspectorSelect<T extends string>({
  label: name,
  value,
  options,
  onChange,
  onOpen,
  rich,
  action,
  className,
}: {
  label: string
  value: T
  options: readonly InspectorOption<T>[]
  onChange: (value: T) => void
  onOpen?: () => void
  rich?: boolean
  /** A small action beside the label: a reset. */
  action?: ReactNode
  className?: string
}) {
  const current = options.find((o) => o.value === value)
  const groups: [string | undefined, InspectorOption<T>[]][] = []
  for (const option of options) {
    const last = groups.at(-1)
    if (last && last[0] === option.group) last[1].push(option)
    else groups.push([option.group, [option]])
  }
  const items = (list: InspectorOption<T>[]) =>
    list.map((option) => (
      <SelectItem key={option.value} value={option.value} className={cn(option.note && 'py-1.5')}>
        <OptionFace option={option} />
      </SelectItem>
    ))
  return (
    <Field orientation="horizontal" className={cn(row, 'gap-y-0', className)}>
      <span className={labelCell}>
        <FieldLabel className={label}>{name}</FieldLabel>
        {action}
      </span>
      <Select value={value} onValueChange={(next) => next !== null && onChange(next as T)} onOpenChange={(open) => open && onOpen?.()}>
        <SelectTrigger size="sm" className="w-full min-w-0 text-ui" onPointerEnter={onOpen} onFocus={onOpen}>
          <SelectValue className="min-w-0">{() => (current ? <OptionFace option={current} inTrigger /> : value)}</SelectValue>
        </SelectTrigger>
        <SelectContent
          alignItemWithTrigger={!rich}
          align="start"
          className={cn(rich && 'w-auto max-w-[min(21rem,calc(100vw-2rem))] min-w-(--anchor-width)')}
        >
          {groups.map(([group, list], i) =>
            group ? (
              <SelectGroup key={group} className={cn(i > 0 && 'mt-1 border-t border-line pt-1')}>
                <SelectLabel>{group}</SelectLabel>
                {items(list)}
              </SelectGroup>
            ) : (
              items(list)
            ),
          )}
        </SelectContent>
      </Select>
    </Field>
  )
}

/** On or off: the label is a sentence, and the switch sits at the row's end. */
export function InspectorSwitch({ label: name, note, checked, onChange }: { label: string; note?: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <Field orientation="horizontal" className="min-h-control-sm items-center justify-between gap-3">
      <span className="flex min-w-0 flex-col">
        <FieldLabel className="text-ui-sm leading-5 font-normal text-fg">{name}</FieldLabel>
        {note && <span className="truncate text-ui-xs text-fg-muted">{note}</span>}
      </span>
      <Switch checked={checked} onCheckedChange={(next) => onChange(next)} />
    </Field>
  )
}

/** Fine-tuning, folded away under a hairline until it's asked for. */
export function InspectorAdvanced({ open, onOpenChange, title = 'Advanced', hint, children }: { open?: boolean; onOpenChange?: (open: boolean) => void; title?: string; hint?: string; children: ReactNode }) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange} className="flex flex-col border-t border-line pt-2">
      <CollapsibleTrigger
        className={cn(
          '-mx-1.5 flex h-control-sm items-center gap-2 rounded-md px-1.5 text-start text-ui-sm font-medium text-fg focus-ring',
          'transition-colors yj-duration-fast ease-standard hover:bg-hover',
        )}
      >
        {title}
        {hint && <span className="min-w-0 truncate font-normal text-fg-muted">{hint}</span>}
        <CollapsibleChevron size={14} className="ms-auto text-fg-muted" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col gap-5 pt-3 pb-1">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}
