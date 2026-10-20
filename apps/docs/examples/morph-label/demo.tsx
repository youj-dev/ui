'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { useYouj } from '@youj/core'
import { MorphLabel, useMorphRoot } from '@youj/motion'
import { CheckIcon, CopyIcon, UserCheckIcon, UserPlusIcon } from '@youj/icons'

const box =
  'relative inline-flex h-8 shrink-0 items-center overflow-hidden px-3 text-[13px] font-medium outline-none transition-colors yj-duration-fast ease-standard focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface'

function CopyButton() {
  const k = useYouj()
  const morph = useMorphRoot(8)
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), k.ms('deliberate') * 3)
    return () => clearTimeout(t)
  }, [copied, k])
  return (
    <>
      <motion.button
        {...morph}
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText('pnpm add @youj/motion').catch(() => {})
          setCopied(true)
        }}
        className={`${box} border border-line bg-surface text-fg hover:bg-raised`}
      >
        <MorphLabel value={copied ? 'copied' : 'copy'} contentClassName="gap-1.5">
          {copied ? <CheckIcon trigger="mount" size={14} strokeWidth={2} className="text-success" /> : <CopyIcon size={14} />}
          {copied ? 'Copied' : 'Copy install command'}
        </MorphLabel>
      </motion.button>
      {/* Outside the button: a button flattens its content, so a live region inside it isn't heard. */}
      <span role="status" className="sr-only">
        {copied ? 'Copied to clipboard' : ''}
      </span>
    </>
  )
}

function FollowButton() {
  const morph = useMorphRoot(9999)
  const [following, setFollowing] = useState(false)
  return (
    <motion.button
      {...morph}
      type="button"
      onClick={() => setFollowing((f) => !f)}
      className={`${box} ${following ? 'border border-line bg-raised text-fg' : 'bg-fg text-canvas'}`}
    >
      <MorphLabel value={following ? 'on' : 'off'} contentClassName="gap-1.5">
        {following ? <UserCheckIcon size={14} /> : <UserPlusIcon size={14} />}
        {following ? 'Following' : 'Follow'}
      </MorphLabel>
    </motion.button>
  )
}

const STATUSES = [
  { label: 'Draft', dot: 'bg-fg-muted' },
  { label: 'In review', dot: 'bg-warning' },
  { label: 'Changes requested', dot: 'bg-danger' },
  { label: 'Published', dot: 'bg-success' },
]

function StatusChip() {
  const morph = useMorphRoot(9999)
  const [i, setI] = useState(0)
  const status = STATUSES[i]!
  return (
    <div className="flex items-center gap-3">
      <motion.span {...morph} role="status" className="relative inline-flex h-6 items-center overflow-hidden border border-line bg-canvas px-2 text-xs text-fg">
        <MorphLabel value={status.label} contentClassName="gap-1.5">
          <span aria-hidden className={`size-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </MorphLabel>
      </motion.span>
      <button
        type="button"
        onClick={() => setI((n) => (n + 1) % STATUSES.length)}
        className="rounded-sm text-xs text-fg-muted underline-offset-4 outline-none hover:text-fg hover:underline focus-visible:ring-2 focus-visible:ring-accent"
      >
        Next status
      </button>
    </div>
  )
}

export default function MorphLabelDemo() {
  return (
    <div className="w-full max-w-lg divide-y divide-line rounded-xl border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-fg">@youj/motion</p>
          <p className="truncate font-mono text-xs text-fg-muted">pnpm add @youj/motion</p>
        </div>
        <CopyButton />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
        <div>
          <p className="text-sm font-medium text-fg">Ana Lima</p>
          <p className="text-xs text-fg-muted">Maintainer · 142 contributions</p>
        </div>
        <FollowButton />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
        <p className="text-sm font-medium text-fg">RFC 0042: Motion tokens</p>
        <StatusChip />
      </div>
    </div>
  )
}
