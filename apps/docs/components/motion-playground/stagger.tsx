'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { cubicBezier } from 'motion/react'
import { motionPersonalities } from '@youj/core/lib/youj/tokens'
import { useYouj } from '@youj/core'
import { Stagger, staggerRanks } from '@youj/motion'
import { cn } from '@/lib/cn'
import { STAGGER_ROWS, staggerTotal, VARIANT_TIMING } from './code'
import { ORDERS, STAGGER_TOKENS, VARIANTS } from './state'
import { Timeline, type TimelineHandle, type TimelineRow } from './timeline'
import { useClock } from './use-clock'
import { Readouts, Stage, TokenSelect, Workbench } from './workbench'
import type { ViewProps } from './views'

/* Stagger: the real Stagger primitive plays a list of deployments on the step,
 * order and entrance you pick; the timeline under it is the same schedule,
 * each row's bar starting at its rank × the step and filling on its own
 * curve. */

const DEPLOYS = [
  { title: 'Add the Motion playground', branch: 'main', sha: '4f2a91c', when: '2m', ok: true },
  { title: 'Tighten the stagger steps', branch: 'main', sha: '91be20d', when: '18m', ok: true },
  { title: 'Fix the sheet on iOS', branch: 'fix/sheet', sha: 'c03e11a', when: '1h', ok: false },
  { title: 'Bump motion to 13.4', branch: 'deps', sha: '7aa2f64', when: '3h', ok: true },
  { title: 'Translate the toasts', branch: 'i18n', sha: 'e81b0c2', when: '5h', ok: true },
  { title: 'Draw the check on settle', branch: 'main', sha: '5d9e3a7', when: '1d', ok: true },
].slice(0, STAGGER_ROWS)

const ORDER_HINT = {
  start: 'Top to bottom, the order people read.',
  end: 'Bottom to top, for lists that grow upward.',
  center: 'From the middle out, for a grid or a hero row.',
  random: 'A seeded shuffle, the same on the server and in the browser.',
} as const

export function StaggerView({ state, update }: ViewProps) {
  const k = useYouj()
  const [run, setRun] = useState(0)
  const timeline = useRef<TimelineHandle>(null)
  const clock = useClock((t) => timeline.current?.at(t))
  const tokens = motionPersonalities[k.motionPersonality]
  const { step, item, lastStart, total } = staggerTotal(state, k.motionPersonality)
  const timing = VARIANT_TIMING[state.variant]
  const ranks = useMemo(() => staggerRanks(STAGGER_ROWS, state.order, 1), [state.order])
  const easeKey = tokens.easings[timing.ease].join(',')
  const rows = useMemo<TimelineRow[]>(() => {
    const ease = cubicBezier(...(easeKey.split(',').map(Number) as [number, number, number, number]))
    return DEPLOYS.map((d, i) => ({
      label: d.title,
      start: ranks[i]! * step,
      duration: item,
      sample: (t: number) => ease(t / item),
      detail: `+${ranks[i]! * step} ms`,
    }))
  }, [ranks, step, item, easeKey])

  // Every replay and every change remounts the list below, and the playhead starts with it.
  const settings = `${state.stagger}/${state.order}/${state.variant}/${k.timeScale}/${k.reduced}`
  useEffect(() => {
    if (k.reduced) {
      clock.stop()
      timeline.current?.at(total)
      return
    }
    clock.start(k.timeScale, total)
  }, [run, settings, total, clock, k.reduced, k.timeScale])

  return (
    <Workbench
      stage={
        <Stage caption="Replay to watch the list land." onReplay={() => setRun((r) => r + 1)} minHeight={360}>
          <div className="w-full max-w-[26rem] overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
            <div className="flex h-11 items-center justify-between border-b border-line px-3.5">
              <span className="text-[13px] font-medium text-fg">Deployments</span>
              <span className="font-mono text-[11px] text-fg-muted">youj-web</span>
            </div>
            <Stagger
              key={`${run}/${settings}`}
              as="ul"
              itemAs="li"
              step={state.stagger}
              order={state.order}
              variant={state.variant}
              inView={false}
              className="divide-y divide-line"
            >
              {DEPLOYS.map((d) => (
                <div key={d.sha} className="flex h-10 items-center gap-3 px-3.5">
                  <span aria-hidden className={cn('size-1.5 shrink-0 rounded-full', d.ok ? 'bg-success' : 'bg-warning')} />
                  <span className="min-w-0 flex-1 truncate text-[13px] text-fg">{d.title}</span>
                  <span className="hidden rounded-[4px] bg-well px-1.5 py-0.5 font-mono text-[10.5px] text-fg-muted sm:inline">{d.branch}</span>
                  <span className="w-8 shrink-0 text-end font-mono text-[11px] text-fg-muted">{d.when}</span>
                </div>
              ))}
            </Stagger>
          </div>
        </Stage>
      }
      strip={
        <Timeline
          ref={timeline}
          rows={rows}
          horizon={total}
          label={`Each row starts ${step} ms after the one before and takes ${item} ms, so the list lands in ${total} ms.`}
        />
      }
      controls={
        <>
          <TokenSelect
            label="Step"
            value={state.stagger}
            onChange={(stagger) => update({ stagger })}
            hint="The wait between one row and the next."
            options={STAGGER_TOKENS.map((t) => ({ value: t, label: t, detail: `${tokens.staggers[t]} ms` }))}
          />
          <TokenSelect label="Order" value={state.order} onChange={(order) => update({ order })} hint={ORDER_HINT[state.order]} options={ORDERS.map((o) => ({ value: o, label: o }))} />
          <TokenSelect
            label="Entrance"
            value={state.variant}
            onChange={(variant) => update({ variant })}
            hint="Each row’s own tween, from Reveal."
            options={VARIANTS.map((v) => ({ value: v, label: v, detail: `${VARIANT_TIMING[v].duration} · ${VARIANT_TIMING[v].ease}` }))}
          />
          {total > 600 && (
            <p role="note" className="rounded-lg border border-line bg-canvas p-3 text-[12px] leading-snug text-pretty text-fg-muted">
              <span className="font-medium text-fg">{total} ms is a queue, not a cascade.</span> Past about half a second people wait for the list. Try a tighter
              step, or stagger only what’s on screen first.
            </p>
          )}
          <Readouts
            items={[
              { label: 'Step', value: `${step} ms` },
              { label: 'Each row', value: `${item} ms` },
              { label: 'Last row starts', value: `${lastStart} ms` },
              { label: 'All landed', value: `${total} ms` },
            ]}
          />
        </>
      }
    />
  )
}
