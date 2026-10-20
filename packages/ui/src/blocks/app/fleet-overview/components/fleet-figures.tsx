'use client'

import type { ReactNode } from 'react'
import { Counter, SpotlightGroup } from '@youj/motion'
import { Card } from '../../../../components/ui/card'
import { Stat, StatGroup, StatNote, StatValue } from '../../../../components/ui/stat-card'
import { cn } from '../../../../lib/utils'
import { glass, type Tracked } from '../model'
import { Eyebrow } from '../../../../components/ui/typography'

export function FleetFigures({ ships, className, compact = false }: { ships: Tracked[]; className?: string; compact?: boolean }) {
  const atSea = ships.filter((s) => s.status !== 'arrived')
  const late = atSea.filter((s) => s.status === 'delayed').length
  const onSchedule = atSea.length ? (atSea.length - late) / atSea.length : 1
  const teu = atSea.reduce((n, s) => n + s.teu, 0)
  const next = [...atSea].filter((s) => s.status !== 'delayed').sort((a, b) => a.eta - b.eta)[0]
  const numbers: { label: string; value: number | null; format?: Intl.NumberFormatOptions; unit?: string }[] = [
    { label: 'On schedule', value: onSchedule, format: { style: 'percent', maximumFractionDigits: 0 } },
    { label: 'At sea', value: atSea.length },
    { label: 'TEU afloat', value: teu, format: { notation: 'compact', maximumFractionDigits: 1 } },
    { label: 'Next arrival', value: next ? next.eta : null, format: { maximumFractionDigits: 1 }, unit: 'd' },
  ]
  const figures: { label: string; value: ReactNode; note: string }[] = [
    {
      label: 'On schedule',
      value: <Counter value={onSchedule} from={onSchedule} format={{ style: 'percent', maximumFractionDigits: 0 }} inView={false} />,
      note: late ? `${late} held by weather` : 'Nothing held',
    },
    { label: 'At sea', value: <Counter value={atSea.length} from={atSea.length} inView={false} />, note: `${ships.length - atSea.length} in port` },
    {
      label: 'TEU afloat',
      value: <Counter value={teu} from={teu} format={{ notation: 'compact', maximumFractionDigits: 1 }} inView={false} />,
      note: 'Containers at sea',
    },
    {
      label: 'Next arrival',
      value: next ? (
        <>
          <Counter value={next.eta} from={next.eta} format={{ maximumFractionDigits: 1 }} inView={false} /> d
        </>
      ) : (
        '—'
      ),
      note: next ? `${next.vessel}, ${next.to}` : 'Nothing inbound',
    },
  ]
  if (compact) {
    return (
      <StatGroup role="region" aria-label="The fleet" className={cn('grid-cols-2 *:data-[slot=stat]:p-3 *:data-[slot=stat]:md:px-4', className)}>
        {numbers.map((f, i) => (
          <Stat key={f.label} label={f.label}>
            {f.value == null ? (
              <span className="text-xl font-semibold text-fg-muted">—</span>
            ) : (
              <StatValue size="sm" value={f.value} from={f.value} format={f.format} unit={f.unit} />
            )}
            <StatNote className={i === 0 && late ? 'text-warning-text' : undefined}>{figures[i]!.note}</StatNote>
          </Stat>
        ))}
      </StatGroup>
    )
  }
  return (
    <SpotlightGroup radius={180} className={cn('grid grid-cols-4 gap-2', className)}>
      {figures.map((f) => (
        <Card key={f.label} spotlight size="sm" className={cn('gap-1 px-4 py-3', glass)}>
          <Eyebrow className="text-ui-xs tracking-[0.08em] text-fg-muted uppercase">{f.label}</Eyebrow>
          <span className="text-2xl leading-none font-semibold tracking-tight text-fg tabular-nums">{f.value}</span>
          <span className="truncate text-ui-sm text-fg-muted">{f.note}</span>
        </Card>
      ))}
    </SpotlightGroup>
  )
}
