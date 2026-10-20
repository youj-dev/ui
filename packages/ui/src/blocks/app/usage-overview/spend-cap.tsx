'use client'

import { Collapse, Counter } from '@youj/motion'
import { AlertTriangleIcon, GaugeIcon } from '@youj/icons'
import { AsyncButton } from '../../../components/ui/async-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Slider } from '../../../components/ui/slider'
import { cn, numberFormat } from '../../../lib/utils'
import type { UsageOverviewCopy } from './copy'

interface SpendCapProps {
  copy: UsageOverviewCopy
  locale: string
  currency: string
  cap: number
  onCapChange: (cap: number) => void
  /** The slider's bounds and step. */
  min: number
  max: number
  step: number
  projected: number
  cycleDays: number
  onSave: () => unknown
}

function SpendCap({ copy, locale, currency, cap, onCapChange, min, max, step, projected, cycleDays, onSave }: SpendCapProps) {
  const headroom = cap - projected
  const over = headroom < 0
  const money0 = { style: 'currency', currency, maximumFractionDigits: 0 } as const
  const bound = numberFormat(locale, money0).format
  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.spendCap}</CardTitle>
        <CardDescription>{copy.capDescription}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-baseline justify-between gap-2">
          <Counter value={cap} locale={locale} format={money0} inView={false} duration="fast" className="text-2xl font-semibold tracking-tight text-fg" />
          <span className="text-ui-sm text-fg-muted">{copy.perCycle}</span>
        </div>
        <Slider aria-label={copy.spendCap} min={min} max={max} step={step} value={cap} onValueChange={(value) => onCapChange(Array.isArray(value) ? value[0]! : value)} />
        <div className="flex justify-between text-ui-xs text-fg-muted tabular-nums">
          <span>{bound(min)}</span>
          <span>{bound(max)}</span>
        </div>
        <div role="group" aria-label={copy.headroom} className={cn('flex items-center justify-between rounded-lg border px-3 py-2.5', over ? 'border-warning-line bg-warning-subtle' : 'border-line bg-transparent')}>
          <span className="flex items-center gap-2 text-ui text-fg">
            <GaugeIcon size={15} className={over ? 'text-warning-text' : 'text-fg-muted'} />
            {over ? copy.projectedOverage : copy.headroomAtPace}
          </span>
          <Counter value={Math.abs(headroom)} locale={locale} format={money0} inView={false} duration="fast" className={cn('font-medium', over ? 'text-warning-text' : 'text-fg')} />
        </div>
        <Collapse open={over}>
          <p role="status" className="flex gap-2 text-ui-sm text-warning-text">
            <AlertTriangleIcon size={15} className="mt-0.5 shrink-0" />
            {copy.capWarning(Math.max(1, Math.floor((cap / Math.max(1, projected)) * cycleDays)))}
          </p>
        </Collapse>
        <AsyncButton onAction={onSave} pendingLabel={copy.savingCap} successLabel={copy.capSaved} className="self-start">
          {copy.saveCap}
        </AsyncButton>
      </CardContent>
    </Card>
  )
}

export { SpendCap }
