'use client'

import { AppHeader, AppHeaderActions } from '../../components/ui/app-header'
import { Separator } from '../../components/ui/separator'
import { SidebarTrigger } from '../../components/ui/sidebar'
import { cn } from '../../lib/utils'
import { useFrame, type FrameTopbarSlots } from './shell'

/* A top bar with search in the middle, for apps where finding things is the
 * point: the sidebar's trigger and the page's name at the start, the search
 * stretched wide in the center (up to 36rem), actions and the account at the
 * end. Equal side columns keep the search on the bar's true center whatever
 * sits beside it. Both search parts fill the center: the ⌘K palette's button
 * and the inline field. With no search, the page's name takes the center.
 * On phones the search folds into an icon beside the actions. It sticks,
 * and condenses into a blurred surface as the page scrolls under it. It
 * names the page, so the frame folds the page's own title (shell.tsx). */

type FrameTopbarSearchProps = FrameTopbarSlots

const titleClass = 'truncate text-ui-lg font-semibold tracking-tight text-fg'

function FrameTopbarSearch({ search, actions, account, className }: FrameTopbarSearchProps) {
  const { trail, mobileNav } = useFrame()
  const page = trail?.child ?? trail?.item
  const hideOnTabs = mobileNav === 'tabs' && 'max-md:hidden'
  return (
    <AppHeader
      data-yj-frame-topbar="search"
      data-yj-frame-titled
      className={cn(
        'grid grid-cols-[minmax(0,1fr)_auto_auto] gap-1 md:grid-cols-[minmax(auto,1fr)_minmax(0,--spacing(144))_minmax(auto,1fr)] md:gap-4 md:px-4',
        className,
      )}
    >
      {/* Phones: the title gives way first. Wider: the start keeps its content (the title capped) and the search takes what's left. */}
      <div className="flex min-w-0 items-center gap-3 md:min-w-max">
        <SidebarTrigger className={cn('-ms-1', hideOnTabs)} />
        <Separator
          orientation="vertical"
          className={cn('h-4 data-[orientation=vertical]:self-center', hideOnTabs, !search && 'md:hidden')}
        />
        {page && <span className={cn(titleClass, 'md:max-w-40 lg:max-w-64', !search && 'md:hidden')}>{page.label}</span>}
      </div>
      <div
        data-slot="frame-topbar-search"
        className="flex min-w-0 items-center justify-center md:[&_[data-frame-search]]:w-full"
      >
        {search ?? (page && <span className={cn(titleClass, 'max-md:hidden')}>{page.label}</span>)}
      </div>
      <AppHeaderActions>
        {actions}
        {account}
      </AppHeaderActions>
    </AppHeader>
  )
}

export { FrameTopbarSearch }
export type { FrameTopbarSearchProps }
