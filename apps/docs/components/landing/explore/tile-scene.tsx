'use client'

import { useRef, useState } from 'react'
import { useYouj } from '@youj/core'
import { IllustrationPadlock } from '@youj/illustrations'
import { Button } from '@youj/react'
import { useLoop } from '@/components/landing/use-loop'
import { Demo, TileCard } from './demo'

/** The padlock scene heading a small two-factor prompt, coming apart and back together while it's seen. */
export default function SceneTile() {
  const k = useYouj()
  const root = useRef<HTMLDivElement>(null)
  const [apart, setApart] = useState(false)
  useLoop(root, k.ms('deliberate') * 4, () => setApart((a) => !a))
  return (
    <Demo>
      <div ref={root} className="w-full max-w-64">
        <TileCard className="gap-4 p-4 shadow-lg">
          <div className="grid h-36 place-items-center rounded-xl bg-band [&_svg]:h-32 [&_svg]:w-auto">
            <IllustrationPadlock unit={18} explode={apart ? 1 : 0} float={false} title="A padlock" />
          </div>
          <div className="flex flex-col gap-1 text-center">
            <p className="text-ui font-semibold text-fg">Turn on two-factor</p>
            <p className="text-ui-sm text-fg-muted">A code from your phone keeps your account yours.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline">Not now</Button>
            <Button>Set up</Button>
          </div>
        </TileCard>
      </div>
    </Demo>
  )
}
