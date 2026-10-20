'use client'

import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'recharts'
import { RotateCcwIcon, SlidersIcon, TrendingUpIcon } from '@youj/icons'
import {
  Button,
  Card,
  ColorPicker,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  SegmentedControl,
  SegmentedControlItem,
  Toggle,
} from '@youj/react'
import { ChartContainer, ChartTooltip, ChartTooltipContent, useChartMotion, type ChartConfig } from '@youj/react/chart'
import { linearTrend, sumEvery } from './trend-line'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const LEADS = {
  y25: [402, 435, 506, 487, 549, 529, 446, 470, 566, 612, 590, 540],
  y24: [352, 383, 404, 436, 429, 460, 392, 400, 455, 498, 470, 436],
}

type Key = keyof typeof LEADS
type Period = 'month' | 'quarter'

const SERIES: { key: Key; label: string; token: string }[] = [
  { key: 'y25', label: '2025', token: 'var(--color-chart-1)' },
  { key: 'y24', label: '2024', token: 'var(--color-fg-subtle)' },
]

const sum = (values: number[]) => values.reduce((total, v) => total + v, 0)
const whole = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const signed = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1, signDisplay: 'exceptZero' })

/** What a theme token paints right now, as hex: the picker needs a color, not a `var()`. Follows a change of theme. */
function useThemeColor(token: string, scope: RefObject<HTMLElement | null>) {
  const [hex, setHex] = useState('#808080')
  useEffect(() => {
    const read = () => {
      const probe = document.createElement('span')
      probe.style.color = token
      scope.current?.append(probe)
      const painted = getComputedStyle(probe).color
      probe.remove()
      const context = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
      if (!context) return
      context.fillStyle = painted
      context.fillRect(0, 0, 1, 1)
      const [r = 0, g = 0, b = 0] = context.getImageData(0, 0, 1, 1).data
      setHex('#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join(''))
    }
    read()
    const watch = new MutationObserver(read)
    watch.observe(document.documentElement, { attributes: true })
    return () => watch.disconnect()
  }, [token, scope])
  return hex
}

export default function SeriesColorAndTrend() {
  const motion = useChartMotion()
  const card = useRef<HTMLDivElement>(null)
  const [period, setPeriod] = useState<Period>('month')
  const [trend, setTrend] = useState(true)
  const [area, setArea] = useState(true)
  const [points, setPoints] = useState(false)
  const [compare, setCompare] = useState(true)
  const [picked, setPicked] = useState<Partial<Record<Key, string>>>({})
  const themed: Record<Key, string> = {
    y25: useThemeColor(SERIES[0]!.token, card),
    y24: useThemeColor(SERIES[1]!.token, card),
  }

  const quarterly = period === 'quarter'
  const rows = useMemo(() => {
    const labels = quarterly ? ['Q1', 'Q2', 'Q3', 'Q4'] : MONTHS
    const y25 = quarterly ? sumEvery(LEADS.y25, 3) : LEADS.y25
    const y24 = quarterly ? sumEvery(LEADS.y24, 3) : LEADS.y24
    const t25 = linearTrend(y25)
    const t24 = linearTrend(y24)
    return {
      slope: { y25: t25.slope, y24: t24.slope },
      data: labels.map((label, i) => ({ label, y25: y25[i]!, y24: y24[i]!, t25: t25.fitted[i]!, t24: t24.fitted[i]! })),
    }
  }, [quarterly])

  const config = Object.fromEntries(SERIES.map((s) => [s.key, { label: s.label, color: picked[s.key] ?? s.token }])) as ChartConfig
  const total = { y25: sum(LEADS.y25), y24: sum(LEADS.y24) }
  const change = ((total.y25 - total.y24) / total.y24) * 100
  const shown = SERIES.filter((s) => compare || s.key === 'y25')
  const unit = quarterly ? 'a quarter' : 'a month'

  return (
    <Card ref={card} data-slot="series-trend" className="w-full max-w-3xl gap-0 overflow-hidden py-0">
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 px-5 pt-5 pb-4">
        <div>
          <h3 className="text-ui font-semibold text-fg">Inbound leads</h3>
          <p className="mt-1 flex items-center gap-1.5 text-ui-sm text-fg-muted tabular-nums">
            <TrendingUpIcon size={16} className="text-success-text" />
            <span className="font-medium text-success-text">{signed.format(change)}%</span>
            vs 2024
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl variant="pill" aria-label="Period" value={period} onValueChange={(value) => setPeriod(value as Period)}>
            <SegmentedControlItem value="month">Month</SegmentedControlItem>
            <SegmentedControlItem value="quarter">Quarter</SegmentedControlItem>
          </SegmentedControl>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
              <SlidersIcon />
              Display
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuCheckboxItem checked={compare} onCheckedChange={setCompare}>
                Compare with 2024
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={area} onCheckedChange={setArea}>
                Area fill
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={points} onCheckedChange={setPoints}>
                Points
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Toggle variant="outline" size="sm" pressed={trend} onPressedChange={setTrend}>
            Linear trend
          </Toggle>
        </div>
      </header>

      <div className="px-3 pb-4">
        <ChartContainer
          config={config}
          className="aspect-auto h-64 w-full"
          title="Inbound leads, 2025 against 2024"
          summary={`${whole.format(total.y25)} leads in 2025, ${signed.format(change)}% on 2024, with a dashed linear trend line per year when it is on.`}
        >
          <ComposedChart data={rows.data} margin={{ left: 4, right: 16, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} width={40} tickMargin={4} tickFormatter={(v: number) => whole.format(v)} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label, payload) => {
                    const row = payload[0]?.payload as { y25: number; y24: number } | undefined
                    const delta = row ? ((row.y25 - row.y24) / row.y24) * 100 : 0
                    return (
                      <span className="flex items-baseline justify-between gap-4">
                        {label}
                        {compare && <span className="font-normal text-success-text tabular-nums">{signed.format(delta)}%</span>}
                      </span>
                    )
                  }}
                  valueFormatter={(value) => whole.format(Number(value))}
                />
              }
            />
            {shown.map((s, i) => (
              <Area
                key={s.key}
                dataKey={s.key}
                type="monotone"
                stroke={`var(--color-${s.key})`}
                strokeWidth={2}
                fill={`var(--color-${s.key})`}
                fillOpacity={area ? 0.1 : 0}
                dot={points ? { r: 3, strokeWidth: 0, fill: `var(--color-${s.key})` } : false}
                activeDot={{ r: 4 }}
                {...motion.draw(i)}
              />
            ))}
            {trend &&
              shown.map((s, i) => (
                <Line
                  key={`trend-${s.key}`}
                  dataKey={s.key === 'y25' ? 't25' : 't24'}
                  type="linear"
                  stroke={`var(--color-${s.key})`}
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                  dot={false}
                  activeDot={false}
                  legendType="none"
                  tooltipType="none"
                  {...motion.draw(i + 2)}
                />
              ))}
          </ComposedChart>
        </ChartContainer>
      </div>

      <footer className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line px-5 py-3 text-ui-sm">
        {shown.map((s) => (
          <div key={s.key} className="flex items-center gap-1 first:-ms-1.5">
            <ColorPicker
              swatchOnly
              aria-label={`${s.label} color`}
              value={picked[s.key] ?? themed[s.key]}
              onValueChange={(value) => setPicked((current) => ({ ...current, [s.key]: value }))}
            />
            <span className="text-fg-muted">{s.label}</span>
            <span className="font-medium text-fg tabular-nums">{whole.format(total[s.key])}</span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Reset ${s.label} to the theme color`}
              disabled={picked[s.key] === undefined}
              onClick={() => setPicked(({ [s.key]: _, ...rest }) => rest)}
            >
              <RotateCcwIcon />
            </Button>
          </div>
        ))}
        <p className="ms-auto text-fg-muted tabular-nums" aria-live="polite">
          {trend ? (
            <>
              Linear trend <span className="font-medium text-fg">{signed.format(Math.round(rows.slope.y25))}</span> {unit}
            </>
          ) : (
            'Trend off'
          )}
        </p>
      </footer>
    </Card>
  )
}
