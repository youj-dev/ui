'use client'

import { Button, Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@youj/react'
import { ActivityIcon } from '@youj/icons'
import { IllustrationCommunity, LineGrid } from '@youj/illustrations'

const PEOPLE = ['Ana Lima', 'Kenji Sato', 'Priya Raman', 'Jonas Weber']
const EVENTS = ['deployed feat/search', 'commented on a preview', 'promoted 4f2a91c to production', 'rolled back production']

// A day of activity: long enough to scroll inside the drawer.
const ACTIVITY = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  who: PEOPLE[i % PEOPLE.length],
  what: EVENTS[(i * 3) % EVENTS.length],
  when: `${i * 7 + 2}m ago`,
}))

export default function DrawerActivity() {
  return (
    <Drawer>
      <DrawerTrigger render={<Button variant="outline" />}>
        <ActivityIcon />
        Activity
      </DrawerTrigger>
      {/* Capped at 80% of the screen: the list scrolls inside, and a swipe down from its top still dismisses. */}
      <DrawerContent className="max-h-[80dvh]">
        <DrawerHeader>
          {/* Decorative: with no title the scene is hidden from assistive tech. */}
          <div className="relative isolate mb-2 grid place-items-center overflow-hidden rounded-lg border border-line py-1">
            <LineGrid gap={16} />
            <IllustrationCommunity unit={9} />
          </div>
          <DrawerTitle>Activity</DrawerTitle>
          <DrawerDescription>Everything that happened on orion today.</DrawerDescription>
        </DrawerHeader>
        <ul className="flex flex-col px-5 pb-5">
          {ACTIVITY.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 border-b border-line py-2.5 last:border-b-0">
              <span className="text-ui">
                <span className="font-medium text-fg">{item.who}</span> <span className="text-fg-muted">{item.what}</span>
              </span>
              <span className="shrink-0 text-ui-sm text-fg-muted tabular-nums">{item.when}</span>
            </li>
          ))}
        </ul>
      </DrawerContent>
    </Drawer>
  )
}
