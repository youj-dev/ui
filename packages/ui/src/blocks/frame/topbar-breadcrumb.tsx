'use client'

import { Fragment } from 'react'
import { AppHeader, AppHeaderActions } from '../../components/ui/app-header'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '../../components/ui/breadcrumb'
import { Separator } from '../../components/ui/separator'
import { SidebarTrigger } from '../../components/ui/sidebar'
import { cn } from '../../lib/utils'
import { firstPageIn, useFrame, type FrameTopbarSlots } from './shell'

/* The top bar most apps start with: the sidebar's trigger, then where you
 * are as a breadcrumb (section, the groups a page sits in, the page), then search, actions and
 * the account on the inline end. It sticks, and condenses into a blurred
 * surface once the page scrolls under it. On phones the section drops out of
 * the trail and the trigger opens the sidebar's sheet (with the tab bar, the
 * tab bar's Menu does, so the trigger steps aside). */

type FrameTopbarBreadcrumbProps = FrameTopbarSlots

function FrameTopbarBreadcrumb({ search, actions, account, className }: FrameTopbarBreadcrumbProps) {
  const { trail, mobileNav, link, Link } = useFrame()
  return (
    <AppHeader
      data-yj-frame-topbar="breadcrumb"
      // Beside an open sidebar on a tablet, the search slims down so the trail keeps its room.
      className={cn('gap-3 md:gap-3 md:px-4 md:max-lg:[&_[data-frame-search]]:w-40', className)}
    >
      <SidebarTrigger className={cn('-ms-1', mobileNav === 'tabs' && 'max-md:hidden')} />
      <Separator orientation="vertical" className={cn('h-4 data-[orientation=vertical]:self-center', mobileNav === 'tabs' && 'max-md:hidden')} />
      <Breadcrumb className="min-w-0">
        {trail && (
          <BreadcrumbList className="flex-nowrap">
            {trail.section.label && (
              <>
                <BreadcrumbItem key="section" className="max-sm:hidden">
                  {trail.section.label}
                </BreadcrumbItem>
                <BreadcrumbSeparator key="section-separator" className="max-sm:hidden" />
              </>
            )}
            {trail.child ? (
              <>
                {/* Each group leads to its first page; a deep trail keeps its middle steps from md up. */}
                {[trail.item, ...(trail.parents ?? [])].map((group, i) => (
                  <Fragment key={group.id}>
                    <BreadcrumbItem className={i ? 'max-md:hidden' : 'max-sm:hidden'}>
                      <BreadcrumbLink render={<Link />} {...link(firstPageIn(group))} aria-current={undefined}>
                        {group.label}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className={i ? 'max-md:hidden' : 'max-sm:hidden'} />
                  </Fragment>
                ))}
                <BreadcrumbItem key={trail.child.id} className="min-w-0">
                  <BreadcrumbPage>{trail.child.label}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            ) : (
              <BreadcrumbItem key={trail.item.id} className="min-w-0">
                <BreadcrumbPage>{trail.item.label}</BreadcrumbPage>
              </BreadcrumbItem>
            )}
          </BreadcrumbList>
        )}
      </Breadcrumb>
      <AppHeaderActions>
        {search}
        {actions}
        {account}
      </AppHeaderActions>
    </AppHeader>
  )
}

export { FrameTopbarBreadcrumb }
export type { FrameTopbarBreadcrumbProps }
