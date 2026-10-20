'use client'

import { useState } from 'react'
import {
  Badge,
  Button,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@youj/react'
import { CopyIcon, ExternalLinkIcon, GitBranchIcon, RefreshIcon, RocketIcon, TrashIcon } from '@youj/icons'
import { IllustrationCloud } from '@youj/illustrations'

const ACTIONS = [
  { label: 'Promote to production', Icon: RocketIcon },
  { label: 'Redeploy', Icon: RefreshIcon },
  { label: 'Copy URL', Icon: CopyIcon },
  { label: 'Open deployment', Icon: ExternalLinkIcon },
]

export default function DrawerDemo() {
  const [last, setLast] = useState('')

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4 shadow-xs">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate font-mono text-ui-sm text-fg">orion-git-feat-search.acme.dev</span>
          <span className="flex items-center gap-1.5 text-ui-sm text-fg-muted">
            <GitBranchIcon size={14} /> feat/search · 4m ago
          </span>
        </div>
        {/* A bottom sheet: swipe it down, or drag the handle, to dismiss it. */}
        <Drawer>
          <DrawerTrigger render={<Button variant="outline" size="sm" />}>Actions</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader className="flex-row items-center gap-4">
              {/* Decorative: with no title the scene is hidden from assistive tech. */}
              <IllustrationCloud unit={9} className="-my-4 -mx-2 shrink-0" />
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <DrawerTitle>Preview deployment</DrawerTitle>
                  <Badge variant="secondary">Ready</Badge>
                </div>
                <DrawerDescription>feat/search, built in 41s from 3f9c2a1.</DrawerDescription>
              </div>
            </DrawerHeader>
            <div className="flex flex-col px-3">
              {ACTIONS.map(({ label, Icon }) => (
                <DrawerClose
                  key={label}
                  onClick={() => setLast(label)}
                  render={<Button variant="ghost" className="h-control-lg justify-start gap-3 px-2 text-ui-lg text-fg" />}
                >
                  <Icon className="text-fg-muted" />
                  {label}
                </DrawerClose>
              ))}
            </div>
            <DrawerFooter>
              <DrawerClose onClick={() => setLast('Delete deployment')} render={<Button variant="danger" className="h-control-lg" />}>
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
