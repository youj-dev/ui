'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible'
import { ChevronDownIcon } from '@youj/icons/components/youj/icons/chevron-down'
import { cn } from '../../lib/utils'

/* Base UI's collapsible. The panel wears motion's yj-collapse preset: height
 * eases between 0 and the measured height (then auto, so content can still
 * grow) while the content fades, and a reversal mid-way continues from where
 * it is. Keep focus rings inside the panel's padding: it clips while it
 * moves. CollapsibleChevron is the disclosure mark for any trigger. */

function Collapsible(props: CollapsiblePrimitive.Root.Props) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

function CollapsibleTrigger(props: CollapsiblePrimitive.Trigger.Props) {
  return <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props} />
}

function CollapsibleContent({ className, ...props }: CollapsiblePrimitive.Panel.Props) {
  return <CollapsiblePrimitive.Panel data-slot="collapsible-content" className={cn('yj-collapse', className)} {...props} />
}

interface CollapsibleChevronProps {
  /** Rendered size in px. Default 16. */
  size?: number
  className?: string
}

/**
 * youj's ChevronDownIcon, turned over by its `active` state whenever the
 * nearest trigger around it is expanded. It reads the trigger's own
 * aria-expanded, so it works in any disclosure (Collapsible, Accordion,
 * NavigationMenu, a sidebar group) without wiring, including triggers
 * composed through `render`. The turn is the icon's snappy spring; reduced
 * motion flips it instantly.
 */
function CollapsibleChevron({ size = 16, className }: CollapsibleChevronProps) {
  const ref = useRef<SVGSVGElement>(null)
  // null until the trigger has been read: the icon mounts in its real state
  // instead of turning over on first paint.
  const [open, setOpen] = useState<boolean | null>(null)

  useLayoutEffect(() => {
    const trigger = ref.current?.closest('[aria-expanded]')
    if (!trigger) {
      setOpen(false)
      return
    }
    const sync = () => setOpen(trigger.getAttribute('aria-expanded') === 'true')
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(trigger, { attributes: true, attributeFilter: ['aria-expanded'] })
    return () => observer.disconnect()
  }, [])

  return (
    <ChevronDownIcon
      key={open === null ? 'reading' : 'read'}
      ref={ref}
      size={size}
      strokeWidth={1.75}
      active={open ?? false}
      className={cn('pointer-events-none own:shrink-0', className)}
    />
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent, CollapsibleChevron, type CollapsibleChevronProps }
