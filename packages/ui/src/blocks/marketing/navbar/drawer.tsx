'use client'

import type { ElementType, ReactNode } from 'react'
import { AppHeaderMenuLink } from '../../../components/ui/app-header'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../components/ui/accordion'
import { Badge } from '../../../components/ui/badge'
import { Button, buttonVariants } from '../../../components/ui/button'
import { cn } from '../../../lib/utils'
import { UserAvatar } from './account'
import type { MarketingNavbarAccountLink, MarketingNavbarCopy, MarketingNavbarCta, MarketingNavbarItem, MarketingNavbarUser } from './data'

/* The phone drawer's body: each mega menu becomes a section that folds open
 * (the one holding the current page starts open), plain links sit below, and
 * the footer carries the account: the calls to action when signed out, the
 * person and their pages when signed in. Following any link closes the drawer. */

interface DrawerLinksProps {
  links: MarketingNavbarItem[]
  current?: string
  label: string
  Link: ElementType
}

export function DrawerLinks({ links, current, label, Link }: DrawerLinksProps) {
  const menus = links.filter((item) => item.groups)
  const plain = links.filter((item) => !item.groups)
  const open = menus.filter((item) => item.groups?.some((group) => group.links.some((link) => link.href === current))).map((item) => item.label)
  return (
    <>
      {menus.length > 0 && (
        <Accordion aria-label={label} defaultValue={open} className="gap-0 px-1">
          {menus.map((item) => (
            <AccordionItem key={item.label} value={item.label}>
              <AccordionTrigger className="min-h-control-lg px-2 text-ui-lg">{item.label}</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-2 [&_a]:no-underline">
                {item.groups?.map((group) => (
                  <div key={group.title} role="group" aria-label={group.title} className="flex flex-col gap-0.5">
                    <p aria-hidden className="px-2 pt-1 pb-0.5 text-ui-xs font-medium tracking-wide text-fg-muted uppercase">
                      {group.title}
                    </p>
                    {group.links.map((link) => (
                      <AppHeaderMenuLink
                        key={link.href}
                        href={link.href}
                        render={<Link href={link.href} />}
                        active={current === link.href}
                        className="items-start py-2 text-ui"
                      >
                        {link.icon}
                        <span className="flex min-w-0 flex-col">
                          <span className="font-medium text-fg">
                            {link.label}
                            {link.badge && <Badge className="ms-2 align-middle">{link.badge}</Badge>}
                          </span>
                          {link.description && <span className="text-ui-sm font-normal text-fg-muted">{link.description}</span>}
                        </span>
                      </AppHeaderMenuLink>
                    ))}
                  </div>
                ))}
                {item.cards?.map((card) => (
                  <AppHeaderMenuLink key={card.href} href={card.href} render={<Link href={card.href} />} className="flex-col items-start gap-0 border border-line bg-transparent py-2 text-ui">
                    {card.eyebrow && <span className="text-ui-xs font-medium tracking-wide text-accent-text uppercase">{card.eyebrow}</span>}
                    <span className="font-medium text-fg">{card.title}</span>
                  </AppHeaderMenuLink>
                ))}
                {item.featured && (
                  <AppHeaderMenuLink href={item.featured.href} render={<Link href={item.featured.href} />} className="flex-col items-start gap-0 border border-line bg-transparent py-2 text-ui">
                    {item.featured.eyebrow && <span className="text-ui-xs font-medium tracking-wide text-accent-text uppercase">{item.featured.eyebrow}</span>}
                    <span className="font-medium text-fg">{item.featured.title}</span>
                  </AppHeaderMenuLink>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
      {plain.map((item) => (
        <AppHeaderMenuLink key={item.label} href={item.href} render={<Link href={item.href ?? ''} />} active={current === item.href}>
          {item.icon} {item.label}
          {item.badge && (
            <Badge variant="secondary" className="ms-auto">
              {item.badge}
            </Badge>
          )}
        </AppHeaderMenuLink>
      ))}
    </>
  )
}

interface DrawerFooterProps {
  user?: MarketingNavbarUser | null
  accountLinks: MarketingNavbarAccountLink[]
  primary: MarketingNavbarCta | null
  secondary: MarketingNavbarCta | null
  onSignOut?: () => void
  copy: MarketingNavbarCopy
  Link: ElementType
}

export function drawerFooter({ user, accountLinks, primary, secondary, onSignOut, copy, Link }: DrawerFooterProps): ReactNode {
  const cta = (item: MarketingNavbarCta, variant: 'default' | 'outline') => (
    <Link key={item.href} href={item.href} onClick={item.onClick} className={buttonVariants({ size: 'lg', variant })}>
      {item.label}
    </Link>
  )
  if (user) {
    return (
      <>
        <div className="flex items-center gap-3">
          <UserAvatar user={user} />
          <p className="flex min-w-0 flex-col">
            <span className="truncate font-medium text-fg">{user.name}</span>
            {user.email && <span className={cn('truncate text-ui-sm text-fg-muted')}>{user.email}</span>}
          </p>
        </div>
        {primary && cta(primary, 'default')}
        <div className="flex gap-2">
          {accountLinks.slice(0, 2).map((link) => (
            <Link key={link.href} href={link.href} className={buttonVariants({ variant: 'outline', className: 'flex-1' })}>
              {link.label}
            </Link>
          ))}
          <Button variant="ghost" className="flex-1" onClick={onSignOut}>
            {copy.signOut}
          </Button>
        </div>
      </>
    )
  }
  return (
    (primary || secondary) && (
      <>
        {primary && cta(primary, 'default')}
        {secondary && cta(secondary, 'outline')}
      </>
    )
  )
}
