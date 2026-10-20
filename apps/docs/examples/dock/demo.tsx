'use client'

import { useState } from 'react'
import { CompassIcon, HomeIcon, ImageIcon, MailIcon, MessageIcon, MusicIcon, SettingsIcon, TerminalIcon } from '@youj/icons'
import { Dock, type DockItem } from '@youj/motion/interactions'

// Youj icons play their own choreography when their dock button is hovered or focused.
const APPS: DockItem[] = [
  { id: 'home', label: 'Home', icon: <HomeIcon /> },
  { id: 'browser', label: 'Browser', icon: <CompassIcon /> },
  { id: 'mail', label: 'Mail', icon: <MailIcon /> },
  { id: 'messages', label: 'Messages', icon: <MessageIcon /> },
  { id: 'photos', label: 'Photos', icon: <ImageIcon /> },
  { id: 'music', label: 'Music', icon: <MusicIcon /> },
  { id: 'terminal', label: 'Terminal', icon: <TerminalIcon /> },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
]

export default function DockDemo() {
  const [app, setApp] = useState('mail')
  const current = APPS.find((a) => a.id === app)

  return (
    <div className="flex h-64 w-full flex-col items-center justify-between pt-6 pb-3">
      <p className="text-sm text-fg-muted">
        <span className="font-medium text-fg">{current?.label}</span> is open
      </p>
      {/* Eight icons are wider than a phone: the dock scrolls inside its own frame, with room above for the lens and tooltip. */}
      <div className="-mt-12 max-w-full overflow-x-auto px-2 pt-12 [scrollbar-width:none]">
        <Dock items={APPS} value={app} onValueChange={setApp} size={44} label="Applications" />
      </div>
    </div>
  )
}
