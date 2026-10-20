import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor } from 'storybook/test'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ReferenceLine,
  Sector,
  XAxis,
  YAxis,
  type PieSectorShapeProps,
} from 'recharts'
import { Badge } from './badge'
import { Button } from './button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card'
import {
  ChartContainer,
  ChartDataTable,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  chartColor,
  useChartMotion,
  type ChartConfig,
} from './chart'
import { ToggleGroup, ToggleGroupItem } from './toggle-group'

const meta: Meta = {
  title: 'UI/Data/Chart',
  excludeStories: ['RevenueChart', 'TrafficDonut'],
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          "shadcn's chart on Recharts, colored by the theme and timed by youj. A ChartConfig maps each series to a label and one of the chart colors (`var(--color-chart-1)`…`var(--color-chart-5)`: the theme's chart palette, like Basalt's neon series, or else a ramp derived from its accent and neutrals, so every preset re-colors it), exposed as `--color-<key>`. `useChartMotion()` replaces Recharts' 1.5s `ease` with youj tokens: lines draw and areas wipe in on the deliberate token, bars grow from the baseline on slow, donuts and radials sweep, each later series a stagger step behind, and a data change morphs every mark from where it stands. Speed scales it and reduced motion renders marks in place. The plot is a tab stop whose arrow keys walk the points with the tooltip; ChartContainer is a named figure with a summary, and ChartDataTable gives the numbers as a real table (hidden, or behind a View data toggle).",
      },
    },
  },
}
export default meta
type Story = StoryObj

const usd = (value: number) => `$${value.toLocaleString()}`
const compactUsd = (value: number) => `$${(value / 1000).toFixed(0)}k`

/* ── Hero: revenue with a range switch (data morph) ───────────────────── */

const revenue = {
  '6m': [
    { month: 'Apr', revenue: 48200, expenses: 31800 },
    { month: 'May', revenue: 51900, expenses: 32600 },
    { month: 'Jun', revenue: 49400, expenses: 33900 },
    { month: 'Jul', revenue: 58700, expenses: 34800 },
    { month: 'Aug', revenue: 63100, expenses: 36200 },
    { month: 'Sep', revenue: 71800, expenses: 37100 },
  ],
  '12m': [
    { month: 'Oct', revenue: 31200, expenses: 26100 },
    { month: 'Nov', revenue: 33800, expenses: 26900 },
    { month: 'Dec', revenue: 39100, expenses: 28400 },
    { month: 'Jan', revenue: 36400, expenses: 29100 },
    { month: 'Feb', revenue: 40900, expenses: 29800 },
    { month: 'Mar', revenue: 44600, expenses: 30700 },
    { month: 'Apr', revenue: 48200, expenses: 31800 },
    { month: 'May', revenue: 51900, expenses: 32600 },
    { month: 'Jun', revenue: 49400, expenses: 33900 },
    { month: 'Jul', revenue: 58700, expenses: 34800 },
    { month: 'Aug', revenue: 63100, expenses: 36200 },
    { month: 'Sep', revenue: 71800, expenses: 37100 },
  ],
}

const revenueConfig = {
  revenue: { label: 'Revenue', color: 'var(--color-chart-1)' },
  expenses: { label: 'Expenses', color: 'var(--color-chart-4)' },
} satisfies ChartConfig

export function RevenueChart({ className }: { className?: string }) {
  const [range, setRange] = useState<'6m' | '12m'>('6m')
  const motion = useChartMotion()
  const data = revenue[range]
  const first = data[0]!.revenue
  const last = data[data.length - 1]!.revenue
  return (
    <Card className={className ?? 'w-full max-w-[640px]'}>
      <CardHeader>
        <CardTitle>Revenue</CardTitle>
        <CardDescription>
          Net revenue against operating expenses, {range === '6m' ? 'last 6 months' : 'last 12 months'}.
        </CardDescription>
        <CardAction>
          <ToggleGroup
            variant="segmented"
            size="sm"
            value={[range]}
            onValueChange={(value) => value[0] && setRange(value[0] as '6m' | '12m')}
            aria-label="Range"
          >
            <ToggleGroupItem value="6m">6M</ToggleGroupItem>
            <ToggleGroupItem value="12m">12M</ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={revenueConfig}
          className="aspect-auto h-64 w-full"
          title="Revenue and expenses by month"
          summary={`Revenue grew from ${usd(first)} to ${usd(last)} over the period; expenses rose more slowly.`}
        >
          <AreaChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
            <defs>
              <linearGradient id="fill-revenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-revenue)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--color-revenue)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} />
            <YAxis tickLine={false} axisLine={false} tickMargin={4} width={40} tickFormatter={compactUsd} />
            <ChartTooltip cursor content={<ChartTooltipContent indicator="line" valueFormatter={(v) => usd(Number(v))} />} />
            <Area
              dataKey="revenue"
              type="monotone"
              fill="url(#fill-revenue)"
              stroke="var(--color-revenue)"
              strokeWidth={2}
              {...motion.draw(0)}
            />
            <Area
              dataKey="expenses"
              type="monotone"
              fill="transparent"
              stroke="var(--color-expenses)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              {...motion.draw(1)}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-0 py-2">
        <ChartDataTable
          mode="toggle"
          data={data}
          config={revenueConfig}
          labelKey="month"
          labelHeading="Month"
          caption="Revenue and expenses by month, in USD."
          valueFormatter={usd}
        />
      </CardFooter>
    </Card>
  )
}

export const Revenue: Story = {
  name: 'Hero: revenue (area, range morph)',
  render: () => <RevenueChart />,
}

/* ── Line: multi-series ───────────────────────────────────────────────── */

const latency = [
  { hour: '00:00', p50: 82, p95: 210, p99: 390 },
  { hour: '03:00', p50: 79, p95: 198, p99: 362 },
  { hour: '06:00', p50: 88, p95: 231, p99: 420 },
  { hour: '09:00', p50: 104, p95: 286, p99: 541 },
  { hour: '12:00', p50: 112, p95: 302, p99: 588 },
  { hour: '15:00', p50: 108, p95: 277, p99: 512 },
  { hour: '18:00', p50: 97, p95: 251, p99: 466 },
  { hour: '21:00', p50: 86, p95: 219, p99: 401 },
]
const latencyConfig = {
  p50: { label: 'p50', color: 'var(--color-chart-1)' },
  p95: { label: 'p95', color: 'var(--color-chart-3)' },
  p99: { label: 'p99', color: 'var(--color-chart-4)' },
} satisfies ChartConfig

export const LineMultiSeries: Story = {
  name: 'Line (multi-series)',
  render: function Render() {
    const motion = useChartMotion()
    return (
      <Card className="w-full max-w-[560px]">
        <CardHeader>
          <CardTitle>API latency</CardTitle>
          <CardDescription>Percentiles over the last 24 hours, in ms.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={latencyConfig}
            className="aspect-auto h-56 w-full"
            title="API latency percentiles"
            summary="Latency peaks around midday, with p99 reaching 588 ms at 12:00."
          >
            <LineChart data={latency} margin={{ left: 4, right: 12, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="hour" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={36} tickMargin={4} />
              <ChartTooltip content={<ChartTooltipContent valueFormatter={(v) => `${v} ms`} />} />
              {(['p50', 'p95', 'p99'] as const).map((key, i) => (
                <Line key={key} dataKey={key} type="monotone" stroke={`var(--color-${key})`} strokeWidth={2} dot={false} {...motion.draw(i)} />
              ))}
              <ChartLegend content={<ChartLegendContent />} />
            </LineChart>
          </ChartContainer>
          <ChartDataTable data={latency} config={latencyConfig} labelKey="hour" labelHeading="Hour" caption="Latency percentiles by hour, in ms." />
        </CardContent>
      </Card>
    )
  },
}

/* ── Bar: grouped and stacked ─────────────────────────────────────────── */

const deploys = [
  { week: 'W32', production: 42, preview: 118, failed: 4 },
  { week: 'W33', production: 38, preview: 131, failed: 7 },
  { week: 'W34', production: 51, preview: 144, failed: 3 },
  { week: 'W35', production: 47, preview: 126, failed: 5 },
  { week: 'W36', production: 58, preview: 162, failed: 2 },
  { week: 'W37', production: 63, preview: 171, failed: 6 },
]
const deployConfig = {
  production: { label: 'Production', color: 'var(--color-chart-1)' },
  preview: { label: 'Preview', color: 'var(--color-chart-3)' },
  failed: { label: 'Failed', color: 'var(--color-chart-4)' },
} satisfies ChartConfig

export const BarGrouped: Story = {
  name: 'Bar (grouped)',
  render: function Render() {
    const motion = useChartMotion()
    return (
      <Card className="w-full max-w-[560px]">
        <CardHeader>
          <CardTitle>Deployments</CardTitle>
          <CardDescription>Production and preview deploys per week.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={deployConfig} className="aspect-auto h-56 w-full" title="Deployments per week">
            <BarChart data={deploys} margin={{ left: 4, right: 4, top: 8 }} barGap={3}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={32} />
              <ChartTooltip cursor={{ radius: 6 }} content={<ChartTooltipContent />} />
              <Bar dataKey="production" fill="var(--color-production)" radius={[4, 4, 0, 0]} {...motion.grow(0)} />
              <Bar dataKey="preview" fill="var(--color-preview)" radius={[4, 4, 0, 0]} {...motion.grow(1)} />
              <ChartLegend content={<ChartLegendContent />} />
            </BarChart>
          </ChartContainer>
          <ChartDataTable data={deploys} config={deployConfig} keys={['production', 'preview']} labelKey="week" labelHeading="Week" caption="Deployments per week." />
        </CardContent>
      </Card>
    )
  },
}

export const BarStacked: Story = {
  name: 'Bar (stacked, live update)',
  render: function Render() {
    const motion = useChartMotion()
    const [data, setData] = useState(deploys)
    const shuffle = () =>
      setData((rows) =>
        rows.map((row) => ({
          ...row,
          production: Math.round(30 + Math.random() * 40),
          preview: Math.round(90 + Math.random() * 90),
          failed: Math.round(Math.random() * 9),
        })),
      )
    return (
      <Card className="w-full max-w-[560px]">
        <CardHeader>
          <CardTitle>Build minutes</CardTitle>
          <CardDescription>Stacked by environment. Refresh to watch the bars morph.</CardDescription>
          <CardAction>
            <Button variant="outline" size="sm" onClick={shuffle}>
              Refresh
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <ChartContainer config={deployConfig} className="aspect-auto h-56 w-full" title="Builds per week by environment">
            <BarChart data={data} margin={{ left: 4, right: 4, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={32} />
              <ChartTooltip cursor={{ radius: 6 }} content={<ChartTooltipContent />} />
              <Bar dataKey="production" stackId="a" fill="var(--color-production)" {...motion.grow(0)} />
              <Bar dataKey="preview" stackId="a" fill="var(--color-preview)" {...motion.grow(0)} />
              <Bar dataKey="failed" stackId="a" fill="var(--color-failed)" radius={[4, 4, 0, 0]} {...motion.grow(0)} />
              <ChartLegend content={<ChartLegendContent />} />
            </BarChart>
          </ChartContainer>
          <ChartDataTable data={data} config={deployConfig} labelKey="week" labelHeading="Week" caption="Builds per week by environment." />
        </CardContent>
      </Card>
    )
  },
}

/* ── Donut ────────────────────────────────────────────────────────────── */

const traffic = [
  { source: 'direct', visitors: 4820, fill: 'var(--color-direct)' },
  { source: 'search', visitors: 3610, fill: 'var(--color-search)' },
  { source: 'social', visitors: 1940, fill: 'var(--color-social)' },
  { source: 'referral', visitors: 1180, fill: 'var(--color-referral)' },
  { source: 'email', visitors: 640, fill: 'var(--color-email)' },
]
const trafficConfig = {
  visitors: { label: 'Visitors' },
  direct: { label: 'Direct', color: 'var(--color-chart-1)' },
  search: { label: 'Search', color: 'var(--color-chart-2)' },
  social: { label: 'Social', color: 'var(--color-chart-3)' },
  referral: { label: 'Referral', color: 'var(--color-chart-4)' },
  email: { label: 'Email', color: 'var(--color-chart-5)' },
} satisfies ChartConfig

/** The hovered slice steps out 4px. */
function ActiveSlice(props: PieSectorShapeProps) {
  return <Sector {...props} outerRadius={(props.outerRadius ?? 0) + (props.isActive ? 4 : 0)} />
}

export function TrafficDonut({ className }: { className?: string }) {
  const motion = useChartMotion()
  const total = traffic.reduce((sum, row) => sum + row.visitors, 0)
  return (
    <Card className={className ?? 'w-full max-w-[360px]'}>
      <CardHeader>
        <CardTitle>Traffic sources</CardTitle>
        <CardDescription>Visitors this week.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={trafficConfig}
          className="mx-auto aspect-square h-56"
          title="Traffic by source"
          summary={`Direct traffic leads with ${Math.round((4820 / total) * 100)}% of ${total.toLocaleString()} visitors.`}
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="source" hideLabel />} />
            <Pie
              data={traffic}
              dataKey="visitors"
              nameKey="source"
              innerRadius="62%"
              outerRadius="88%"
              paddingAngle={2}
              cornerRadius={3}
              stroke="none"
              shape={ActiveSlice}
              {...motion.sweep()}
            >
              <Label
                content={({ viewBox }) =>
                  viewBox && 'cx' in viewBox ? (
                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                      <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) - 6} className="fill-fg text-2xl font-semibold tabular-nums">
                        {total.toLocaleString()}
                      </tspan>
                      <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 16} className="fill-fg-muted text-ui-xs">
                        visitors
                      </tspan>
                    </text>
                  ) : null
                }
              />
            </Pie>
          </PieChart>
        </ChartContainer>
        <ul aria-hidden className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-ui-sm">
          {traffic.map((row) => {
            const item = trafficConfig[row.source as keyof typeof trafficConfig] as { label: string; color: string }
            return (
              <li key={row.source} className="flex items-center gap-2">
                <span className="size-2 rounded-[2px]" style={{ background: item.color }} />
                <span className="text-fg-muted">{item.label}</span>
                <span className="ms-auto font-medium tabular-nums">{Math.round((row.visitors / total) * 100)}%</span>
              </li>
            )
          })}
        </ul>
        <ChartDataTable data={traffic} config={trafficConfig} keys={['visitors']} labelKey="source" labelHeading="Source" caption="Visitors by traffic source." />
      </CardContent>
    </Card>
  )
}

export const Donut: Story = {
  name: 'Donut',
  render: () => <TrafficDonut />,
}

/* ── Radial ───────────────────────────────────────────────────────────── */

const quotas = [
  { resource: 'bandwidth', used: 78, fill: 'var(--color-bandwidth)' },
  { resource: 'builds', used: 54, fill: 'var(--color-builds)' },
  { resource: 'functions', used: 31, fill: 'var(--color-functions)' },
]
const quotaConfig = {
  used: { label: 'Used' },
  bandwidth: { label: 'Bandwidth', color: 'var(--color-chart-1)' },
  builds: { label: 'Build minutes', color: 'var(--color-chart-2)' },
  functions: { label: 'Function hours', color: 'var(--color-chart-3)' },
} satisfies ChartConfig

export const Radial: Story = {
  name: 'Radial',
  render: function Render() {
    const motion = useChartMotion()
    return (
      <Card className="w-full max-w-[360px]">
        <CardHeader>
          <CardTitle>Plan usage</CardTitle>
          <CardDescription>Share of this cycle's quota.</CardDescription>
          <CardAction>
            <Badge variant="warning">78% bandwidth</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <ChartContainer config={quotaConfig} className="mx-auto aspect-square h-56" title="Plan usage by resource">
            <RadialBarChart data={quotas} innerRadius="36%" outerRadius="100%" startAngle={90} endAngle={-270} barSize={14}>
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent nameKey="resource" hideLabel valueFormatter={(v) => `${v}%`} />} />
              <RadialBar dataKey="used" background cornerRadius={7} {...motion.sweep()} />
            </RadialBarChart>
          </ChartContainer>
          <ul aria-hidden className="mt-3 flex flex-col gap-1.5 text-ui-sm">
            {quotas.map((row) => {
              const item = quotaConfig[row.resource as keyof typeof quotaConfig] as { label: string; color: string }
              return (
                <li key={row.resource} className="flex items-center gap-2">
                  <span className="size-2 rounded-[2px]" style={{ background: item.color }} />
                  <span className="text-fg-muted">{item.label}</span>
                  <span className="ms-auto font-medium tabular-nums">{row.used}%</span>
                </li>
              )
            })}
          </ul>
          <ChartDataTable data={quotas} config={quotaConfig} keys={['used']} labelKey="resource" labelHeading="Resource" caption="Quota used by resource, in percent." />
        </CardContent>
      </Card>
    )
  },
}

/* ── Trend: two series, a crosshair and a period toggle ────────────────── */

type Period = 'weekly' | 'monthly' | 'yearly'

/** A shop's revenue from returning and new customers, by period. */
const customerRevenue: Record<Period, { at: string; returning: number; new: number }[]> = {
  weekly: [
    { at: 'W30', returning: 9800, new: 4100 },
    { at: 'W31', returning: 10400, new: 3900 },
    { at: 'W32', returning: 10100, new: 4600 },
    { at: 'W33', returning: 11300, new: 5200 },
    { at: 'W34', returning: 11900, new: 4800 },
    { at: 'W35', returning: 11600, new: 5600 },
    { at: 'W36', returning: 12800, new: 6100 },
    { at: 'W37', returning: 13400, new: 5900 },
  ],
  monthly: [
    { at: 'Oct', returning: 28400, new: 9100 },
    { at: 'Nov', returning: 30200, new: 11800 },
    { at: 'Dec', returning: 36900, new: 15400 },
    { at: 'Jan', returning: 29800, new: 9900 },
    { at: 'Feb', returning: 31100, new: 10600 },
    { at: 'Mar', returning: 33600, new: 12300 },
    { at: 'Apr', returning: 34900, new: 12900 },
    { at: 'May', returning: 37200, new: 14100 },
    { at: 'Jun', returning: 38100, new: 13600 },
    { at: 'Jul', returning: 40600, new: 15800 },
    { at: 'Aug', returning: 43900, new: 16900 },
    { at: 'Sep', returning: 47300, new: 18200 },
  ],
  yearly: [
    { at: '2022', returning: 214000, new: 98000 },
    { at: '2023', returning: 286000, new: 121000 },
    { at: '2024', returning: 351000, new: 139000 },
    { at: '2025', returning: 402000, new: 152000 },
    { at: '2026', returning: 466000, new: 171000 },
  ],
}
const customerConfig = {
  returning: { label: 'Returning', color: 'var(--color-chart-1)' },
  new: { label: 'New', color: 'var(--color-chart-3)' },
} satisfies ChartConfig
const compactMoney = (value: number) => `$${value >= 1e5 ? Math.round(value / 1000) : (value / 1000).toFixed(value % 1000 ? 1 : 0)}k`

/** The crosshair: a band around the hovered point and a dashed hairline through it. Recharts hands a custom cursor the plot's box and the line's two points. */
function Crosshair({ points, top = 0, height = 0 }: { points?: { x: number; y: number }[]; top?: number; height?: number }) {
  const x = points?.[0]?.x
  if (x === undefined) return null
  return (
    <g pointerEvents="none">
      <rect x={x - 14} y={top} width={28} height={height} rx={6} className="fill-band" />
      <line x1={x} x2={x} y1={top} y2={top + height} strokeDasharray="3 3" className="stroke-line-strong" />
    </g>
  )
}

export const CustomerRevenue: Story = {
  name: 'Revenue by customer type (crosshair, period toggle)',
  parameters: {
    docs: {
      description: {
        story:
          'Two series as lines with a custom cursor: a band and a dashed hairline follow the hovered (or arrow-key) point, and each line wears a hollow ring there. A segmented toggle switches the period; the lines morph to the new data on the motion tokens.',
      },
    },
  },
  render: function Render() {
    const [period, setPeriod] = useState<Period>('monthly')
    const motion = useChartMotion()
    const data = customerRevenue[period]
    const sum = (rows: typeof data) => rows.reduce((s, r) => s + r.returning + r.new, 0)
    const total = sum(data)
    const half = Math.floor(data.length / 2)
    const change = sum(data.slice(-half)) / sum(data.slice(0, half)) - 1
    return (
      <Card className="w-full max-w-[680px]">
        <CardHeader>
          <CardDescription>Revenue</CardDescription>
          <CardTitle className="flex items-baseline gap-2 text-3xl tabular-nums">
            {usd(total)}
            <Badge variant="success">+{(change * 100).toFixed(1)}%</Badge>
          </CardTitle>
          <CardAction>
            <ToggleGroup
              variant="segmented"
              size="sm"
              value={[period]}
              onValueChange={(value) => value[0] && setPeriod(value[0] as Period)}
              aria-label="Period"
            >
              <ToggleGroupItem value="weekly">Weekly</ToggleGroupItem>
              <ToggleGroupItem value="monthly">Monthly</ToggleGroupItem>
              <ToggleGroupItem value="yearly">Yearly</ToggleGroupItem>
            </ToggleGroup>
          </CardAction>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={customerConfig}
            className="aspect-auto h-64 w-full"
            title="Revenue from returning and new customers"
            summary={`Both lines rise over the period; returning customers bring in more than twice what new ones do. In all, ${usd(total)}.`}
          >
            <LineChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="at" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={44} tickMargin={4} tickFormatter={compactMoney} />
              <ChartTooltip cursor={<Crosshair />} content={<ChartTooltipContent valueFormatter={(v) => usd(Number(v))} />} />
              {(['returning', 'new'] as const).map((key, i) => (
                <Line
                  key={key}
                  dataKey={key}
                  type="monotone"
                  stroke={`var(--color-${key})`}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4.5, fill: 'var(--color-surface)', stroke: `var(--color-${key})`, strokeWidth: 2 }}
                  {...motion.draw(i)}
                />
              ))}
              <ChartLegend verticalAlign="top" content={<ChartLegendContent verticalAlign="top" />} />
            </LineChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-0 py-2">
          <ChartDataTable
            mode="toggle"
            data={data}
            config={customerConfig}
            labelKey="at"
            labelHeading="Period"
            caption="Revenue by customer type, in USD."
            valueFormatter={usd}
          />
        </CardFooter>
      </Card>
    )
  },
}

/* ── Diverging: in above zero, out below ──────────────────────────────── */

/** Two weeks of an account's money in and out, by business day; out is negative so it hangs under the baseline. */
const cashFlow = [
  { day: 'Mar 2', in: 42000, out: -61000 },
  { day: 'Mar 3', in: 118000, out: -94000 },
  { day: 'Mar 4', in: 0, out: -3500 },
  { day: 'Mar 5', in: 26000, out: -48000 },
  { day: 'Mar 6', in: 71000, out: -112000 },
  { day: 'Mar 9', in: 88000, out: -57000 },
  { day: 'Mar 10', in: 34000, out: -81000 },
  { day: 'Mar 11', in: 52000, out: -66000 },
  { day: 'Mar 12', in: 0, out: -124000 },
  { day: 'Mar 13', in: 96000, out: -39000 },
  { day: 'Mar 16', in: 18000, out: -72000 },
  { day: 'Mar 17', in: 63000, out: -58000 },
  { day: 'Mar 18', in: 144000, out: -101000 },
  { day: 'Mar 19', in: 37000, out: -44000 },
]
const flowConfig = {
  in: { label: 'In', color: 'var(--color-chart-5)' },
  out: { label: 'Out', color: 'var(--color-chart-1)' },
} satisfies ChartConfig
const unsignedUsd = (value: number) => usd(Math.abs(value))
const signedCompact = (value: number) => (value === 0 ? '$0' : `${value < 0 ? '−' : ''}${compactMoney(Math.abs(value))}`)

export const CashInAndOut: Story = {
  name: 'Cash in and out (diverging bars)',
  parameters: {
    docs: {
      description: {
        story:
          'Money in stacks above a zero line and money out hangs below it (`stackOffset="sign"` with out as negative values), so each day reads as one column split at the baseline. The tooltip shows both amounts unsigned; the totals and the net sit over the plot.',
      },
    },
  },
  render: function Render() {
    const motion = useChartMotion()
    const totalIn = cashFlow.reduce((s, d) => s + d.in, 0)
    const totalOut = -cashFlow.reduce((s, d) => s + d.out, 0)
    const net = totalIn - totalOut
    return (
      <Card className="w-full max-w-[640px]">
        <CardHeader>
          <CardTitle>Cash flow</CardTitle>
          <CardDescription>Business days, Mar 2 to Mar 19.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <dl className="flex flex-wrap gap-x-6 gap-y-1 text-ui-sm">
            {[
              ['In', compactMoney(totalIn)],
              ['Out', compactMoney(totalOut)],
              ['Net', `${net < 0 ? '−' : '+'}${compactMoney(Math.abs(net))}`],
            ].map(([term, value]) => (
              <div key={term} className="flex items-baseline gap-1.5">
                <dt className="text-fg-muted">{term}</dt>
                <dd className="text-ui-lg font-medium tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
          <ChartContainer
            config={flowConfig}
            className="aspect-auto h-60 w-full"
            title="Money in and out by day"
            summary={`${compactMoney(totalIn)} came in and ${compactMoney(totalOut)} went out over two weeks, a net ${net < 0 ? 'outflow' : 'inflow'} of ${compactMoney(Math.abs(net))}. The largest day out was Mar 12.`}
          >
            <BarChart data={cashFlow} stackOffset="sign" margin={{ left: 4, right: 8, top: 8 }} barCategoryGap="28%">
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
              <YAxis tickLine={false} axisLine={false} width={48} tickMargin={4} tickFormatter={signedCompact} />
              <ReferenceLine y={0} className="[&_line]:stroke-line-strong" />
              <ChartTooltip cursor={{ radius: 6 }} content={<ChartTooltipContent valueFormatter={(v) => unsignedUsd(Number(v))} />} />
              <Bar dataKey="in" stackId="flow" fill="var(--color-in)" radius={[4, 4, 0, 0]} {...motion.grow(0)} />
              <Bar dataKey="out" stackId="flow" fill="var(--color-out)" radius={[0, 0, 4, 4]} {...motion.grow(1)} />
              <ChartLegend content={<ChartLegendContent />} />
            </BarChart>
          </ChartContainer>
          <ChartDataTable
            data={cashFlow}
            config={flowConfig}
            labelKey="day"
            labelHeading="Day"
            caption="Money in and out by day, in USD."
            valueFormatter={unsignedUsd}
          />
        </CardContent>
      </Card>
    )
  },
}

export const ReducedMotion: Story = {
  name: 'Reduced motion',
  parameters: {
    docs: {
      description: {
        story:
          'Switch the toolbar Motion control to reduced: every series renders in place, a data change jumps to the new values and the tooltip moves without gliding. The View data table is unchanged.',
      },
    },
  },
  render: () => <RevenueChart />,
}

/* ── In a phone-width grid ────────────────────────────────────────────── */

const airConfig = {
  'PM2.5': { label: 'PM2.5', color: 'var(--color-chart-1)' },
  'PM10': { label: 'PM10', color: 'var(--color-chart-2)' },
} satisfies ChartConfig
const air = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => ({
  month,
  'PM2.5': 8 + ((i * 7) % 11),
  PM10: 14 + ((i * 5) % 13),
}))

/** Charts straight in a plain CSS grid and in a flex row, measured wide and then held to a 390px phone: each chart fills and shrinks with its column, so the page never scrolls sideways. Keys like `PM2.5` aren't CSS names; `chartColor` gives each series its variable. */
export const PhoneGrid: Story = {
  name: 'In a phone-width grid',
  render: function Render() {
    const motion = useChartMotion()
    return (
      <div data-testid="frame" className="grid w-[900px] gap-4">
        <ChartContainer config={airConfig} title="Particulates by month">
          <BarChart data={air}>
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <Bar dataKey="PM2.5" fill={chartColor('PM2.5')} {...motion.grow(0)} />
            <Bar dataKey="PM10" fill={chartColor('PM10')} {...motion.grow(1)} />
          </BarChart>
        </ChartContainer>
        <section className="flex gap-2">
          <h3 className="text-ui font-medium">Air</h3>
          <ChartContainer config={airConfig} title="Particulates by month, as lines">
            <LineChart data={air}>
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <Line dataKey="PM2.5" stroke={chartColor('PM2.5')} dot={false} {...motion.draw(0)} />
              <Line dataKey="PM10" stroke={chartColor('PM10')} dot={false} {...motion.draw(1)} />
            </LineChart>
          </ChartContainer>
        </section>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const frame = canvasElement.querySelector<HTMLElement>('[data-testid=frame]')!
    await waitFor(() => expect(canvasElement.querySelectorAll('.recharts-surface')).toHaveLength(2))
    frame.style.width = '390px'
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(frame.scrollWidth).toBeLessThanOrEqual(390)
    for (const chart of frame.querySelectorAll<HTMLElement>('[data-slot=chart]')) {
      const { width } = chart.getBoundingClientRect()
      expect(width).toBeGreaterThan(200)
      expect(width).toBeLessThanOrEqual(390)
    }
  },
}

