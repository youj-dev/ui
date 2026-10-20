import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ArrowUpRightIcon, CopyIcon, GitBranchIcon, RefreshIcon, RocketIcon, TrashIcon } from '@youj/icons'
import { Badge } from './badge'
import { Button } from './button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  type DrawerDirection,
} from './drawer'

const meta: Meta<typeof DrawerContent> = {
  title: 'UI/Overlays/Drawer',
  component: DrawerContent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Base UI drawer: a modal panel on an edge that follows the finger and dismisses when swiped towards that edge (drag the handle with a mouse). A flick leaves faster than a slow drag; a short drag springs back. motion’s yj-sheet-* slides it off its edge (slow in, base out, scaled by the swipe strength) and yj-backdrop thins the scrim as it is pulled away. It bleeds 3rem past its edge, so pulling the other way never shows a gap. Focus is trapped and returns to the trigger; Escape and the scrim close it. Reduced motion: instant open and close, while a swipe still tracks the finger.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof DrawerContent>

const actions = [
  { label: 'Promote to production', icon: RocketIcon },
  { label: 'Redeploy', icon: RefreshIcon },
  { label: 'Copy URL', icon: CopyIcon },
  { label: 'Open deployment', icon: ArrowUpRightIcon },
]

function DeploymentSheet() {
  const [last, setLast] = useState('')
  return (
    <div className="flex w-80 flex-col gap-3">
      <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4 shadow-xs">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate font-mono text-ui-sm">orion-git-feat-search.acme.dev</span>
          <span className="flex items-center gap-1.5 text-ui-sm text-fg-muted">
            <GitBranchIcon className="size-3.5" /> feat/search · 4m ago
          </span>
        </div>
        <Drawer>
          <DrawerTrigger render={<Button variant="outline" size="sm" />}>Actions</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <div className="flex items-center gap-2">
                <DrawerTitle>Preview deployment</DrawerTitle>
                <Badge variant="secondary">Ready</Badge>
              </div>
              <DrawerDescription>feat/search, built in 41s from 3f9c2a1.</DrawerDescription>
            </DrawerHeader>
            <div className="flex flex-col px-3">
              {actions.map((a) => (
                <DrawerClose
                  key={a.label}
                  onClick={() => setLast(a.label)}
                  render={
                    <Button variant="ghost" className="h-control-lg justify-start gap-3 px-2 text-ui-lg text-fg" />
                  }
                >
                  <a.icon className="text-fg-muted" />
                  {a.label}
                </DrawerClose>
              ))}
            </div>
            <DrawerFooter>
              <DrawerClose
                onClick={() => setLast('Delete deployment')}
                render={<Button variant="danger" className="h-control-lg" />}
              >
                <TrashIcon />
                Delete deployment
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
      <p role="status" className="h-4 text-ui-sm text-fg-muted">
        {last && `Chose “${last}”`}
      </p>
    </div>
  )
}

/** An action sheet for a deployment. Swipe it down (or drag the handle) to dismiss; flick it and it leaves faster. */
export const Hero: Story = {
  render: () => <DeploymentSheet />,
}

const directions: DrawerDirection[] = ['down', 'up', 'left', 'right']

/** `swipeDirection` picks the edge: the drawer dismisses towards it. */
export const Directions: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-3">
      {directions.map((direction) => (
        <Drawer key={direction} swipeDirection={direction}>
          <DrawerTrigger render={<Button variant="outline" className="w-28 capitalize" />}>{direction}</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle className="capitalize">Swipe {direction}</DrawerTitle>
              <DrawerDescription>Swipe {direction} to dismiss, or press Escape.</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <DrawerClose render={<Button variant="outline" />}>Close</DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ))}
    </div>
  ),
}

const activity = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  who: ['Ada', 'Grace', 'Alan', 'Barbara'][i % 4],
  what: ['deployed feat/search', 'commented on preview', 'promoted to production', 'rolled back'][i % 4],
  when: `${i + 2}m ago`,
}))

/** Long content scrolls inside the drawer; swiping down from the top of the list still dismisses it. */
export const LongContent: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger render={<Button variant="outline" />}>Activity</DrawerTrigger>
      <DrawerContent className="max-h-[80dvh]">
        <DrawerHeader>
          <DrawerTitle>Activity</DrawerTitle>
          <DrawerDescription>Everything that happened on orion today.</DrawerDescription>
        </DrawerHeader>
        <ul className="flex flex-col px-5 pb-5">
          {activity.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 border-b border-line py-2.5 last:border-b-0">
              <span className="text-ui">
                <span className="font-medium">{a.who}</span> <span className="text-fg-muted">{a.what}</span>
              </span>
              <span className="shrink-0 text-ui-sm text-fg-muted tabular-nums">{a.when}</span>
            </li>
          ))}
        </ul>
      </DrawerContent>
    </Drawer>
  ),
}
