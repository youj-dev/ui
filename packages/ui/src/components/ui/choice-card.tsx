'use client'

import { createContext, useContext, type ComponentProps, type ReactNode } from 'react'
import { CheckboxGroup as CheckboxGroupPrimitive } from '@base-ui/react/checkbox-group'
import type { RadioGroup as RadioGroupPrimitive } from '@base-ui/react/radio-group'
import { cn } from '../../lib/utils'
import { Badge } from './badge'
import { Checkbox } from './checkbox'
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from './field'
import { RadioGroup, RadioGroupItem } from './radio-group'
import { Switch } from './switch'

/* A selectable card: an icon, a title, a description and its control, where
 * the whole card is the target. It is the Field choice-card pattern (a
 * FieldLabel wrapping a Field) with the parts laid out: the card's edge
 * doubles in the accent when its control is on, and it carries the focus
 * ring for the control inside. The control is the kit's own Radio, Checkbox
 * or Switch, so keyboard, motion, sound and reduced motion are theirs.
 *
 * ChoiceCardGroup sets the control for its cards: `radio` (one choice, one
 * tab stop, arrows move the choice), `checkbox` (Base UI's CheckboxGroup,
 * value is the ticked cards' values) or `switch` (independent toggles, each
 * its own tab stop). Outside a group a card is a checkbox unless it says. */

type ChoiceCardControl = 'radio' | 'checkbox' | 'switch'

const ChoiceCardContext = createContext<ChoiceCardControl | null>(null)

const columnsClass = {
  1: '',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
} as const

interface ChoiceCardGroupBase {
  /** Cards per row from the `sm` breakpoint up (3 and 4 reach that count at `lg`). Default 1. */
  columns?: 1 | 2 | 3 | 4
}

type ChoiceCardGroupProps =
  | (ChoiceCardGroupBase & { control?: 'radio' } & RadioGroupPrimitive.Props)
  | (ChoiceCardGroupBase & { control: 'checkbox' } & CheckboxGroupPrimitive.Props)
  | (ChoiceCardGroupBase & { control: 'switch' } & ComponentProps<'div'>)

function ChoiceCardGroup(props: ChoiceCardGroupProps) {
  const { columns = 1, className: classNameProp, ...rest } = props
  const control = props.control ?? 'radio'
  const className = cn('own:grid own:gap-2.5', columnsClass[columns], classNameProp as string | undefined)
  let group: ReactNode
  if (control === 'radio') {
    const { control: _, ...radio } = rest as { control?: string } & RadioGroupPrimitive.Props
    group = <RadioGroup data-yj-control="radio" className={className} {...radio} />
  } else if (control === 'checkbox') {
    const { control: _, ...checkbox } = rest as { control?: string } & CheckboxGroupPrimitive.Props
    group = <CheckboxGroupPrimitive data-slot="checkbox-group" data-yj-control="checkbox" className={className} {...checkbox} />
  } else {
    const { control: _, ...div } = rest as { control?: string } & ComponentProps<'div'>
    group = <div role="group" data-slot="choice-card-group" data-yj-control="switch" className={className} {...div} />
  }
  return <ChoiceCardContext.Provider value={control}>{group}</ChoiceCardContext.Provider>
}

interface ChoiceCardProps {
  /** The card's value in a radio or checkbox group. */
  value?: string
  /** The control. Defaults to the group's, or `checkbox` outside a group. */
  control?: ChoiceCardControl
  /** On or off, for a checkbox or switch card that isn't in a checkbox group. */
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  title: ReactNode
  description?: ReactNode
  /** A small mark in a tile at the card's start (decorative). */
  icon?: ReactNode
  /** Beside the title: a string becomes a Badge ("Suggested"), any other node shows as given. */
  badge?: ReactNode
  /** Trailing text at the row's end, such as what the choice costs. Horizontal cards only. */
  note?: ReactNode
  /** Anything under the description: a meter, a figure, a link. */
  children?: ReactNode
  /** `horizontal` (default): one row, the control first. `vertical`: the icon and control on top, the text under them. */
  orientation?: 'horizontal' | 'vertical'
  disabled?: boolean
  /** Submits a standalone checkbox or switch with a native form. */
  name?: string
  id?: string
  className?: string
}

function ChoiceCard({
  value,
  control: controlProp,
  checked,
  defaultChecked,
  onCheckedChange,
  title,
  description,
  icon,
  badge,
  note,
  children,
  orientation = 'horizontal',
  disabled,
  name,
  id,
  className,
}: ChoiceCardProps) {
  const groupControl = useContext(ChoiceCardContext)
  const control = controlProp ?? groupControl ?? 'checkbox'
  const vertical = orientation === 'vertical'

  const input =
    control === 'radio' ? (
      <RadioGroupItem id={id} value={value ?? ''} disabled={disabled} />
    ) : control === 'switch' ? (
      <Switch
        id={id}
        name={name}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange && ((next) => onCheckedChange(next))}
        disabled={disabled}
      />
    ) : (
      <Checkbox
        id={id}
        name={name}
        value={value}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange && ((next) => onCheckedChange(next))}
        disabled={disabled}
      />
    )

  const tile = icon ? (
    <span
      aria-hidden
      data-slot="choice-card-icon"
      className={cn(
        'own:flex own:size-8 own:shrink-0 items-center justify-center own:rounded-md own:border own:border-line-subtle own:bg-band own:text-fg-muted [&>svg]:size-4',
        'transition-[color,background-color,border-color] yj-duration-fast ease-standard',
        'own:group-has-data-checked/choice-card:border-accent-line own:group-has-data-checked/choice-card:bg-accent-subtle own:group-has-data-checked/choice-card:text-accent-text',
      )}
    >
      {icon}
    </span>
  ) : null

  const text = (
    <FieldContent className="min-w-0">
      <FieldTitle className="own:w-full flex-wrap">
        {title}
        {badge != null && badge !== false && (typeof badge === 'string' ? <Badge>{badge}</Badge> : badge)}
      </FieldTitle>
      {description && <FieldDescription className="group-data-[orientation=horizontal]/field:text-pretty">{description}</FieldDescription>}
      {children && <div data-slot="choice-card-body" className="own:mt-2">{children}</div>}
    </FieldContent>
  )

  return (
    <FieldLabel data-yj-control={control} className={cn('group/choice-card', className)}>
      {vertical ? (
        <Field orientation="vertical" disabled={disabled} className="own:gap-3">
          <div className="own:flex items-start justify-between own:gap-3">
            {tile ?? <span />}
            {input}
          </div>
          {text}
        </Field>
      ) : (
        <Field orientation="horizontal" disabled={disabled} className="own:gap-3">
          {input}
          {tile}
          {text}
          {note && (
            <span data-slot="choice-card-note" className="own:ms-auto shrink-0 self-center own:text-ui-sm own:text-fg-muted own:tabular-nums">
              {note}
            </span>
          )}
        </Field>
      )}
    </FieldLabel>
  )
}

export { ChoiceCard, ChoiceCardGroup, type ChoiceCardControl, type ChoiceCardGroupProps, type ChoiceCardProps }
