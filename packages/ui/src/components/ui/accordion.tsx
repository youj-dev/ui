'use client'

import { Accordion as AccordionPrimitive } from '@base-ui/react/accordion'
import { cn } from '../../lib/utils'
import { CollapsibleChevron } from './collapsible'

/* Base UI's accordion: each trigger is a heading button that toggles its
 * region (Enter / Space; Tab moves between triggers, as the APG now
 * recommends instead of arrow-key roving). One item open at a time, or
 * `multiple`. Panels wear motion's yj-collapse preset (height and fade,
 * reversible mid-way) and their content settles into place as they open; the chevron turns over on youj ChevronDownIcon's
 * `active` state, and `hiddenUntilFound` lets find-in-page open a panel. */

function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
  return <AccordionPrimitive.Root data-slot="accordion" className={cn('own:flex w-full flex-col', className)} {...props} />
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn('border-b border-line last:border-b-0', className)}
      {...props}
    />
  )
}

interface AccordionTriggerProps extends AccordionPrimitive.Trigger.Props {
  /** The heading level around the trigger: 3 by default, 2 straight under a page's h1. */
  headingLevel?: 2 | 3 | 4 | 5 | 6
}

function AccordionTrigger({ className, children, headingLevel = 3, ...props }: AccordionTriggerProps) {
  const Heading = `h${headingLevel}` as const
  return (
    <AccordionPrimitive.Header data-slot="accordion-header" render={<Heading />} className="own:flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          'group/accordion-trigger own:flex flex-1 items-center justify-between gap-4 own:rounded-md py-3 text-start own:text-ui own:font-medium text-fg focus-ring',
          'data-disabled:pointer-events-none data-disabled:opacity-50',
          "[&_svg:not([class*='size-'])]:size-4",
          className,
        )}
        {...props}
      >
        {children}
        <CollapsibleChevron className="text-fg-muted transition-colors yj-duration-fast ease-standard group-hover/accordion-trigger:text-fg" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({ className, children, ...props }: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel data-slot="accordion-content" className="group/accordion-panel yj-collapse own:text-ui text-fg-muted" {...props}>
      {/* The panel clips while it moves: padding and focus rings live inside. As
          it opens, the content settles into place: 6px up and a 2px blur, the
          rise landing on the CSS spring and the blur clearing on the fast token. */}
      <div
        className={cn(
          '[transition:translate_calc(var(--yj-duration-spring)*var(--yj-motion,1))_var(--ease-spring),filter_calc(var(--yj-duration-fast)*var(--yj-motion,1))_var(--ease-standard)]',
          'group-data-starting-style/accordion-panel:-translate-y-1.5 group-data-starting-style/accordion-panel:blur-[2px]',
          'pb-4 [&_a]:text-fg [&_a]:underline [&_a]:underline-offset-3 [&_p:not(:last-child)]:mb-3',
          className,
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Panel>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
