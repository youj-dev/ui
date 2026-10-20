'use client'

import type { ReactNode } from 'react'
import { PlusIcon } from '@youj/icons'
import { AppHeader, AppHeaderActions } from '../../components/ui/app-header'
import { Button } from '../../components/ui/button'
import { SidebarTrigger } from '../../components/ui/sidebar'
import { cn } from '../../lib/utils'
import { useFrame, type FrameTopbarSlots } from './shell'

/* The quietest top bar: the sidebar's trigger and the page's name set large,
 * then search, the bell, one primary action and the account. No separators,
 * no surface: it's transparent until content scrolls under it, then it turns
 * into a blurred surface with a hairline and the name settles to the bar's
 * working size, scaling from its start edge so nothing reflows. Reduced
 * motion: the same states, at once. It names the page, so the frame folds
 * the page's own title (shell.tsx). */

interface FrameTopbarMinimalProps extends FrameTopbarSlots {
  /** The bar's one primary action. Default: a New button; `null` for none. */
  primary?: ReactNode
}

function FrameTopbarMinimal({ search, actions, account, primary, className }: FrameTopbarMinimalProps) {
  const { trail, mobileNav } = useFrame()
  const page = trail?.child ?? trail?.item
  return (
    <AppHeader
      data-yj-frame-topbar="minimal"
      data-yj-frame-titled
      // Beside an open sidebar on a tablet, the search slims down so the title keeps its room.
      className={cn('gap-2 data-condensed:shadow-none md:gap-3 md:px-4 md:max-lg:[&_[data-frame-search]]:w-40', className)}
    >
      <SidebarTrigger className={cn('-ms-1', mobileNav === 'tabs' && 'max-md:hidden')} />
      {page && (
        <span
          className={cn(
            'min-w-0 origin-left truncate text-lg font-semibold tracking-tight text-fg rtl:origin-right',
            'transition-[scale] yj-duration-base ease-standard group-data-condensed/app-header:scale-[0.875]',
          )}
        >
          {page.label}
        </span>
      )}
      <AppHeaderActions>
        {search}
        {actions}
        {primary === undefined ? (
          <Button size="sm">
            <PlusIcon size={16} strokeWidth={1.75} />
            New
          </Button>
        ) : (
          primary
        )}
        {account}
      </AppHeaderActions>
    </AppHeader>
  )
}

export { FrameTopbarMinimal }
export type { FrameTopbarMinimalProps }
