'use client'

import { useState } from 'react'
import { ShareBar } from '../../../components/ui/share-bar'
import { Eyebrow } from '../../../components/ui/typography'
import { numberFormat, toneColor } from '../../../lib/utils'
import type { CaseFileCopy, CaseFileDetails, CaseFileSignal } from './data'

/* The verdict: what it is in a sentence, how sure, and the signals behind it
 * as one bar split by weight. Pointing at a signal in the key lights its part
 * of the bar; the bar is a meter whose value text names every part. */

interface VerdictProps {
  details: CaseFileDetails
  signals: CaseFileSignal[]
  copy: CaseFileCopy
  locale: string
  id: string
  heading: 'h2' | 'h3'
}

export function Verdict({ details, signals, copy, locale, id, heading: Heading }: VerdictProps) {
  const [active, setActive] = useState<number | null>(null)
  const total = signals.reduce((sum, s) => sum + Math.max(0, s.weight), 0)
  const percent = numberFormat(locale, { style: 'percent', maximumFractionDigits: 0 })
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3 border-t border-line px-(--ui--panel-x) py-(--ui--panel-y)">
      <Eyebrow id={id} render={<Heading />}>
        {copy.verdictTitle}
      </Eyebrow>
      <p className="text-ui-lg leading-snug font-medium text-pretty text-fg">{details.summary}</p>
      <div className="flex items-baseline justify-between gap-3">
        <p className="flex items-baseline gap-2">
          <span className="text-3xl leading-none font-semibold tracking-tight tabular-nums">{percent.format(details.confidence)}</span>
          <span className="text-ui text-fg-muted">{copy.confidence}</span>
        </p>
        <span className="text-ui text-fg-muted tabular-nums">{copy.signals(signals.length)}</span>
      </div>
      <ShareBar
        parts={signals.map((s) => ({ value: s.weight, tone: s.tone, label: s.label }))}
        active={active}
        label={copy.signalsLabel}
        className="h-2"
      />
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-ui-sm">
        {signals.map((s, i) => (
          <li
            key={s.id}
            onPointerEnter={() => setActive(i)}
            onPointerLeave={() => setActive(null)}
            className="flex items-center gap-1.5 tabular-nums"
          >
            <span aria-hidden className="size-2 rounded-xs" style={{ background: toneColor(s.tone) }} />
            <span className="text-fg-muted">{s.label}</span>
            <span className="text-fg">{percent.format(total ? Math.max(0, s.weight) / total : 0)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
