'use client'

import { useCallback, useEffect, useRef, useState, type Ref } from 'react'
import * as ResizablePrimitive from 'react-resizable-panels'
import { GripIcon } from '@youj/icons/components/youj/icons/grip'
import { useYouj } from '@youj/core/lib/youj/provider'
import { cn } from '../../lib/utils'

/* shadcn's resizable, on react-resizable-panels 4. The library owns the
 * behavior: pointer and touch drags, min / max / collapsible panels that snap
 * shut past their threshold, and a keyboard separator (role="separator" with
 * aria-valuenow; arrows step 5%, Home / End go to the limits, Enter collapses
 * or restores, F6 hops between separators, double-click resets).
 *
 * The skin: a hairline that wakes on hover (after a beat, so crossing it on
 * the way somewhere doesn't flash) into a 3px rail, turns accent while it is
 * dragged or focused, and an optional grip whose dots fuse into bars while
 * held. Keyboard, Enter and imperative resizes glide the panels (flex-grow on
 * the base token); a pointer drag follows the pointer exactly, snap included.
 * Reduced motion: every resize is instant. Persist layouts with
 * `onLayoutChanged` and restore them with `defaultLayout`. */

function ResizablePanelGroup({ className, orientation = 'horizontal', ...props }: ResizablePrimitive.GroupProps) {
  const k = useYouj()
  return (
    <ResizablePrimitive.Group
      data-slot="resizable-panel-group"
      data-orientation={orientation}
      data-reduced-motion={k.reduced || undefined}
      orientation={orientation}
      className={cn(
        'own:flex size-full data-[orientation=vertical]:flex-col',
        // react-resizable-panels 4 hit-tests and pivots by geometry, assuming
        // panels run left to right in DOM order; mirrored by RTL, a nested or
        // multi-panel group throws ("Panel constraints not found"). Under RTL
        // the group keeps LTR order (so it works, unmirrored) and each panel
        // turns its content back to RTL.
        'rtl:[direction:ltr] rtl:*:data-panel:[direction:rtl]',
        // Glide on keyboard / Enter / imperative resizes; follow the pointer 1:1 while a separator is dragged.
        '*:data-panel:transition-[flex-grow] *:data-panel:yj-duration-base *:data-panel:ease-standard',
        'has-[>[data-separator=active]]:*:data-panel:transition-none',
        className,
      )}
      {...props}
    />
  )
}

interface ResizablePanelProps extends ResizablePrimitive.PanelProps {
  /** Fires when a collapsible panel collapses or re-opens (by drag, keyboard or the imperative API). */
  onCollapsedChange?: (collapsed: boolean) => void
}

/**
 * A panel. Sizes take numbers (px) or strings ("30%", "18rem"). Collapsible
 * panels carry `data-collapsed` on their outer element while shut, for
 * styling what's inside (a sidebar that shows only icons, say).
 */
function ResizablePanel({ onResize, onCollapsedChange, panelRef, collapsible, ...props }: ResizablePanelProps) {
  const inner = useRef<ResizablePrimitive.PanelImperativeHandle | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const setRef = useCallback(
    (handle: ResizablePrimitive.PanelImperativeHandle | null) => {
      inner.current = handle
      assignRef(panelRef, handle)
    },
    [panelRef],
  )
  return (
    <ResizablePrimitive.Panel
      data-slot="resizable-panel"
      data-collapsed={(collapsible && collapsed) || undefined}
      collapsible={collapsible}
      panelRef={setRef}
      onResize={(size, id, prev) => {
        onResize?.(size, id, prev)
        if (!collapsible) return
        const now = inner.current?.isCollapsed() ?? false
        if (now !== collapsed) {
          setCollapsed(now)
          onCollapsedChange?.(now)
        }
      }}
      {...props}
    />
  )
}

function assignRef<T>(ref: Ref<T> | undefined, value: T) {
  if (typeof ref === 'function') ref(value)
  else if (ref) ref.current = value
}

interface ResizableHandleProps extends ResizablePrimitive.SeparatorProps {
  /** Show a grip on the line. Use it where the separator isn't otherwise obvious. */
  withHandle?: boolean
}

/**
 * The separator between two panels. Its visible line is 1px; the library
 * widens the hit target (27px fine, 37px coarse) without moving the line.
 * Give it an `aria-label` when the panels' purpose isn't obvious from the
 * layout ("Resize sidebar").
 */
function ResizableHandle({ withHandle, className, ...props }: ResizableHandleProps) {
  const k = useYouj()
  return (
    <ResizablePrimitive.Separator
      data-slot="resizable-handle"
      data-reduced-motion={k.reduced || undefined}
      className={cn(
        'group/handle relative own:flex shrink-0 items-center justify-center bg-line outline-none',
        // A vertical line in a horizontal group, a horizontal one in a vertical group.
        'aria-[orientation=vertical]:w-px aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full',
        // The rail: invisible at rest, 3px when woken. Centered on the line.
        'before:pointer-events-none before:absolute before:bg-transparent before:transition-[background-color,scale] before:yj-duration-fast before:ease-standard',
        // youj-allow: fixed size, the handle's line is a hairline
        'aria-[orientation=vertical]:before:inset-y-0 aria-[orientation=vertical]:before:start-1/2 aria-[orientation=vertical]:before:w-[3px] aria-[orientation=vertical]:before:-translate-x-1/2 rtl:aria-[orientation=vertical]:before:translate-x-1/2',
        // youj-allow: fixed size, the handle's line is a hairline
        'aria-[orientation=horizontal]:before:inset-x-0 aria-[orientation=horizontal]:before:top-1/2 aria-[orientation=horizontal]:before:h-[3px] aria-[orientation=horizontal]:before:-translate-y-1/2',
        // Hover wakes it after a beat; dragging and keyboard focus light it at once.
        'data-[separator=hover]:before:bg-accent-line data-[separator=hover]:before:delay-(--yj-duration-fast)',
        'data-[separator=active]:before:bg-focus focus-visible:before:bg-focus',
        'data-[separator=disabled]:cursor-default',
        className,
      )}
      {...props}
    >
      {withHandle && (
        <span
          aria-hidden
          data-slot="resizable-grip"
          className={cn(
            'z-10 own:flex items-center justify-center rounded-sm border border-line bg-chrome-float own:text-fg-muted shadow-xs',
            'transition-[color,border-color,scale] yj-duration-fast ease-standard',
            'h-6 w-3.5 group-aria-[orientation=horizontal]/handle:h-3.5 group-aria-[orientation=horizontal]/handle:w-6',
            'group-data-[separator=hover]/handle:text-fg group-data-[separator=active]/handle:border-focus group-data-[separator=active]/handle:text-fg',
            'group-focus-visible/handle:border-focus group-focus-visible/handle:text-fg',
            'group-data-[separator=active]/handle:scale-110 reduced:group-data-[separator=active]/handle:scale-100',
          )}
        >
          <GripHandle />
        </span>
      )}
    </ResizablePrimitive.Separator>
  )
}

/** The grip fuses its dots while the separator is held (data-separator="active"). */
function GripHandle() {
  const ref = useRef<SVGSVGElement>(null)
  const [held, setHeld] = useState(false)
  useEffect(() => {
    const separator = ref.current?.closest('[data-separator]')
    if (!separator) return
    const sync = () => setHeld(separator.getAttribute('data-separator') === 'active')
    const observer = new MutationObserver(sync)
    observer.observe(separator, { attributes: true, attributeFilter: ['data-separator'] })
    return () => observer.disconnect()
  }, [])
  return <GripIcon ref={ref} size={12} active={held} className="group-aria-[orientation=horizontal]/handle:rotate-90" />
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup, type ResizableHandleProps, type ResizablePanelProps }
export type { GroupImperativeHandle as ResizableGroupHandle, Layout as ResizableLayout, PanelImperativeHandle as ResizablePanelHandle } from 'react-resizable-panels'
