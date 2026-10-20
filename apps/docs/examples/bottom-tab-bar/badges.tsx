'use client'

import { useState } from 'react'
import { CalendarIcon, HomeIcon, MessageIcon } from '@youj/icons'
import { BottomTabBar, BottomTabBarItem, Button } from '@youj/react'

export default function BottomTabBarBadges() {
  const [current, setCurrent] = useState('today')
  const [unread, setUnread] = useState(128)
  const [invite, setInvite] = useState(true)
  const tabs = [
    { id: 'today', label: 'Today', icon: <HomeIcon size={20} strokeWidth={1.75} /> },
    // A count reads "Messages, 128 unread"; past 99 it shows 99+.
    { id: 'messages', label: 'Messages', icon: <MessageIcon size={20} strokeWidth={1.75} />, badge: unread, badgeLabel: `${unread} unread` },
    // `true` is a dot: something new, no count.
    { id: 'calendar', label: 'Calendar', icon: <CalendarIcon size={20} strokeWidth={1.75} />, badge: invite, badgeLabel: 'new invite' },
  ]

  return (
    <div className="relative h-[20rem] w-[22.5rem] max-w-full overflow-hidden rounded-[2rem] border border-line bg-canvas shadow-lg">
      <div className="flex flex-col items-start gap-2 p-5 pt-10">
        <Button size="sm" variant="outline" onClick={() => setUnread((n) => (n > 0 ? 0 : 128))}>
          {unread > 0 ? 'Read all messages' : 'Receive 128 messages'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setInvite((v) => !v)}>
          {invite ? 'Open the invite' : 'Get an invite'}
        </Button>
      </div>
      <BottomTabBar className="absolute" aria-label="Sections">
        {tabs.map((tab) => (
          <BottomTabBarItem
            key={tab.id}
            href={`#${tab.id}`}
            icon={tab.icon}
            label={tab.label}
            badge={tab.badge}
            badgeLabel={tab.badgeLabel}
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
