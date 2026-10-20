'use client'

import { DownloadIcon, PlusIcon, RocketIcon, SettingsIcon, ShareIcon, TrashIcon } from '@youj/icons'
import { Button } from '@youj/react'

export default function IconsInButtons() {
  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-6">
      {/* The button sizes its icon, and its hover and focus play it. Pass only the stroke. */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button>
          <RocketIcon strokeWidth={1.75} />
          Deploy
        </Button>
        <Button variant="outline">
          <PlusIcon strokeWidth={1.75} />
          New project
        </Button>
        <Button variant="outline">
          <ShareIcon strokeWidth={1.75} />
          Share
        </Button>
        {/* Icon-only: the button needs a name, the icon stays decorative. */}
        <Button variant="ghost" size="icon" aria-label="Settings">
          <SettingsIcon strokeWidth={1.75} />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Delete project">
          <TrashIcon strokeWidth={1.75} />
        </Button>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {(['xs', 'sm', 'default', 'lg'] as const).map((size) => (
          <Button key={size} variant="secondary" size={size}>
            <DownloadIcon strokeWidth={size === 'lg' ? 1.5 : 1.75} />
            Export
          </Button>
        ))}
      </div>
    </div>
  )
}
