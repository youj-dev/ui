'use client'

import { Reveal } from '@youj/motion'

const STEPS = [
  { label: 'Install', width: '38%' },
  { label: 'Build', width: '72%' },
  { label: 'Checks', width: '54%' },
  { label: 'Promote', width: '88%' },
]

export default function RevealDemo() {
  return (
    // A container query, so the layout follows the space it gets rather than the viewport.
    <div className="@container w-full max-w-2xl">
      <div className="grid items-center gap-8 @xl:grid-cols-[1.1fr_1fr]">
        <div>
          <Reveal
            variant="fade"
            inView={false}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-2.5 py-1 text-xs text-fg-muted"
          >
            <span className="size-1.5 rounded-[1px] bg-accent" />
            Changelog 2.4
          </Reveal>
          <Reveal as="h2" variant="rise" inView={false} delay={1} delayStep="loose" className="text-2xl font-semibold tracking-tight text-balance text-fg">
            Deploys that land where you meant them.
          </Reveal>
          <Reveal as="p" variant="rise" inView={false} delay={2} delayStep="loose" className="mt-3 text-sm leading-relaxed text-fg-muted">
            Preview every change on a real URL, then promote it in one step.
          </Reveal>
          <Reveal variant="rise" inView={false} delay={3} delayStep="loose" className="mt-5 flex gap-2">
            <button
              type="button"
              className="rounded-lg bg-fg px-3.5 py-2 text-sm font-medium whitespace-nowrap text-canvas focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none"
            >
              Start deploying
            </button>
            <button
              type="button"
              className="rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium whitespace-nowrap text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              Read the docs
            </button>
          </Reveal>
        </div>

        <Reveal variant="wipe-up" inView={false} delay={3} delayStep="loose">
          <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
            <p className="mb-3 font-mono text-[11px] text-fg-muted">deploy · 4f2a91c</p>
            <div className="space-y-2.5">
              {STEPS.map((step, i) => (
                <div key={step.label} className="grid grid-cols-[64px_1fr] items-center gap-3">
                  <span className="text-xs text-fg-muted">{step.label}</span>
                  <div className="h-1.5 rounded-full bg-raised">
                    <Reveal variant="wipe-right" inView={false} delay={6 + i} className="h-full rounded-full bg-accent" style={{ width: step.width }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  )
}
