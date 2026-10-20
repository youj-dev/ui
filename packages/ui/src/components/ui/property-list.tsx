'use client'

import { createContext, useContext, useId, useMemo, type ComponentProps, type ReactNode } from 'react'
import { useLocale } from '@youj/core'
import { propertyListLabels, useComponentLabels } from '@youj/core/labels'
import { PencilIcon } from '@youj/icons/components/youj/icons/pencil'
import { useNow } from '../../hooks/use-now'
import { cn, dateTimeFormat, initials, numberFormat, toneColor } from '../../lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import { Badge } from './badge'
import { Button } from './button'
import { Progress, ProgressValue } from './progress'

/* A record's properties as rows of icon, label and value: the owner, the
 * stage, the amount, when it closes. It is a description list (`dl`, with a
 * `dt` and a `dd` per row), so a screen reader reads each label with its
 * value. The label column has a fixed width (`--property-label-width`,
 * 9rem) and the values line up after it; a long value truncates rather than
 * wrapping the row. Below 20rem of its own width a row stacks, label above
 * value, unless `stack={false}` keeps them side by side (a narrow side panel
 * of short values, with a narrower --property-label-width).
 *
 * A value is any node. The helpers below are the common kinds, each laid out
 * for the row: a person (avatar and name), a tag, a status (a dot and its
 * label), progress (a bar and its percent), a date, money and an age, all
 * formatted in the app's locale.
 *
 * A row with `onEdit` shows a pencil at its end while it is hovered or holds
 * focus (always on touch). It is a real button in the tab order, named
 * "Edit <label>", so a keyboard reaches it like anything else. */

const ItemContext = createContext<{ labelId?: string; label?: string }>({})
const StackContext = createContext(true)

interface PropertyListProps extends ComponentProps<'dl'> {
  /** Below 20rem of its own width, each row stacks its label above its value. `false` keeps them side by side at any width. Default `true`. */
  stack?: boolean
}

function PropertyList({ stack = true, className, ...props }: PropertyListProps) {
  return (
    <StackContext.Provider value={stack}>
      <dl data-slot="property-list" className={cn('@container own:flex flex-col', className)} {...props} />
    </StackContext.Provider>
  )
}

interface PropertyListItemProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** The label's icon, drawn muted at 16px. */
  icon?: ReactNode
  /** What the value is: "Owner", "Stage". */
  label: string
  /** The value: text or one of the Property* helpers. */
  children?: ReactNode
  /** Shows an edit button on the row, named "Edit <label>". */
  onEdit?: () => void
}

function PropertyListItem({ icon, label, children, onEdit, className, ...props }: PropertyListItemProps) {
  const labelId = useId()
  const labels = useComponentLabels(propertyListLabels)
  const stack = useContext(StackContext)
  const item = useMemo(() => ({ labelId, label }), [labelId, label])
  return (
    <ItemContext.Provider value={item}>
      <div
        data-slot="property-list-item"
        className={cn(
          'group/property own:grid grid-cols-[var(--property-label-width,calc(var(--spacing)*36))_minmax(0,1fr)] items-center own:gap-x-3 own:min-h-[calc(var(--spacing)*(10_-_var(--ui--compact,0)))]',
          stack && '@max-xs:grid-cols-1 @max-xs:py-1',
          className,
        )}
        {...props}
      >
        <dt id={labelId} className="own:flex min-w-0 items-center own:gap-2.5 own:text-ui own:text-fg-muted">
          {icon && (
            <span aria-hidden className="own:flex size-4 shrink-0 items-center justify-center [&_svg]:size-4">
              {icon}
            </span>
          )}
          <span className="truncate">{label}</span>
        </dt>
        <dd className="own:flex min-w-0 items-center own:gap-2 own:text-ui own:text-fg">
          <div className="own:flex min-w-0 flex-1 items-center">{children}</div>
          {onEdit && (
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={labels.editProperty(label)}
              data-slot="property-list-edit"
              onClick={onEdit}
              className={cn(
                'shrink-0 own:text-fg-muted opacity-0 transition-opacity yj-duration-fast',
                'group-hover/property:opacity-100 group-focus-within/property:opacity-100 focus-visible:opacity-100 touch:opacity-100',
              )}
            >
              <PencilIcon size={14} />
            </Button>
          )}
        </dd>
      </div>
    </ItemContext.Provider>
  )
}

/** A value that is plain text, truncated with its full text on hover. */
function PropertyText({ className, children, ...props }: ComponentProps<'span'>) {
  return (
    <span data-slot="property-text" title={typeof children === 'string' ? children : undefined} className={cn('truncate', className)} {...props}>
      {children}
    </span>
  )
}

interface PropertyPersonProps extends ComponentProps<'span'> {
  name: string
  /** A photo; without one, the initials. */
  src?: string
}

/** A person: a small avatar and their name. */
function PropertyPerson({ name, src, className, ...props }: PropertyPersonProps) {
  return (
    <span data-slot="property-person" className={cn('own:inline-flex own:min-w-0 items-center own:gap-2', className)} {...props}>
      <Avatar size="sm" className="size-5">
        {src && <AvatarImage src={src} alt="" />}
        <AvatarFallback aria-hidden className="own:text-ui-xs">
          {initials(name)}
        </AvatarFallback>
      </Avatar>
      <span className="truncate">{name}</span>
    </span>
  )
}

/** A tag: a quiet Badge. Any Badge `variant` passes through. */
function PropertyTag({ variant = 'secondary', className, ...props }: ComponentProps<typeof Badge>) {
  return <Badge data-slot="property-tag" variant={variant} className={cn('own:max-w-full', className)} {...props} />
}

interface PropertyStatusProps extends ComponentProps<'span'> {
  /** The dot's color: `neutral`, `accent`, `success`, `warning`, `danger` or a chart tone (`chart-1`…). Default `neutral`. */
  tone?: string
}

/** A status: a colored dot before its label. The label carries the meaning; the dot only echoes it. */
function PropertyStatus({ tone = 'neutral', className, children, ...props }: PropertyStatusProps) {
  return (
    <span data-slot="property-status" className={cn('own:inline-flex own:min-w-0 items-center own:gap-2', className)} {...props}>
      <span aria-hidden className="size-2 shrink-0 rounded-full bg-(--status-tone)" style={{ ['--status-tone' as string]: toneColor(tone) }} />
      <span className="truncate">{children}</span>
    </span>
  )
}

interface PropertyProgressProps extends Omit<ComponentProps<typeof Progress>, 'children'> {
  /** How far along: 0 to `max` (100 by default). */
  value: number
}

/** Progress: a bar and its percent. Named by the row's label. */
function PropertyProgress({ className, ...props }: PropertyProgressProps) {
  const { labelId } = useContext(ItemContext)
  return (
    <Progress data-slot="property-progress" aria-labelledby={labelId} className={cn('min-w-0 flex-nowrap own:gap-3', className)} {...props}>
      <ProgressValue className="order-last ms-0 min-w-[4ch] own:text-end own:text-ui-sm own:text-fg" />
    </Progress>
  )
}

type DateInput = Date | number | string

const toDate = (value: DateInput) => (value instanceof Date ? value : new Date(value))

interface PropertyDateProps extends Omit<ComponentProps<'time'>, 'children'> {
  value: DateInput
  /** How to write it. Default: the medium date ("Nov 30, 2026"). */
  format?: Intl.DateTimeFormatOptions
  /** Default: the app's locale (YoujProvider's `locale`). */
  locale?: string
}

/** A date, in a `<time>` element. */
function PropertyDate({ value, format = { dateStyle: 'medium' }, locale: localeProp, className, ...props }: PropertyDateProps) {
  const locale = useLocale(localeProp)
  const date = toDate(value)
  return (
    <time data-slot="property-date" dateTime={date.toISOString()} className={cn('truncate own:tabular-nums', className)} {...props}>
      {dateTimeFormat(locale, format).format(date)}
    </time>
  )
}

interface PropertyMoneyProps extends Omit<ComponentProps<'span'>, 'children'> {
  /** The amount, in the currency's major unit (dollars, not cents). */
  value: number
  /** An ISO 4217 code. Default 'USD'. */
  currency?: string
  /** Default: the app's locale (YoujProvider's `locale`). */
  locale?: string
  /** Number options over the currency style: `{ notation: 'compact' }` writes $324K. */
  format?: Intl.NumberFormatOptions
}

/** An amount of money, in tabular figures. Whole amounts drop their cents. */
function PropertyMoney({ value, currency = 'USD', locale: localeProp, format, className, ...props }: PropertyMoneyProps) {
  const locale = useLocale(localeProp)
  const whole = Number.isInteger(value)
  const text = numberFormat(locale, { style: 'currency', currency, ...(whole && { maximumFractionDigits: 0 }), ...format }).format(value)
  return (
    <span data-slot="property-money" className={cn('truncate own:tabular-nums', className)} {...props}>
      {text}
    </span>
  )
}

const DAY = 86_400_000

interface PropertyAgeProps extends Omit<ComponentProps<'span'>, 'children'> {
  /** When it started: a deal's creation, a ticket's first reply. */
  since: DateInput
  /** The moment the age is counted to. Pass it from the server to render the same text in the browser. Default: now, read after hydration (until then the age is empty). */
  now?: DateInput
  /** Default: the app's locale (YoujProvider's `locale`). */
  locale?: string
}

/** How long something has been open: "12 days", "3 months", "2 years". */
function PropertyAge({ since, now, locale: localeProp, className, ...props }: PropertyAgeProps) {
  const locale = useLocale(localeProp)
  // The browser's clock, never the server's: a prerender can't read it, and the two disagree.
  const clock = useNow(0)
  const at = now === undefined ? clock : toDate(now).getTime()
  const days = at === null ? 0 : Math.max(0, Math.floor((at - toDate(since).getTime()) / DAY))
  const [amount, unit] = days >= 730 ? [Math.floor(days / 365), 'year'] : days >= 60 ? [Math.floor(days / 30), 'month'] : [days, 'day']
  return (
    <span data-slot="property-age" className={cn('truncate own:tabular-nums', className)} {...props}>
      {at === null ? null : numberFormat(locale, { style: 'unit', unit, unitDisplay: 'long' }).format(amount)}
    </span>
  )
}

export {
  PropertyAge,
  PropertyDate,
  PropertyList,
  PropertyListItem,
  PropertyMoney,
  PropertyPerson,
  PropertyProgress,
  PropertyStatus,
  PropertyTag,
  PropertyText,
  type PropertyAgeProps,
  type PropertyDateProps,
  type PropertyListItemProps,
  type PropertyListProps,
  type PropertyMoneyProps,
  type PropertyPersonProps,
  type PropertyProgressProps,
  type PropertyStatusProps,
}
