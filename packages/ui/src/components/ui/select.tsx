'use client'

import { Children, Fragment, isValidElement, type ComponentProps, type ReactNode } from 'react'
import { Select as SelectPrimitive } from '@base-ui/react/select'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { CheckIcon } from '@youj/icons/components/youj/icons/check'
import { ChevronDownIcon as YoujChevron } from '@youj/icons/components/youj/icons/chevron-down'
import { ChevronUpIcon } from '@youj/icons/components/youj/icons/chevron-up'
import { useYouj, useYoujScope, usePortalContainer, useDirection } from '@youj/core/lib/youj/provider'
import { cn } from '../../lib/utils'
import { useFieldRequired } from './field'
import { fieldControlClass } from './input'
import {
  SheetHandle,
  SheetLayer,
  sheetLabelClass,
  sheetPopupClass,
  sheetPositionerClass,
  sheetRowClass,
  sheetScrimClass,
  useSheetPresentation,
  type OverlayPresentation,
} from './presentation'

/* Base UI's select: typeahead, Home/End, and (by default) the macOS-style
 * popup that lines the selected item up over the trigger. The popup wears
 * motion's yj-pop preset: it scales in from its transform origin on the enter
 * curve and leaves on the instant exit; lined up over the trigger (side
 * "none") it only fades, since growing out of the item you are already
 * looking at reads as a jump. The chevron turns over with the open state.
 *
 * On touch the options are a bottom sheet instead (presentation.tsx): it
 * rises from the bottom edge with a grab handle and 48px rows, the chosen
 * option is checked, and pulling the sheet down dismisses it. There is no
 * trigger to line the popup up over, so it is never item-aligned there.
 * `presentation="popover"` keeps the popover on touch; "sheet" forces it. */

declare const process: { env: { NODE_ENV?: string } }
let warnedNoItems = false

/* The trigger shows an item's label from `items` while the popup is closed (it
 * hasn't rendered its SelectItems yet), and the raw value without them. shadcn's
 * Select has no `items`, so code moved over from it would show `free` for
 * "Free". The labels are read from the SelectItems written inside this Select,
 * through plain elements and fragments. Items a component of yours renders are
 * out of sight: there `items` is the way, and development says so. */
function itemsFromChildren(children: ReactNode, found: Array<{ value: unknown; label: ReactNode }> = []) {
  Children.forEach(children, (child) => {
    if (!isValidElement<{ value?: unknown; children?: ReactNode }>(child)) return
    if (child.type === SelectItem) {
      if (child.props.value !== undefined) found.push({ value: child.props.value, label: child.props.children })
    } else if (typeof child.type === 'string' || child.type === Fragment || child.type === SelectContent || child.type === SelectGroup) {
      itemsFromChildren(child.props.children, found)
    }
  })
  return found
}

function Select<Value, Multiple extends boolean | undefined = false>({
  required,
  items,
  ...props
}: SelectPrimitive.Root.Props<Value, Multiple>) {
  const direction = useDirection()
  const fieldRequired = useFieldRequired()
  let labelled: SelectPrimitive.Root.Props<Value, Multiple>['items'] = items
  if (items === undefined) {
    const derived = itemsFromChildren(props.children)
    if (derived.length > 0) labelled = derived as typeof labelled
    else if (process.env.NODE_ENV !== 'production' && !warnedNoItems) {
      warnedNoItems = true
      console.warn('[youj] Select got no `items` and no SelectItem it can read, so its trigger shows the chosen value (`free`) instead of its label ("Free"). Pass `items={[{ value: \'free\', label: \'Free\' }]}`.')
    }
  }
  return (
    <DirectionProvider direction={direction}>
      <SelectPrimitive.Root required={required ?? fieldRequired} items={labelled} {...props} />
    </DirectionProvider>
  )
}

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return <SelectPrimitive.Group data-slot="select-group" className={cn('scroll-my-1', className)} {...props} />
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn('own:flex min-w-0 flex-1 items-center own:gap-1.5 truncate own:text-start', className)}
      {...props}
    />
  )
}

/* A select trigger's look, shared with the triggers that match it (DatePicker's ghost). */
const selectTriggerClass = [
  fieldControlClass,
  'flex w-fit cursor-default items-center justify-between own:gap-2 whitespace-nowrap select-none',
  'data-[size=default]:h-control own:data-[size=default]:ps-2.5 own:data-[size=default]:pe-2',
  'data-[size=sm]:h-control-sm own:data-[size=sm]:rounded-field-sm own:data-[size=sm]:ps-2 own:data-[size=sm]:pe-1.5',
  'data-placeholder:text-fg-muted own:data-popup-open:border-focus',
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
].join(' ')

/** After selectTriggerClass, so the ghost wins over the field. */
const selectGhostTriggerClass = [
  'own:rounded-button own:data-[size=sm]:rounded-button-sm own:border-transparent own:bg-transparent',
  'own:hover:border-transparent own:hover:bg-hover own:data-popup-open:border-transparent own:data-popup-open:bg-hover',
].join(' ')

function SelectTrigger({
  className,
  size = 'default',
  variant = 'default',
  hideIcon = false,
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  size?: 'sm' | 'default'
  /** `ghost`: no field fill or edge, a hover step instead, at the button corner: a select that sits in a toolbar or composer as a quiet button (a model or sort picker). `soft`: no edge, filled with the theme's quiet band (a hover step under the pointer) at the field's own corner and height: a picker inside a card, which already frames it. The fill is a little under 3:1 against the card, so the chevron and the value identify the control, not an edge; keep the default where the select must read on its own. Default `default`, the theme's field. */
  variant?: 'default' | 'ghost' | 'soft'
  /** Leaves out the chevron, for a dense row of selects (a table cell, a property list) where the value alone shows it opens. The trigger keeps its role, name and `aria-expanded`. */
  hideIcon?: boolean
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      data-variant={variant}
      className={cn(
        selectTriggerClass,
        variant === 'ghost' && selectGhostTriggerClass,
        variant === 'soft' && [
          'own:border-transparent own:bg-band own:hover:border-transparent own:hover:bg-hover',
          'own:data-popup-open:border-transparent own:data-popup-open:bg-hover',
        ],
        // With no chevron, the value is inset the same on both sides.
        hideIcon && 'own:data-[size=default]:pe-2.5 own:data-[size=sm]:pe-2',
        className,
      )}
      {...props}
    >
      {children}
      {!hideIcon && (
        <SelectPrimitive.Icon
          className="own:flex own:text-fg-muted"
          render={(iconProps, state) => (
            <span {...iconProps}>
              <YoujChevron size={16} strokeWidth={1.75} active={state.open} />
            </span>
          )}
        />
      )}
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  side = 'bottom',
  sideOffset = 6,
  align = 'center',
  alignOffset = 0,
  alignItemWithTrigger = true,
  presentation = 'auto',
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<SelectPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset' | 'alignItemWithTrigger'> & {
    /** `auto` (the default) is a popover under a pointer and a bottom sheet on touch; force either one. */
    presentation?: OverlayPresentation
  }) {
  const k = useYouj()
  // The Portal renders into <body>, outside the provider's wrapper: the scope
  // carries Speed and forced reduced motion to the popup's CSS.
  const scope = useYoujScope()
  const container = usePortalContainer()
  const sheet = useSheetPresentation(presentation)
  if (sheet) {
    return (
      <SelectPrimitive.Portal container={container} {...scope}>
        <SheetLayer>
          <SelectPrimitive.Backdrop data-sheet-scrim="" className={sheetScrimClass} />
          <SelectPrimitive.Positioner alignItemWithTrigger={false} className={sheetPositionerClass}>
            <SelectPrimitive.Popup
              data-slot="select-content"
              data-yj-tone="overlay"
              data-sheet-popup=""
              data-reduced-motion={k.reduced || undefined}
              className={cn(sheetPopupClass, className)}
              {...props}
            >
              <SheetHandle />
              <SelectPrimitive.List>{children}</SelectPrimitive.List>
            </SelectPrimitive.Popup>
          </SelectPrimitive.Positioner>
        </SheetLayer>
      </SelectPrimitive.Portal>
    )
  }
  return (
    <SelectPrimitive.Portal container={container} {...scope}>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className="isolate z-50 outline-none"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-yj-tone="overlay"
          data-reduced-motion={k.reduced || undefined}
          className={cn(
            'relative isolate max-h-(--available-height) w-(--anchor-width) min-w-36 overflow-x-hidden overflow-y-auto yj-scrollbar',
            'own:rounded-overlay own:border own:border-line own:bg-overlay own:p-1 own:text-fg own:shadow-md outline-none',
            // yj-pop: scales in from the transform origin on the enter curve,
            // leaves on the instant exit. Lined up over the trigger (side
            // "none") it only fades: growing out of the item you are already
            // looking at reads as a jump.
            'yj-pop data-[side=none]:data-starting-style:transform-none data-[side=none]:data-ending-style:transform-none',
            className,
          )}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({ className, ...props }: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn('own:px-2 own:pt-2 own:pb-1 own:text-ui-xs own:font-medium own:tracking-wide own:text-fg-muted own:uppercase', sheetLabelClass, className)}
      {...props}
    />
  )
}

function SelectItem({ className, children, ...props }: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        'relative flex min-h-control-sm w-full cursor-default items-center own:gap-2 own:rounded-[max(0px,calc(var(--radius-overlay)-var(--spacing)))] own:py-1 own:ps-2 own:pe-8 own:text-ui outline-none select-none',
        'own:data-highlighted:bg-cursor data-highlighted:yj-on-cursor',
        'data-disabled:pointer-events-none data-disabled:opacity-50',
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        sheetRowClass,
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="own:flex min-w-0 flex-1 items-center gap-2 truncate">{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={<span className="pointer-events-none absolute end-2 own:flex size-4 items-center justify-center own:text-accent" />}
      >
        <CheckIcon strokeWidth={2.25} />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({ className, ...props }: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn('pointer-events-none own:-mx-1 own:my-1 h-px own:bg-line', className)}
      {...props}
    />
  )
}

const scrollArrowClass =
  "yj-fade z-10 own:flex h-6 w-full cursor-default items-center justify-center own:bg-overlay own:text-fg-muted [&_svg:not([class*='size-'])]:size-3.5"

function SelectScrollUpButton({ className, ...props }: ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(scrollArrowClass, 'top-0', className)}
      {...props}
    >
      <ChevronUpIcon trigger="none" />
    </SelectPrimitive.ScrollUpArrow>
  )
}

function SelectScrollDownButton({ className, ...props }: ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(scrollArrowClass, 'bottom-0', className)}
      {...props}
    >
      <YoujChevron trigger="none" />
    </SelectPrimitive.ScrollDownArrow>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  selectGhostTriggerClass,
  selectTriggerClass,
}
