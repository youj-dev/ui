'use client'

import { useState, type ElementType } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { MotionFeatures, useYouj } from '@youj/core'
import { ArrowRightIcon } from '@youj/icons'
import { Badge } from '../../../components/ui/badge'
import { MegaMenuFeatured, MegaMenuGroup, MegaMenuLink } from '../../../components/ui/mega-menu'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '../../../components/ui/navigation-menu'
import type { MarketingNavbarItem, MarketingNavbarLink } from './data'

/* The wide-screen navigation: triggers that open mega menus and plain links.
 * A panel's links sit in columns; beside them a preview card follows the link
 * under the pointer or keyboard focus (decorative, the link's words say the
 * same), cross-fading as the next rises in from the way you moved through the
 * list; or a column of media cards (a post, a guide, a story). An optional
 * strip under both points at a launch. The trigger of the menu holding the
 * current page carries a dot. */

function Preview({ link, from }: { link: MarketingNavbarLink; from: number }) {
  const k = useYouj()
  const preview = link.preview
  return (
    <MotionFeatures>
      <AnimatePresence initial={false} mode="popLayout">
        <m.div
          key={link.href}
          initial={k.reduced ? false : { opacity: 0, y: 10 * from }}
          animate={{ opacity: 1, y: 0 }}
          exit={k.reduced ? undefined : { opacity: 0, y: -6 * from, transition: k.tween('fast', 'exit') }}
          transition={k.tween('base', 'enter')}
          className="flex size-full flex-col"
        >
          <div className="relative min-h-36 flex-1 overflow-hidden bg-linear-to-br from-accent-subtle to-transparent">{preview?.media}</div>
          <div className="flex flex-col gap-1 border-t border-line bg-overlay p-3">
            <p className="font-medium text-fg">{preview?.title ?? link.label}</p>
            <p className="text-ui-sm text-fg-muted">{preview?.description ?? link.description}</p>
          </div>
        </m.div>
      </AnimatePresence>
    </MotionFeatures>
  )
}

function Panel({ item, current, Link }: { item: MarketingNavbarItem; current?: string; Link: ElementType }) {
  const links = (item.groups ?? []).flatMap((group) => group.links)
  // The preview starts on the current page when this menu holds it.
  const [focus, setFocus] = useState({ href: (links.find((link) => link.href === current) ?? links[0])?.href, from: 1 })
  const active = links.find((link) => link.href === focus.href) ?? links[0]
  const previewed = links.some((link) => link.preview)
  const point = (href: string) => {
    if (href === focus.href) return
    const from = links.findIndex((link) => link.href === href) > links.findIndex((link) => link.href === focus.href) ? 1 : -1
    setFocus({ href, from })
  }
  const featured = item.featured
  return (
    <NavigationMenuContent className="flex flex-col gap-1.5 p-2">
      <div className="flex flex-col gap-1.5 sm:flex-row">
        <div className="grid min-w-0 gap-1.5 sm:auto-cols-[minmax(0,calc(var(--spacing)*62))] sm:grid-flow-col">
          {item.groups?.map((group) => (
            <MegaMenuGroup key={group.title} title={group.title}>
              {group.links.map((link) => (
                <MegaMenuLink
                  key={link.href}
                  href={link.href}
                  render={<Link href={link.href} />}
                  active={link.href === current}
                  icon={link.icon}
                  title={
                    <>
                      {link.label}
                      {link.badge && (
                        <Badge variant="default" className="ms-2 align-middle">
                          {link.badge}
                        </Badge>
                      )}
                    </>
                  }
                  description={link.description}
                  onMouseEnter={() => point(link.href)}
                  onFocus={() => point(link.href)}
                />
              ))}
            </MegaMenuGroup>
          ))}
        </div>
        {previewed && active && !item.cards && (
          <div aria-hidden data-slot="navbar-preview" className="flex w-60 shrink-0 overflow-hidden rounded-lg border border-line max-lg:hidden">
            <Preview link={active} from={focus.from} />
          </div>
        )}
        {item.cards && item.cards.length > 0 && (
          <div data-slot="navbar-cards" className="flex w-60 shrink-0 flex-col gap-1.5 max-lg:hidden">
            {item.cards.map((card) => (
              <MegaMenuFeatured
                key={card.href}
                href={card.href}
                render={<Link href={card.href} />}
                media={card.media}
                eyebrow={card.eyebrow}
                title={card.title}
                description={card.meta}
              />
            ))}
          </div>
        )}
      </div>
      {featured && (
        <NavigationMenuLink
          href={featured.href}
          render={<Link href={featured.href} />}
          closeOnClick
          className="items-center justify-between gap-4 border border-line bg-transparent own:px-3.5 own:py-2.5"
        >
          <span className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-0.5">
            {featured.eyebrow && <span className="text-ui-xs font-medium tracking-wide text-accent-text uppercase">{featured.eyebrow}</span>}
            <span className="font-medium text-fg">{featured.title}</span>
            {featured.description && <span className="text-ui-sm text-fg-muted">{featured.description}</span>}
          </span>
          <ArrowRightIcon size={16} aria-hidden className="text-fg-muted rtl:-scale-x-100" />
        </NavigationMenuLink>
      )}
    </NavigationMenuContent>
  )
}

/** Whether a menu holds the page being shown. */
export const holds = (item: MarketingNavbarItem, current?: string) => !!current && !!item.groups?.some((group) => group.links.some((link) => link.href === current))

interface DesktopNavProps {
  links: MarketingNavbarItem[]
  current?: string
  label: string
  /** The open menu's label, `null` for none, to control it. */
  menu?: string | null
  defaultMenu?: string | null
  onMenuChange?: (menu: string | null) => void
  Link: ElementType
}

export function DesktopNav({ links, current, label, menu, defaultMenu, onMenuChange, Link }: DesktopNavProps) {
  return (
    <NavigationMenu aria-label={label} value={menu} defaultValue={defaultMenu} onValueChange={(value) => onMenuChange?.(value == null ? null : String(value))}>
      <NavigationMenuList>
        {links.map((item) =>
          item.groups ? (
            <NavigationMenuItem key={item.label} value={item.label}>
              <NavigationMenuTrigger>
                {item.label}
                {holds(item, current) && <span aria-hidden data-slot="navbar-current-dot" className="size-1 rounded-full bg-accent" />}
              </NavigationMenuTrigger>
              <Panel item={item} current={current} Link={Link} />
            </NavigationMenuItem>
          ) : (
            <NavigationMenuItem key={item.label}>
              <NavigationMenuLink
                href={item.href}
                render={<Link href={item.href ?? ''} />}
                aria-current={current === item.href ? 'page' : undefined}
                className={navigationMenuTriggerStyle()}
              >
                {item.label}
              </NavigationMenuLink>
            </NavigationMenuItem>
          ),
        )}
      </NavigationMenuList>
    </NavigationMenu>
  )
}
