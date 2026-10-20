'use client'

import type { ElementType, ReactNode } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../components/ui/accordion'
import { AppHeaderMenuLink } from '../../../components/ui/app-header'
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle } from '../../../components/ui/sheet'
import { cn } from '../../../lib/utils'
import type { NavbarStoreCopy, NavbarStoreDepartment, NavbarStoreLink } from './data'

/* The phone drawer, from the inline start: each department folds open to its
 * columns and a strip of its collections (the one holding the current page
 * starts open), the plain departments follow, and the foot holds the region
 * menu and the utility links. Following any link closes it. */

interface StoreDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  departments: NavbarStoreDepartment[]
  current?: string
  title: ReactNode
  /** The region menu, drawn by the bar. */
  region: ReactNode
  utilityLinks: NavbarStoreLink[]
  copy: NavbarStoreCopy
  Link: ElementType
}

export function StoreDrawer({ open, onOpenChange, departments, current, title, region, utilityLinks, copy, Link }: StoreDrawerProps) {
  const menus = departments.filter((d) => d.groups)
  const plain = departments.filter((d) => !d.groups)
  const holding = menus.filter((d) => d.groups?.some((g) => g.links.some((l) => l.href === current))).map((d) => d.label)
  const close = () => onOpenChange(false)
  const row = 'min-h-control-lg text-ui-lg'
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="start" data-slot="navbar-store-drawer" className="md:hidden">
        <SheetHeader className="py-3">
          <SheetTitle className="flex items-center gap-2 [&_svg]:size-5">{title}</SheetTitle>
        </SheetHeader>
        <SheetBody className="gap-1 own:p-2">
          <nav aria-label={copy.navLabel} className="flex flex-col gap-0.5">
            {menus.length > 0 && (
              <Accordion defaultValue={holding} className="gap-0">
                {menus.map((department) => (
                  <AccordionItem key={department.label} value={department.label}>
                    <AccordionTrigger className={cn(row, 'px-3', department.highlight && 'text-accent-text')}>{department.label}</AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-4 pb-4 [&_a]:no-underline">
                      {department.groups?.map((group) => (
                        <div key={group.title} role="group" aria-label={group.title} className="flex flex-col gap-0.5">
                          <p aria-hidden className="px-3 pb-1 text-ui-xs font-medium tracking-wide text-fg-subtle uppercase">
                            {group.title}
                          </p>
                          {group.links.map((link) => (
                            <AppHeaderMenuLink key={link.href} href={link.href} render={<Link href={link.href} />} active={link.href === current} onClick={close} className="text-ui">
                              {link.label}
                            </AppHeaderMenuLink>
                          ))}
                        </div>
                      ))}
                      {department.collections && (
                        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
                          {department.collections.map((collection) => (
                            <Link
                              key={collection.href}
                              href={collection.href}
                              onClick={close}
                              className="flex w-36 shrink-0 flex-col gap-1.5 rounded-lg p-1 text-ui-sm font-medium text-fg focus-ring"
                            >
                              <span aria-hidden className="block aspect-4/3 overflow-hidden rounded-md border border-line">
                                {collection.media}
                              </span>
                              {collection.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
            {plain.map((department) => (
              <AppHeaderMenuLink
                key={department.label}
                href={department.href}
                render={<Link href={department.href ?? ''} />}
                active={department.href === current}
                onClick={close}
                className={cn(department.highlight && 'text-accent-text')}
              >
                {department.label}
              </AppHeaderMenuLink>
            ))}
          </nav>
        </SheetBody>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line p-4">
          {region}
          <nav aria-label={copy.utilityLabel} className="ms-auto flex gap-4 text-ui-sm">
            {utilityLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={close} className="rounded-sm text-fg-muted hover:text-fg focus-ring">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
}
