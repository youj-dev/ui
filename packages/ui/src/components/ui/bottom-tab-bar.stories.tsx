import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { BellIcon, HomeIcon, InboxIcon, SearchIcon, UserIcon } from '@youj/icons'
import { BottomTabBar, BottomTabBarItem } from './bottom-tab-bar'

const meta: Meta<typeof BottomTabBar> = {
  title: 'UI/Navigation/BottomTabBar',
  component: BottomTabBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A phone app\'s primary navigation, pinned to the bottom edge and padded by the safe-area inset. The current tab\'s icon sits on a pill, one motion SlidingIndicator that glides between tabs on the smooth spring, and its label turns to ink; each youj icon plays on hover and focus. Badges count what\'s waiting and are read after the label ("Inbox, 3 new"). The tabs are links with aria-current="page". Reduced motion: the pill jumps. Fixed to the viewport by default; `className="absolute"` places it in a frame, as here.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof BottomTabBar>

const tabs = [
  { id: 'home', label: 'Home', icon: <HomeIcon size={20} strokeWidth={1.75} /> },
  { id: 'search', label: 'Search', icon: <SearchIcon size={20} strokeWidth={1.75} /> },
  { id: 'inbox', label: 'Inbox', icon: <InboxIcon size={20} strokeWidth={1.75} />, badge: 3 },
  { id: 'activity', label: 'Activity', icon: <BellIcon size={20} strokeWidth={1.75} />, badge: true },
  { id: 'profile', label: 'Profile', icon: <UserIcon size={20} strokeWidth={1.75} /> },
] as const

function Phone() {
  const [current, setCurrent] = useState<string>('home')
  return (
    <div className="grid min-h-dvh grid-cols-[minmax(0,1fr)] place-items-center bg-canvas p-6">
      <div className="relative h-[44rem] w-[24.375rem] max-w-full overflow-hidden rounded-[2.5rem] border border-line bg-canvas shadow-lg">
        <div className="flex flex-col gap-3 p-5 pt-12">
          <h1 className="text-2xl font-semibold tracking-tight text-fg capitalize">{current}</h1>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-20 rounded-xl border border-line bg-surface" />
          ))}
        </div>
        <BottomTabBar className="absolute">
          {tabs.map((tab) => (
            <BottomTabBarItem
              key={tab.id}
              href={`#${tab.id}`}
              icon={tab.icon}
              label={tab.label}
              badge={'badge' in tab ? tab.badge : undefined}
              active={current === tab.id}
              onClick={(event) => {
                event.preventDefault()
                setCurrent(tab.id)
              }}
            />
          ))}
        </BottomTabBar>
      </div>
    </div>
  )
}

export const Default: Story = { render: () => <Phone /> }
