'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Check, CloudUpload, Radio, Rocket } from 'lucide-react'
import { useYouj } from '@youj/core'
import { YoujIcon } from '@youj/icons'
import { Button } from '@youj/react'

function Cell({ label, note, children }: { label: string; note: string; children: ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-4 rounded-xl border border-line bg-surface p-4">
      <div>
        <p className="font-mono text-[13px] text-fg">{label}</p>
        <p className="mt-0.5 text-xs text-fg-muted">{note}</p>
      </div>
      <div className="flex h-9 items-center">{children}</div>
    </div>
  )
}

export default function YoujIconTriggers() {
  const k = useYouj()
  const [syncing, setSyncing] = useState(false)

  // A stand-in for real work: the sync runs for four deliberate steps, so Speed stretches it too.
  useEffect(() => {
    if (!syncing) return
    const timer = setTimeout(() => setSyncing(false), k.ms('deliberate') * 4)
    return () => clearTimeout(timer)
  }, [syncing, k])

  return (
    <div className="grid w-full max-w-2xl gap-2.5 sm:grid-cols-2">
      <Cell label='trigger="hover"' note="Plays while the button is hovered or keyboard-focused.">
        <Button variant="outline">
          <YoujIcon icon={Rocket} effect="nudge" direction="up" />
          Deploy
        </Button>
      </Cell>
      <Cell label='trigger="mount"' note="Plays once, as the icon appears.">
        <p className="inline-flex items-center gap-1.5 text-sm text-fg">
          <YoujIcon icon={Check} effect="draw-in" size={16} strokeWidth={2} className="text-success" />
          Build passed
        </p>
      </Cell>
      <Cell label='trigger="loop"' note="Repeats while on screen, and pauses offscreen and in hidden tabs.">
        <p className="inline-flex items-center gap-1.5 text-sm text-fg">
          <YoujIcon icon={Radio} effect="pulse" trigger="loop" size={16} className="text-accent" />
          Live
        </p>
      </Cell>
      <Cell label="active={syncing}" note="Follows your state: it floats for as long as the sync runs.">
        <Button variant="outline" onClick={() => setSyncing(true)}>
          <YoujIcon icon={CloudUpload} effect="float" active={syncing} />
          {syncing ? 'Syncing…' : 'Sync now'}
        </Button>
      </Cell>
    </div>
  )
}
