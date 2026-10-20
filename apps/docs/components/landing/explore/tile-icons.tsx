'use client'

import { useRef, useState } from 'react'
import { useYouj } from '@youj/core'
import { BellIcon, CloudUploadIcon, LockIcon, VolumeIcon, type YoujIconComponent } from '@youj/icons'
import { Toggle } from '@youj/react'
import { useLoop } from '@/components/landing/use-loop'
import { Demo, useInUse } from './demo'

const ICONS: { Icon: YoujIconComponent; label: string }[] = [
  { Icon: LockIcon, label: 'Lock' },
  { Icon: VolumeIcon, label: 'Mute' },
  { Icon: BellIcon, label: 'Notifications' },
  { Icon: CloudUploadIcon, label: 'Upload' },
]

/** Four icons as toggles: each plays its state change when pressed, and while nobody's using them they take turns. */
export default function IconsTile() {
  const k = useYouj()
  const root = useRef<HTMLDivElement>(null)
  const inUse = useInUse(root)
  const [on, setOn] = useState<boolean[]>(() => ICONS.map(() => false))
  const [turn, setTurn] = useState(0)
  useLoop(root, k.ms('deliberate') * 2, () => {
    if (inUse) return
    setOn((all) => all.map((value, i) => (i === turn ? !value : value)))
    setTurn((t) => (t + 1) % ICONS.length)
  })
  return (
    <Demo>
      <div ref={root} className="explore-box grid grid-cols-2 gap-2">
        {ICONS.map(({ Icon, label }, i) => (
          <Toggle
            key={label}
            variant="outline"
            size="lg"
            aria-label={label}
            pressed={on[i]}
            onPressedChange={(pressed) => setOn((all) => all.map((value, j) => (j === i ? pressed : value)))}
            // shape: a showcase tile, sized to show the icon's motion
            className="size-14"
          >
            <Icon size={22} active={on[i]} />
          </Toggle>
        ))}
      </div>
    </Demo>
  )
}
