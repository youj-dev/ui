import { useState } from 'react'
import { motion } from 'motion/react'
import { durations, staggers, type StaggerToken } from '../../lib/youj/tokens'
import { useYouj } from '../../lib/youj/provider'
import { Mono, Panel, ReducedNote, ReplayButton, Segmented, Toolbar, useReplay } from './kit'

/* A real list arriving with each stagger step, beside its timeline. Each
 * item uses the same tween (base / enter); only the offset changes. */

const ROWS = [
  { title: 'Deploy succeeded', meta: 'youj-docs · 12s', tone: 'bg-success' },
  { title: 'Preview ready', meta: 'feat/motion-tokens', tone: 'bg-accent' },
  { title: 'Review requested', meta: '2 reviewers', tone: 'bg-fg-subtle' },
  { title: 'Checks passed', meta: 'typecheck · test · lint', tone: 'bg-success' },
  { title: 'Bundle grew 1.2 kB', meta: 'within budget', tone: 'bg-warning' },
  { title: 'Merged to main', meta: 'squash · 3 commits', tone: 'bg-fg-subtle' },
] as const

const STEPS = Object.keys(staggers) as StaggerToken[]

export function StaggerDemo() {
  const k = useYouj()
  const [step, setStep] = useState<StaggerToken>('base')
  const [key, replay] = useReplay()
  const itemMs = durations.base
  const totalMs = (ROWS.length - 1) * staggers[step] + itemMs

  return (
    <div className="flex flex-col gap-4">
      <Toolbar>
        <Segmented
          label="Stagger step"
          options={STEPS}
          value={step}
          onChange={(s) => {
            setStep(s)
            replay()
          }}
          format={(s) => (
            <>
              {s} <span className="font-mono text-fg-muted">{staggers[s]}</span>
            </>
          )}
        />
        <ReplayButton onClick={replay} />
        <ReducedNote />
      </Toolbar>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Panel className="p-2">
          <ul key={key} className="flex flex-col" aria-label="Activity">
            {ROWS.map((row, i) => (
              <motion.li
                key={row.title}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                initial={k.reduced ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...k.tween('base', 'enter'), delay: k.duration('fast') + i * k.stagger(step) }}
              >
                <span aria-hidden className={`size-2 shrink-0 rounded-[2px] ${row.tone}`} />
                <span className="flex-1 truncate text-[13.5px] font-medium text-fg">{row.title}</span>
                <span className="truncate text-[12px] text-fg-muted">{row.meta}</span>
              </motion.li>
            ))}
          </ul>
        </Panel>

        <Panel className="flex flex-col gap-3 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] font-medium text-fg">Timeline</span>
            <Mono>
              {ROWS.length} × {itemMs}ms, step {staggers[step]}ms → {totalMs}ms at 1×
            </Mono>
          </div>
          <div key={key} className="relative flex flex-col gap-1.5" aria-hidden>
            {ROWS.map((row, i) => (
              <div key={row.title} className="relative h-4">
                <div
                  className="absolute inset-y-0 overflow-hidden rounded-[3px] bg-well"
                  style={{ left: `${((i * staggers[step]) / totalMs) * 100}%`, width: `${(itemMs / totalMs) * 100}%` }}
                >
                  <motion.div
                    className="absolute inset-0 origin-left bg-accent"
                    initial={{ scaleX: k.reduced ? 1 : 0 }}
                    animate={{ scaleX: 1 }}
                    transition={
                      k.reduced ? { duration: 0 } : { ...k.tween('base', 'linear'), delay: k.duration('fast') + i * k.stagger(step) }
                    }
                  />
                </div>
              </div>
            ))}
            {!k.reduced && (
              <motion.div
                className="pointer-events-none absolute -inset-y-1 inset-x-0 border-l border-fg"
                initial={{ x: '0%', opacity: 1 }}
                animate={{ x: '100%', opacity: [1, 1, 0] }}
                transition={{ ...k.tween('base', 'linear'), duration: (totalMs / 1000) * k.timeScale, delay: k.duration('fast') }}
              />
            )}
          </div>
          <div className="mt-auto flex justify-between border-t border-line pt-2">
            <Mono className="text-[11px] text-fg-muted">0ms</Mono>
            <Mono className="text-[11px] text-fg-muted">{Math.round(totalMs * k.timeScale)}ms</Mono>
          </div>
          <p className="text-[12.5px] leading-relaxed text-fg-muted">
            Keep the whole cascade under about two base durations. Past that, the last item feels late rather than choreographed.
          </p>
        </Panel>
      </div>
    </div>
  )
}
