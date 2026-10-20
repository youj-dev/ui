'use client'

import type { KeyboardEvent, ReactElement, ReactNode, Ref } from 'react'
import { Toolbar, ToolbarButton, Tooltip, TooltipContent, TooltipTrigger, type ToolbarButtonProps } from '@youj/react'
import { cn } from '@/lib/cn'

/* A card's actions, as an island floating over its preview: the kit's
 * Toolbar (one tab stop, the arrows rove its buttons and wrap, mirrored in
 * RTL), in the floating chrome's tone, each button an icon whose tooltip is also its accessible name. How it
 * comes and goes lives in CSS (.card-island in styles/site.css), keyed on its
 * card, so a card that's only scrolled past costs nothing. Escape hands focus
 * back to the card. */

interface IslandProps {
  /** Names the toolbar: "bell actions". */
  label: string
  /** Over the preview's bottom edge (a grid card), or at a list row's end. */
  placement?: 'bottom' | 'end'
  /** Escape inside it: the card takes focus back. */
  onEscape?: () => void
  children: ReactNode
}

export function Island({ label, placement = 'bottom', onEscape, children }: IslandProps) {
  return (
    <Toolbar
      aria-label={label}
      data-yj-tone="float"
      data-island=""
      data-placement={placement}
      onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
        // The grid around it moves its own focus with the arrows: keys pressed in here are the island's.
        e.stopPropagation()
        if (e.key === 'Escape' && onEscape) {
          e.preventDefault()
          onEscape()
        }
      }}
      // A press on a button isn't a press on the card under it.
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      className="card-island"
    >
      {children}
    </Toolbar>
  )
}

/**
 * Where focus goes when a dialog an island opened closes (Base UI's
 * finalFocus): closed from the keyboard, back on the island's button (its card
 * keeps the island up while the button has a visible focus); closed with a
 * pointer, on the card itself, since the island leaves with the pointer and
 * would take a focused button with it. A control outside a card gets it back.
 */
export function returnFocus(opener: { current: HTMLElement | null }) {
  return (closeType: string) => (closeType === 'keyboard' ? opener.current : (opener.current?.closest<HTMLElement>('[role=gridcell]') ?? opener.current))
}

/** A hairline between the island's groups of actions. */
export function IslandSeparator() {
  return <span aria-hidden className="island-sep" />
}

/** The island's button: the toolbar's size (control-xs), the icon at 15px, a 44px hit on touch. */
export const islandButton = 'size-control-xs min-w-0 rounded-control-xs px-0 text-fg-muted hover:text-fg [&_svg]:size-[15px] touch:size-8'

interface IslandButtonProps extends Omit<ToolbarButtonProps, 'children' | 'render'> {
  /** The tooltip, and the button's accessible name. */
  label: string
  /** A longer tooltip than the name, when the name alone doesn't say what the button does. */
  tip?: string
  children: ReactNode
  /** Wraps the button (a menu's trigger): the island's button is rendered through it. */
  render?: ReactElement
  ref?: Ref<HTMLButtonElement>
}

export function IslandButton({ label, tip, children, className, render, ref, ...props }: IslandButtonProps) {
  return (
    <Tooltip longPress>
      <TooltipTrigger
        render={<ToolbarButton ref={ref} aria-label={label} render={render} className={cn(islandButton, className)} {...props} />}
      >
        {children}
      </TooltipTrigger>
      {/* Under the island, so the icon it acts on stays in view. */}
      <TooltipContent side="bottom">{tip ?? label}</TooltipContent>
    </Tooltip>
  )
}
