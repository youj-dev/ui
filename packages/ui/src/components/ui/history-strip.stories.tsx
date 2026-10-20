import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './button'
import { HistoryStrip, type UptimeDay, type HistoryStripProps } from './history-strip'

/** Ninety demo days ending 28 Sep 2026: quiet, a few one-minute blips, a slow week, one outage and a day without data. */
function demoDays(seed = 7, outageAgo = 41): UptimeDay[] {
  let a = seed
  const random = () => ((a = (a * 16807) % 2147483647) - 1) / 2147483646
  return Array.from({ length: 90 }, (_, i) => {
    const ago = 89 - i
    const date = new Date(2026, 8, 28 - ago)
    if (ago === 57) return { date, uptime: null }
    const minutes = ago === outageAgo ? 192 : ago >= 10 && ago <= 12 ? [8, 14, 6][ago - 10]! : ago > 0 && random() < 0.08 ? 1 + Math.floor(random() * 3) : 0
    const note = ago === outageAgo ? 'Delivery queue stalled; backlog replayed' : ago >= 10 && ago <= 12 ? 'Index rebuild' : undefined
    return { date, uptime: 1 - minutes / 1440, downtimeMinutes: minutes, incidents: note ? 1 : 0, ...(note ? { note } : null) }
  })
}

const DAYS = demoDays()

const meta: Meta<HistoryStripProps> = {
  title: 'UI/Data/History Strip',
  component: HistoryStrip,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Availability a day at a time: one slim cell per day, oldest at the inline start and today at the end (mirrored in RTL). A cell’s color is its uptime in the theme’s status tokens: success at or above `target`, sliding through warning below it and on toward danger below `critical`, so a bad day is as loud as it was bad; a day without data is a dim well and a day with an incident carries a pip. Hover or focus a day for its date, uptime, downtime, incidents and note; the other days dim while you read one. One tab stop (today): the arrow keys step a day, Page Up and Page Down a week, Home and End go to the ends. Under about 28rem it keeps the latest 60 days and under 18rem the latest 30 (container queries), so cells stay legible. `size="sm"` is the mini strip for a list row, and `interactive={false}` draws it as decoration. The cells rise oldest to newest as the strip scrolls into view, and new data sweeps the colors across in the same order. Reduced motion: drawn in place; changes land at once.',
      },
    },
  },
  args: {
    days: DAYS,
    target: 0.999,
    critical: 0.99,
    size: 'default',
    interactive: true,
    label: 'Daily uptime, webhooks',
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['default', 'sm'] },
    target: { control: { type: 'number', min: 0.9, max: 1, step: 0.0005 } },
    critical: { control: { type: 'number', min: 0.9, max: 1, step: 0.001 } },
    days: { control: false },
  },
}
export default meta
type Story = StoryObj<HistoryStripProps>

export const Playground: Story = {
  name: 'Uptime',
  render: (args) => (
    <div className="w-[min(40rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-6">
      <HistoryStrip {...args} />
    </div>
  ),
}

const SERVICES = [
  { name: 'api-gateway', days: demoDays(3, 23) },
  { name: 'webhooks', days: demoDays(7, 41) },
  { name: 'search', days: demoDays(11, 64) },
  { name: 'storage', days: demoDays(19, 4) },
]

/** The mini strip in list rows: decorative (`interactive={false}`), because the row says the name and the figure. */
export const Mini: Story = {
  render: () => (
    <ul className="flex w-[min(36rem,calc(100vw-2rem))] flex-col gap-2">
      {SERVICES.map((s) => {
        const up = s.days.filter((d) => d.uptime !== null)
        const average = up.reduce((sum, d) => sum + d.uptime!, 0) / up.length
        return (
          <li key={s.name} className="grid grid-cols-[7.5rem_minmax(0,1fr)_4.5rem] items-center gap-4 rounded-xl bg-band px-4 py-3">
            <span className="truncate font-mono text-ui text-fg">{s.name}</span>
            <HistoryStrip days={s.days} size="sm" interactive={false} />
            <span className="text-end font-mono text-ui text-fg-muted tabular-nums">{(Math.floor(average * 10000) / 100).toFixed(2)}%</span>
          </li>
        )
      })}
    </ul>
  ),
}

/** The same 90 days in three widths: all of them, the latest 60 under 28rem, the latest 30 under 18rem. */
export const Narrow: Story = {
  render: (args) => (
    <div className="flex flex-col gap-8">
      {['40rem', '24rem', '16rem'].map((width) => (
        <div key={width} style={{ width }} className="rounded-xl border border-line bg-surface p-4">
          <HistoryStrip {...args} label={`Daily uptime at ${width}`} />
        </div>
      ))}
    </div>
  ),
}

/** New data sweeps the colors across, oldest to newest. */
export const DataChange: Story = {
  name: 'Data change',
  render: function Render(args) {
    const [which, setWhich] = useState(0)
    return (
      <div className="flex w-[min(40rem,calc(100vw-2rem))] flex-col gap-4 rounded-xl border border-line bg-surface p-6">
        <HistoryStrip {...args} days={SERVICES[which]!.days} label={`Daily uptime, ${SERVICES[which]!.name}`} />
        <div className="flex flex-wrap gap-2">
          {SERVICES.map((s, i) => (
            <Button key={s.name} size="sm" variant={i === which ? 'default' : 'secondary'} onClick={() => setWhich(i)} className="font-mono">
              {s.name}
            </Button>
          ))}
        </div>
      </div>
    )
  },
}

/** Reduced motion: the strip is drawn in place, and new data lands at once. Try the toolbar's Motion menu. */
export const ReducedMotion: Story = {
  name: 'Reduced motion',
  globals: { reducedMotion: 'always' },
  parameters: { docs: { description: { story: 'Motion is set to reduced for this story: the cells are drawn in place and a new day lands at once.' } } },
  render: (args) => (
    <div className="w-[min(40rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-6">
      <HistoryStrip {...args} />
    </div>
  ),
}
