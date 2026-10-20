'use client'

import { useEffect, useState } from 'react'
import { useYouj } from '@youj/core'
import { ScrambleText } from '@youj/motion'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const HEX = '0123456789abcdef'

const STAGES = [
  { label: 'Queued', tone: 'text-fg-muted' },
  { label: 'Building', tone: 'text-warning' },
  { label: 'Deploying', tone: 'text-accent' },
  { label: 'Ready', tone: 'text-success' },
]
const COMMITS = ['4f2a91c', 'b81e07d', '19ce4a2', 'e0d7f35']

export default function ScrambleTextDemo() {
  const k = useYouj()
  const [stage, setStage] = useState(0)
  const [run, setRun] = useState(0)

  // Walk through the stages on the token grid, so Speed reaches the timeline too.
  useEffect(() => {
    if (stage === STAGES.length - 1) return
    const timer = setTimeout(() => setStage((s) => s + 1), k.ms('deliberate') * 3)
    return () => clearTimeout(timer)
  }, [stage, k])

  const current = STAGES[stage]!
  const ready = stage === STAGES.length - 1

  return (
    <div className="w-full max-w-sm overflow-hidden rounded-xl border border-line bg-surface font-mono text-sm">
      <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3.5">
        <div className="min-w-0">
          <p className="text-[11px] tracking-[0.16em] text-fg-muted uppercase">Production</p>
          <p className="mt-0.5 font-sans text-[15px] font-semibold text-fg">youj-web</p>
        </div>
        {/* The default triggers, mount and change: each new stage decodes from the last. */}
        <span role="status" className={`flex items-center gap-2 text-xs font-medium ${current.tone}`}>
          <span aria-hidden className="size-1.5 rounded-full bg-current" />
          <ScrambleText glyphs={LETTERS} className="inline-block w-[9ch] uppercase">
            {current.label}
          </ScrambleText>
        </span>
      </div>
      <dl className="grid grid-cols-[88px_1fr] gap-y-2.5 px-4 py-3.5 text-xs">
        <dt className="text-fg-muted">Commit</dt>
        <dd className="text-fg">
          <ScrambleText glyphs={HEX}>{COMMITS[run % COMMITS.length]!}</ScrambleText>
        </dd>
        <dt className="text-fg-muted">Regions</dt>
        <dd className="text-fg">
          <ScrambleText trigger="mount">iad1 · fra1 · hnd1</ScrambleText>
        </dd>
        <dt className="text-fg-muted">Checksum</dt>
        <dd className={ready ? 'text-success' : 'text-fg-muted'}>
          <ScrambleText glyphs="01" duration="slow">
            {ready ? 'SHA-256 verified' : 'Pending'}
          </ScrambleText>
        </dd>
      </dl>
      <div className="flex justify-end border-t border-line px-4 py-3">
        <button
          type="button"
          onClick={() => {
            setStage(0)
            setRun((r) => r + 1)
          }}
          className="rounded-md bg-fg px-3 py-1.5 font-sans text-xs font-medium text-canvas focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
        >
          Redeploy
        </button>
      </div>
    </div>
  )
}
