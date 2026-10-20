'use client'

import { useState } from 'react'
import { BellIcon, HomeIcon, InboxIcon, SearchIcon, UserIcon } from '@youj/icons'
import { BottomTabBar, BottomTabBarItem } from '@youj/react'

const TABS = [
  { id: 'home', label: 'Home', icon: <HomeIcon size={20} strokeWidth={1.75} /> },
  { id: 'search', label: 'Search', icon: <SearchIcon size={20} strokeWidth={1.75} /> },
  { id: 'inbox', label: 'Inbox', icon: <InboxIcon size={20} strokeWidth={1.75} />, badge: 3 },
  { id: 'activity', label: 'Activity', icon: <BellIcon size={20} strokeWidth={1.75} />, badge: true },
  { id: 'profile', label: 'Profile', icon: <UserIcon size={20} strokeWidth={1.75} /> },
]

export default function BottomTabBarDemo() {
  const [current, setCurrent] = useState('home')
  return (
    // A phone-sized frame. In an app the bar is fixed to the viewport: leave out className="absolute".
    <div className="relative h-[30rem] w-[22.5rem] max-w-full overflow-hidden rounded-[2rem] border border-line bg-canvas shadow-lg">
      <div className="flex flex-col gap-3 p-5 pt-10">
        <p className="text-2xl font-semibold tracking-tight text-fg capitalize">{current}</p>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-16 rounded-xl border border-line bg-surface" />
        ))}
      </div>
      <BottomTabBar className="absolute">
        {TABS.map((tab) => (
          <BottomTabBarItem
            key={tab.id}
            href={`#${tab.id}`}
            icon={tab.icon}
            label={tab.label}
            badge={tab.badge}
            active={current === tab.id}
            onClick={(event) => {
              event.preventDefault()
              setCurrent(tab.id)
            }}
          />
        ))}
      </BottomTabBar>
    </div>
  )
}
