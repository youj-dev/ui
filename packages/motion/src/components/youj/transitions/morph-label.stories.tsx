import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { motion } from 'motion/react'
import { Copy, UserCheck, UserPlus } from 'lucide-react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { cn } from '@youj/core/lib/youj/cn'
import { MorphLabel, useMorphRoot } from './morph-label'

const meta: Meta<typeof MorphLabel> = {
  title: 'Motion/Transitions/MorphLabel',
  component: MorphLabel,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Content that crossfades between states while the box around it morphs to the new width. The outgoing content is popped out of layout so the box measures the incoming content at once; both blur and scale a touch as they swap (`fast`, `standard`). The width morph is Motion layout projection on the `snappy` spring, transform-only: spread `useMorphRoot(radius)` on the box (`motion.button`, `motion.span`, or Base UI `render={<motion.button {...morph} />}`) and the label counter-scales so text never squashes. The `ref` is a stable inner span for effects such as a shake. Reduced motion swaps instantly.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof MorphLabel>

const box =
  'relative inline-flex h-8 items-center justify-center overflow-hidden px-3 text-[13px] font-medium outline-none select-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface'

function CopyButton() {
  const morph = useMorphRoot(8)
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1800)
    return () => clearTimeout(t)
  }, [copied])
  return (
    <motion.button
      type="button"
      {...morph}
      onClick={() => setCopied(true)}
      className={cn(box, 'border border-line bg-surface text-fg hover:bg-hover')}
    >
      <MorphLabel value={copied ? 'copied' : 'copy'} contentClassName="gap-1.5">
        {copied ? (
          <>
            <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-success" aria-hidden><path d="M4 12.5 L9 17.5 L20 6.5" /></svg>
            Copied
          </>
        ) : (
          <>
            <Copy aria-hidden className="size-3.5 text-fg-muted" />
            Copy install command
          </>
        )}
      </MorphLabel>
    </motion.button>
  )
}

function FollowButton() {
  const morph = useMorphRoot(9999)
  const [following, setFollowing] = useState(false)
  return (
    <motion.button
      type="button"
      {...morph}
      aria-pressed={following}
      onClick={() => setFollowing((f) => !f)}
      className={cn(box, 'rounded-full', following ? 'border border-line bg-well text-fg' : 'bg-fg text-canvas')}
    >
      <MorphLabel value={following ? 'on' : 'off'} contentClassName="gap-1.5">
        {following ? <UserCheck aria-hidden className="size-3.5" /> : <UserPlus aria-hidden className="size-3.5" />}
        {following ? 'Following' : 'Follow'}
      </MorphLabel>
    </motion.button>
  )
}

const STATUSES = [
  { label: 'Draft', dot: 'bg-fg-subtle' },
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
      <motion.span
        {...morph}
        role="status"
        className="relative inline-flex h-6 items-center overflow-hidden border border-line bg-surface px-2 text-xs text-fg"
      >
        <MorphLabel value={status.label} contentClassName="gap-1.5">
          <span aria-hidden className={cn('size-1.5 rounded-full', status.dot)} />
          {status.label}
        </MorphLabel>
      </motion.span>
      <button
        type="button"
        onClick={() => setI((n) => (n + 1) % STATUSES.length)}
        className="text-xs text-fg-muted underline-offset-4 hover:text-fg hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        Next status
      </button>
    </div>
  )
}

function Showcase() {
  return (
    <div className="w-full max-w-[520px] rounded-2xl border border-line bg-surface">
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-fg">youj/motion</p>
          <p className="truncate font-mono text-xs text-fg-muted">pnpm add @youj/motion</p>
        </div>
        <CopyButton />
      </div>
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
        <div>
          <p className="text-sm font-medium text-fg">Ada Lovelace</p>
          <p className="text-xs text-fg-muted">Maintainer · 142 contributions</p>
        </div>
        <FollowButton />
      </div>
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <p className="text-sm font-medium text-fg">RFC 0042: Motion tokens</p>
        <StatusChip />
      </div>
    </div>
  )
}

/** Three boxes that change what they say: copy feedback, a follow toggle, a status chip. The box morphs, the label crossfades. */
export const Hero: Story = {
  render: () => <Showcase />,
}

/** Reduced motion: every swap is instant; the box takes its new width at once. */
export const ReducedMotion: Story = {
  render: () => (
    <YoujProvider reducedMotion="always">
      <Showcase />
    </YoujProvider>
  ),
}

function LetterButton({ from, to, rise = false }: { from: string; to: string; rise?: boolean }) {
  const morph = useMorphRoot(8)
  const [on, setOn] = useState(false)
  return (
    <motion.button
      type="button"
      {...morph}
      aria-pressed={on}
      onClick={() => setOn((v) => !v)}
      className={cn(box, 'border border-line bg-surface text-fg hover:bg-hover')}
    >
      <MorphLabel value={on ? to : from} mode="letters" rise={rise}>
        {on ? to : from}
      </MorphLabel>
    </motion.button>
  )
}

/** `mode="letters"`: letters the two labels share at the start or end stay put and glide; only the rest leave and ripple in. Click each to toggle. */
export const Letters: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface p-5">
      <LetterButton from="Copy" to="Copied" />
      <LetterButton from="Save" to="Saved" />
      <LetterButton from="Follow" to="Following" />
      <LetterButton from="Publish" to="Unpublish" />
    </div>
  ),
}

const STEPS = ['Send', 'Sending', 'Sent']

function RiseChip() {
  const morph = useMorphRoot(9999)
  const [i, setI] = useState(0)
  return (
    <motion.button
      type="button"
      {...morph}
      onClick={() => setI((n) => (n + 1) % STEPS.length)}
      className={cn(box, 'rounded-full bg-fg text-canvas')}
    >
      <MorphLabel value={STEPS[i]!} rise>
        {STEPS[i]}
      </MorphLabel>
    </motion.button>
  )
}

/** `rise`: the new state comes up out of a blur while the old one lifts away, for labels that read as a step forward. */
export const Rise: Story = {
  render: () => (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-5">
      <RiseChip />
      <LetterButton from="Send" to="Sent" rise />
    </div>
  ),
}
