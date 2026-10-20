'use client'

import { useId, type ComponentProps, type ReactNode } from 'react'
import { useComponentLabels, inspectorLabels } from '@youj/core/labels'
import { ChevronDownIcon } from '@youj/icons/components/youj/icons/chevron-down'
import { EyeIcon } from '@youj/icons/components/youj/icons/eye'
import { PlusIcon } from '@youj/icons/components/youj/icons/plus'
import { TrashIcon } from '@youj/icons/components/youj/icons/trash'
import { cn } from '../../lib/utils'
import { useControllableState } from '../../hooks/use-controllable-state'
import { Button } from './button'
import { Checkbox } from './checkbox'
import { Collapsible, CollapsibleChevron, CollapsibleContent, CollapsibleTrigger } from './collapsible'
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from './dropdown-menu'

/* One property group of a design tool's side panel (a shadow, a stroke, a
 * fill, a blur): a header on top, and below it rows of fields. Every part of
 * the header is optional and appears when its props are given:
 *   - `enabled` / `onEnabledChange`: a checkbox that switches the whole group
 *     on or off; off dims the body and disables every field in it.
 *   - `types` / `type` / `onTypeChange`: the title becomes a menu, to change
 *     the kind of thing the group edits (Drop shadow, Inner shadow).
 *   - `visible` / `onVisibleChange`: an eye that hides the layer without
 *     removing it.
 *   - `onAdd`, `onRemove`: a plus and a trash button.
 *   - `actions`: anything else, before those.
 * The chevron at the end collapses the body (`open`, `defaultOpen`,
 * `onOpenChange`; the body eases shut on the collapse preset). The panel is
 * a `section` named by its title. InspectorRow lays out a label and one or
 * two fields on a two-column grid. */

interface InspectorPanelType {
  value: string
  label: string
}

interface InspectorPanelProps extends Omit<ComponentProps<'div'>, 'title' | 'children'> {
  /** The group's name. It names the section, and the remove button ("Remove Drop shadow"). */
  title: string
  /** The checkbox in front of the title (controlled). Leave it out for no checkbox. */
  enabled?: boolean
  onEnabledChange?: (enabled: boolean) => void
  /** Turns the title into a menu of these kinds. */
  types?: InspectorPanelType[]
  /** The chosen kind's value. */
  type?: string
  onTypeChange?: (type: string) => void
  /** The eye's state (controlled): false is hidden. Leave it out for no eye. */
  visible?: boolean
  onVisibleChange?: (visible: boolean) => void
  /** Shows a plus button. */
  onAdd?: () => void
  /** Shows a trash button. */
  onRemove?: () => void
  /** Header actions placed before the eye, plus and trash buttons. */
  actions?: ReactNode
  /** Whether the body is open (controlled). */
  open?: boolean
  /** Whether the body starts open (uncontrolled). Default true. */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children?: ReactNode
}

function InspectorPanel({
  title,
  enabled,
  onEnabledChange,
  types,
  type,
  onTypeChange,
  visible,
  onVisibleChange,
  onAdd,
  onRemove,
  actions,
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  className,
  children,
  ...props
}: InspectorPanelProps) {
  const labels = useComponentLabels(inspectorLabels)
  const id = useId()
  const titleId = `${id}-title`
  const enableId = `${id}-enable`
  const [open, setOpen] = useControllableState(openProp, defaultOpen)
  const off = enabled === false

  const titleText = (
    <span id={titleId} className="min-w-0 truncate own:text-ui own:font-medium own:text-fg">
      {title}
    </span>
  )

  return (
    <Collapsible
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        onOpenChange?.(next)
      }}
      render={<section aria-labelledby={titleId} />}
      data-slot="inspector-panel"
      data-yj-enabled={enabled === undefined ? undefined : enabled}
      data-yj-visible={visible === undefined ? undefined : visible}
      className={cn('own:flex flex-col own:text-fg', className)}
      {...props}
    >
      <header data-slot="inspector-panel-header" className="own:flex own:min-h-control items-center gap-2">
        {enabled !== undefined && (
          <>
            <span id={enableId} className="sr-only">
              {labels.inspectorEnable}
            </span>
            <Checkbox checked={enabled} onCheckedChange={(next) => onEnabledChange?.(next)} aria-labelledby={`${enableId} ${titleId}`} />
          </>
        )}
        {types ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              data-slot="inspector-panel-type"
              aria-label={`${labels.inspectorChangeType}, ${title}`}
              className="inline-flex min-w-0 items-center gap-1 own:rounded-sm own:px-1 own:-ms-1 focus-ring hover:bg-hover own:data-popup-open:bg-hover"
            >
              {titleText}
              <ChevronDownIcon size={14} strokeWidth={1.75} className="own:text-fg-muted" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-40">
              <DropdownMenuRadioGroup value={type} onValueChange={(next) => onTypeChange?.(String(next))}>
                {types.map((t) => (
                  <DropdownMenuRadioItem key={t.value} value={t.value}>
                    {t.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          titleText
        )}
        <div data-slot="inspector-panel-actions" className="own:ms-auto own:flex items-center gap-0.5 own:text-fg-subtle">
          {actions}
          {visible !== undefined && (
            <Button
              variant="ghost"
              size="icon-xs"
              className="own:text-fg-subtle own:hover:text-fg"
              aria-label={visible ? labels.inspectorHide : labels.inspectorShow}
              aria-pressed={!visible}
              onClick={() => onVisibleChange?.(!visible)}
            >
              <EyeIcon active={!visible} />
            </Button>
          )}
          {onAdd && (
            <Button variant="ghost" size="icon-xs" className="own:text-fg-subtle own:hover:text-fg" aria-label={labels.add} onClick={onAdd}>
              <PlusIcon trigger="none" />
            </Button>
          )}
          {onRemove && (
            <Button variant="ghost" size="icon-xs" className="own:text-fg-subtle own:hover:text-fg" aria-label={labels.remove(title)} onClick={onRemove}>
              <TrashIcon trigger="none" />
            </Button>
          )}
          <CollapsibleTrigger
            render={<Button variant="ghost" size="icon-xs" className="own:text-fg-subtle own:hover:text-fg" aria-label={open ? labels.inspectorCollapse : labels.inspectorExpand} />}
          >
            <CollapsibleChevron size={14} />
          </CollapsibleTrigger>
        </div>
      </header>
      <CollapsibleContent>
        <fieldset
          disabled={off}
          data-slot="inspector-panel-body"
          className={cn(
            'own:m-0 own:grid own:min-w-0 gap-2 border-0 own:px-0 own:pt-0.5 own:pb-3',
            'transition-opacity yj-duration-fast ease-standard',
            off && 'opacity-50',
          )}
        >
          {children}
        </fieldset>
      </CollapsibleContent>
    </Collapsible>
  )
}

interface InspectorRowProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** The row's name, on the left. */
  label: ReactNode
  /** One or two fields: two share the width. */
  children: ReactNode
}

function InspectorRow({ label, className, children, ...props }: InspectorRowProps) {
  const id = useId()
  return (
    <div data-slot="inspector-row" className={cn('own:grid grid-cols-[--spacing(22)_minmax(0,1fr)] items-center gap-2', className)} {...props}>
      <span id={id} className="truncate own:text-ui-sm own:text-fg-muted">
        {label}
      </span>
      <div role="group" aria-labelledby={id} className="own:grid grid-flow-col auto-cols-fr items-center gap-1.5">
        {children}
      </div>
    </div>
  )
}

export { InspectorPanel, InspectorRow, type InspectorPanelProps, type InspectorPanelType, type InspectorRowProps }
