'use client'

import { useId, type ComponentProps, type ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { NavigationMenuContent, NavigationMenuLink } from './navigation-menu'

/* A mega menu is a NavigationMenu whose panels are laid out as columns: groups
 * of links, each with an icon tile, a title and a line of description, and an
 * optional featured card at the inline end. It inherits the menu's motion: the
 * hover pill between triggers, the popup growing out of its trigger and then
 * sliding and morphing to the next panel's size while the panels trade places.
 * Each link's youj icon plays while the link is hovered or focused.
 *
 *   <NavigationMenu>
 *     <NavigationMenuList>
 *       <NavigationMenuItem>
 *         <NavigationMenuTrigger>Product</NavigationMenuTrigger>
 *         <MegaMenuContent featured={<MegaMenuFeatured … />}>
 *           <MegaMenuGroup title="Build"><MegaMenuLink … /></MegaMenuGroup>
 *         </MegaMenuContent>
 *       </NavigationMenuItem>
 *
 * Keyboard is NavigationMenu's: Enter / Space / ↓ opens a panel, Tab moves
 * through its links, Escape closes and returns focus to the trigger. */

interface MegaMenuContentProps extends ComponentProps<typeof NavigationMenuContent> {
  /** A card at the inline end: a launch, a case study, a changelog entry. */
  featured?: ReactNode
}

function MegaMenuContent({ className, featured, children, ...props }: MegaMenuContentProps) {
  return (
    <NavigationMenuContent
      data-slot="mega-menu-content"
      // Below sm the columns stack, as wide as the screen allows.
      className={cn('flex flex-col gap-1.5 p-2 max-sm:w-[min(var(--spacing)*96,calc(var(--available-width)_-_2px))] sm:flex-row', className)}
      {...props}
    >
      <div className="own:grid min-w-0 gap-1.5 sm:auto-cols-[minmax(0,calc(var(--spacing)*62))] sm:grid-flow-col">{children}</div>
      {featured && <div className="own:flex min-w-0 shrink-0 sm:w-60">{featured}</div>}
    </NavigationMenuContent>
  )
}

interface MegaMenuGroupProps extends Omit<ComponentProps<'div'>, 'title'> {
  /** The column's caption. It labels the group for assistive tech. */
  title?: ReactNode
}

/** A column of links under a caption. */
function MegaMenuGroup({ className, title, children, ...props }: MegaMenuGroupProps) {
  const id = useId()
  return (
    <div
      role="group"
      aria-labelledby={title ? id : undefined}
      data-slot="mega-menu-group"
      className={cn('own:flex min-w-0 flex-col gap-0.5', className)}
      {...props}
    >
      {title && (
        <div id={id} className="px-2.5 pt-2 pb-1 own:text-ui-xs own:font-medium own:tracking-wide text-fg-muted uppercase select-none">
          {title}
        </div>
      )}
      <ul className="flex flex-col gap-0.5">{children}</ul>
    </div>
  )
}

interface MegaMenuLinkProps extends Omit<ComponentProps<typeof NavigationMenuLink>, 'title'> {
  /** A 16px glyph for the tile; a youj icon plays while the link is hovered or focused. */
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
}

/** A destination: icon tile, title and a line of description. Choosing it closes the menu. */
function MegaMenuLink({ className, icon, title, description, closeOnClick = true, ...props }: MegaMenuLinkProps) {
  const id = useId()
  return (
    <li className="flex">
      <NavigationMenuLink
        data-slot="mega-menu-link"
        data-yj-trigger=""
        // Named by what it shows: the title, then the description.
        aria-labelledby={description ? `${id}-title ${id}-description` : `${id}-title`}
        closeOnClick={closeOnClick}
        className={cn('group/mega-link min-w-0 flex-1', className)}
        {...props}
      >
        {icon && (
          <span
            aria-hidden
            className={cn(
              'own:grid size-8 shrink-0 place-items-center rounded-md border border-line bg-surface own:text-fg-muted shadow-xs',
              'transition-colors yj-duration-fast ease-standard group-hover/mega-link:text-fg group-focus-visible/mega-link:text-fg',
            )}
          >
            {icon}
          </span>
        )}
        <span className="own:flex min-w-0 flex-col gap-0.5 break-words">
          <span id={`${id}-title`} className="own:font-medium own:text-fg">
            {title}
          </span>{' '}
          {description && (
            <span id={`${id}-description`} className="own:text-ui-sm own:text-fg-muted">
              {description}
            </span>
          )}
        </span>
      </NavigationMenuLink>
    </li>
  )
}

interface MegaMenuFeaturedProps extends Omit<ComponentProps<typeof NavigationMenuLink>, 'title' | 'media'> {
  /** Art for the top of the card: an image, a motion background piece. Decorative. */
  media?: ReactNode
  /** A small line above the title, e.g. "New". */
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
}

/** The featured card at the end of a panel: one link, art on top, copy below. */
function MegaMenuFeatured({ className, media, eyebrow, title, description, closeOnClick = true, ...props }: MegaMenuFeaturedProps) {
  const id = useId()
  return (
    <NavigationMenuLink
      data-slot="mega-menu-featured"
      aria-labelledby={eyebrow ? `${id}-eyebrow ${id}-title` : `${id}-title`}
      aria-describedby={description ? `${id}-description` : undefined}
      closeOnClick={closeOnClick}
      className={cn(
        'relative isolate flex-1 flex-col items-stretch gap-0 overflow-hidden border own:border-line own:bg-band own:p-0 hover:bg-band focus-visible:bg-band data-active:bg-band',
        'transition-[border-color] yj-duration-fast ease-standard hover:border-line-control',
        className,
      )}
      {...props}
    >
      <span aria-hidden className="relative own:block min-h-28 flex-1 overflow-hidden own:max-sm:hidden">
        {media ?? <span className="absolute inset-0 bg-linear-to-br from-accent/25 via-accent/5 to-transparent" />}
      </span>
      <span className="own:flex flex-col gap-1 border-t border-line bg-overlay p-3 max-sm:border-t-0">
        {eyebrow && (
          <span id={`${id}-eyebrow`} className="own:text-ui-xs own:font-medium own:tracking-wide own:text-accent-text own:uppercase">
            {eyebrow}
          </span>
        )}
        <span id={`${id}-title`} className="own:font-medium own:text-fg">
          {title}
        </span>
        {description && (
          <span id={`${id}-description`} className="own:text-ui-sm own:text-fg-muted">
            {description}
          </span>
        )}
      </span>
    </NavigationMenuLink>
  )
}

export { MegaMenuContent, MegaMenuFeatured, MegaMenuGroup, MegaMenuLink }
export type { MegaMenuContentProps, MegaMenuFeaturedProps, MegaMenuGroupProps, MegaMenuLinkProps }
