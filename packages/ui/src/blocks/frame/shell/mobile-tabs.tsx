'use client'

import { useLabels } from '@youj/core'
import { MenuIcon } from '@youj/icons'
import { BottomTabBar, BottomTabBarItem } from '../../../components/ui/bottom-tab-bar'
import { useSidebar } from '../../../components/ui/sidebar'
import { useFrame } from './context'

/** The phone's tab bar: the first four pages that have an icon, then Menu, which opens the sidebar's sheet. */
export function FrameTabBar() {
  const { nav, trail, link, Link } = useFrame()
  const { openMobile, setOpenMobile } = useSidebar()
  const labels = useLabels()
  const items = nav.flatMap((section) => section.items).filter((item) => item.icon).slice(0, 4)
  return (
    <BottomTabBar data-slot="frame-tab-bar" className="md:hidden">
      {items.map((item) => {
        const Icon = item.icon!
        const { href, onClick } = link(item)
        return (
          <BottomTabBarItem
            key={item.id}
            href={href}
            onClick={onClick}
            render={<Link />}
            active={trail?.item.id === item.id}
            icon={<Icon size={20} strokeWidth={1.75} />}
            label={item.label}
            badge={typeof item.badge === 'number' ? item.badge : undefined}
            badgeLabel={item.badgeLabel}
          />
        )
      })}
      <BottomTabBarItem
        render={<button type="button" aria-expanded={openMobile} onClick={() => setOpenMobile(true)} />}
        icon={<MenuIcon active={openMobile} size={20} strokeWidth={1.75} />}
        label={labels.menu}
      />
    </BottomTabBar>
  )
}
