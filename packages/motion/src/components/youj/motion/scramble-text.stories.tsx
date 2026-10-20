import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useYouj } from '@youj/core/lib/youj/provider'
import { cn } from '@youj/core/lib/youj/cn'
import { GLYPHS, ScrambleText } from './scramble-text'

const meta = {
  title: 'Motion/ScrambleText',
  component: ScrambleText,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Decodes toward its text through random glyphs, resolving roughly left to right with jitter. Triggers: `mount`, `view`, `hover` (also on keyboard focus) and `change`, combinable. `glyphs` sets the noise alphabet (`GLYPHS.alnum`, `alpha`, `hex`, `binary`, `symbols`, or your own). Frames write straight to the text node, not through React. Spaces are kept so word shapes read early. The real text is in an `sr-only` span. Reduced motion swaps text instantly. Use a monospace face for a steady width.',
      },
    },
  },
  args: {
    children: 'SYSTEMS NOMINAL',
    trigger: ['mount', 'change', 'hover'],
    glyphs: GLYPHS.alnum,
    duration: 'deliberate',
    tick: 'instant',
  },
  argTypes: {
    glyphs: { control: 'select', options: Object.values(GLYPHS) },
    trigger: { control: 'check', options: ['mount', 'view', 'hover', 'change'] },
    duration: { control: 'inline-radio', options: ['base', 'slow', 'deliberate'] },
    tick: { control: 'inline-radio', options: ['instant', 'fast', 'base'] },
    as: { control: false },
  },
} satisfies Meta<typeof ScrambleText>

export default meta
type Story = StoryObj<typeof meta>

const STAGES = [
  { label: 'QUEUED', tone: 'text-fg-muted' },
  { label: 'BUILDING', tone: 'text-warning' },
  { label: 'DEPLOYING', tone: 'text-accent' },
  { label: 'READY', tone: 'text-success' },
] as const

const COMMITS = ['4f2a91c', 'b81e07d', '19ce4a2', 'e0d7f35']

function DeployPanel() {
  const k = useYouj()
  const [stage, setStage] = useState(0)
  const [run, setRun] = useState(0)

  useEffect(() => {
    if (stage >= STAGES.length - 1) return
    const t = setTimeout(() => setStage((s) => s + 1), k.ms('deliberate') * 3)
    return () => clearTimeout(t)
  }, [stage, k])

  const current = STAGES[stage]!
  return (
    <div className="w-full max-w-[440px] overflow-hidden rounded-xl border border-line bg-surface font-mono text-sm">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div>
          <p className="text-[11px] tracking-[0.16em] text-fg-subtle uppercase">Production</p>
          <p className="mt-1 font-sans text-base font-semibold text-fg">youj-web</p>
        </div>
        <span className={cn('flex items-center gap-2 text-xs font-medium', current.tone)}>
          <span className="size-1.5 rounded-full bg-current" />
          <ScrambleText glyphs={GLYPHS.alpha} className="inline-block w-[9ch]">
            {current.label}
          </ScrambleText>
        </span>
      </div>
      <dl className="grid grid-cols-[96px_1fr] gap-y-2.5 px-5 py-4 text-xs">
        <dt className="text-fg-subtle">Commit</dt>
        <dd className="text-fg">
          <ScrambleText glyphs={GLYPHS.hex}>{COMMITS[run % COMMITS.length]!}</ScrambleText>
        </dd>
        <dt className="text-fg-subtle">Region</dt>
        <dd className="text-fg">
          <ScrambleText trigger="mount">iad1 · fra1 · hnd1</ScrambleText>
        </dd>
        <dt className="text-fg-subtle">Checksum</dt>
        <dd className="text-fg-muted">
          <ScrambleText glyphs={GLYPHS.binary} duration="slow">
            {stage === STAGES.length - 1 ? 'SHA256 VERIFIED' : 'PENDING'}
          </ScrambleText>
        </dd>
      </dl>
      <div className="flex justify-end border-t border-line px-5 py-3">
        <button
          type="button"
          onClick={() => {
            setStage(0)
            setRun((r) => r + 1)
          }}
          className="rounded-md bg-fg px-3 py-1.5 font-sans text-xs font-medium text-canvas focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          Redeploy
        </button>
      </div>
    </div>
  )
}

/** A deploy status card. Stages scramble on change; Redeploy re-decodes the commit hash. */
export const Hero: Story = { render: () => <DeployPanel /> }

/** Hover or tab through the links. */
export const HoverNav: Story = {
  render: () => (
    <nav className="flex flex-col gap-3 font-mono text-2xl font-medium tracking-tight">
      {['WORK', 'PRIMITIVES', 'JOURNAL', 'CONTACT'].map((l, i) => (
        <a key={l} href="#" className="group flex items-baseline gap-4 rounded text-fg-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none">
          <span className="text-xs text-fg-subtle">0{i + 1}</span>
          <ScrambleText trigger="hover" glyphs={GLYPHS.symbols} duration="slow">
            {l}
          </ScrambleText>
        </a>
      ))}
    </nav>
  ),
}

export const Playground: Story = {
  render: (args) => <ScrambleText {...args} className="font-mono text-3xl font-medium tracking-tight text-fg" />,
}

export const ReducedMotion: Story = {
  ...Hero,
  globals: { reducedMotion: 'always' },
}
