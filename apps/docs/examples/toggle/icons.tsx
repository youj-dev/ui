'use client'

import { useState } from 'react'
import { Toggle } from '@youj/react'
import { BookmarkIcon, EyeIcon, MicIcon, PinIcon, type YoujIconComponent } from '@youj/icons'

const TOGGLES: { id: string; label: string; Icon: YoujIconComponent; states: [string, string] }[] = [
  { id: 'pin', label: 'Pin project', Icon: PinIcon, states: ['Unpinned', 'Pinned'] },
  { id: 'save', label: 'Save to reading list', Icon: BookmarkIcon, states: ['Not saved', 'Saved'] },
  { id: 'mute', label: 'Mute microphone', Icon: MicIcon, states: ['Live', 'Muted'] },
  { id: 'hide', label: 'Hide resolved threads', Icon: EyeIcon, states: ['Shown', 'Hidden'] },
]

export default function ToggleIcons() {
  const [pressed, setPressed] = useState<Record<string, boolean>>({ pin: true })

  return (
    <div className="@container w-full max-w-lg">
      <div className="grid grid-cols-2 gap-y-6 @sm:grid-cols-4">
        {TOGGLES.map(({ id, label, Icon, states }) => {
          const on = Boolean(pressed[id])
          return (
            <div key={id} className="flex flex-col items-center gap-2">
              {/* A state icon follows `pressed` through its `active` prop, and reverses mid-morph. */}
              <Toggle
                variant="outline"
                size="lg"
                aria-label={label}
                pressed={on}
                onPressedChange={(next) => setPressed((p) => ({ ...p, [id]: next }))}
              >
                <Icon active={on} />
              </Toggle>
              <span aria-hidden className="font-mono text-ui-xs text-fg-muted">
                {states[on ? 1 : 0]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
