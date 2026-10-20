import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { TerrainCalendar, type TerrainCalendarCategory, type TerrainCalendarDay, type TerrainCalendarDetail, type TerrainCalendarEntry, type TerrainCalendarMetric } from './terrain-calendar'

const meta: Meta<typeof TerrainCalendar> = {
  title: 'Blocks/App/Terrain Calendar',
  component: TerrainCalendar,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card', preset: 'basalt', address: 'app.stride.fit/training' },
    docs: {
      description: {
        component:
          'Show months of days as an isometric terrain: every day a column as tall as its measure, so busy stretches rise as ridges, quiet weeks sink to valleys and one standout day stands alone. Switch the measure or the category and the landscape reshapes in a wave. Point at a day, tap it or move with the arrow keys: its day of the week and its week stay lit, a tooltip gives the figure and the panel gives its entries; above, the week’s total, the longest streak and the peak day. The drawing is a canvas that draws only when something changes and pauses off screen; its days are a keyboard grid for screen readers too. The demo is a triathlete’s training; stories show a store’s sales and a weather network’s rain. Reduced motion: every change lands at once.',
      },
    },
  },
  argTypes: { theme: { control: false }, onSelect: { action: 'select' } },
}
export default meta
type Story = StoryObj<typeof TerrainCalendar>

/** A triathlete’s six months: load, time and distance across run, ride and swim, with race day as the lone spire. */
export const Default: Story = { name: 'Training' }

/** Hours on the clock: the long weekend rides tower over everything else. */
export const Time: Story = {
  args: { defaultMetric: 'time' },
}

/** Runs only: the weekday sessions and the long Sunday run, with the rides and swims gone. */
export const Running: Story = {
  args: { defaultCategory: 'run' },
}

/** On a page of its own: `embedded={false}` draws the centered canvas and the page’s `h1` around it. By default it’s the card alone, for your page to place. */
export const Standalone: Story = { args: { embedded: false } }

/* ── Other worlds ───────────────────────────────────────────────────────── */

/** A seeded wobble in [0, 1): the same for the same inputs on every run. */
function hash(...parts: number[]) {
  let h = 2166136261
  for (const p of parts) h = Math.imul(h ^ Math.round(p * 1000), 16777619)
  h ^= h >>> 13
  h = Math.imul(h, 2654435761)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

const iso = (start: number, i: number) => new Date(start + i * 86_400_000).toISOString().slice(0, 10)

/* Retail: a store’s daily revenue and orders by department, twenty weeks to the second Sunday of October. */

const DEPARTMENTS: TerrainCalendarCategory[] = [
  { id: 'grocery', label: 'Grocery', tone: 'chart-2' },
  { id: 'home', label: 'Home', tone: 'chart-4' },
  { id: 'apparel', label: 'Apparel', tone: 'chart-1' },
  { id: 'electronics', label: 'Electronics', tone: 'chart-5' },
]

const SALES_METRICS: TerrainCalendarMetric[] = [
  { id: 'revenue', label: 'Revenue', tone: 'chart-1', format: { options: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 } } },
  { id: 'orders', label: 'Orders', tone: 'chart-3', format: { options: { maximumFractionDigits: 0 }, unit: 'orders' } },
]

const SALES_DETAILS: TerrainCalendarDetail[] = [
  { id: 'revenue', format: (value, locale) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value) },
  { id: 'orders', format: (value, locale) => new Intl.NumberFormat(locale).format(value) },
]

/** Orders in a typical week, Monday to Sunday, per department, and what one order is worth. */
const BASKET = { grocery: [210, 190, 200, 220, 260, 340, 300], home: [40, 38, 42, 46, 58, 96, 80], apparel: [55, 50, 58, 64, 90, 150, 120], electronics: [18, 16, 18, 22, 34, 52, 40] }
const TICKET = { grocery: 46, home: 88, apparel: 71, electronics: 214 }
const SALES_START = Date.UTC(2026, 4, 25) // Monday, May 25

const SALES_DAYS: TerrainCalendarDay[] = Array.from({ length: 20 * 7 }, (_, i) => {
  const week = Math.floor(i / 7)
  const weekday = i % 7
  const date = iso(SALES_START, i)
  // The store closed for a storm on July 14; the fourth of July weekend and back-to-school bring sales.
  if (date === '2026-07-14') return { date, entries: [] }
  const entries: TerrainCalendarEntry[] = DEPARTMENTS.map((d, k) => {
    const id = d.id as keyof typeof BASKET
    const promo =
      (id === 'apparel' && date >= '2026-07-03' && date <= '2026-07-05') || (id === 'electronics' && week >= 13 && week <= 14 && weekday >= 4) || (id === 'home' && date >= '2026-09-26' && date <= '2026-09-27')
    const orders = Math.round(BASKET[id][weekday]! * (0.88 + hash(week, weekday, k) * 0.24) * (promo ? 1.9 : 1) * (id === 'home' ? 1 + week * 0.012 : 1))
    const revenue = Math.round(orders * TICKET[id] * (0.94 + hash(week, weekday, k, 9) * 0.12) * (promo ? 0.82 : 1))
    const title = promo ? (id === 'apparel' ? 'Summer sale' : id === 'electronics' ? 'Back to school' : 'Fall refresh') : undefined
    return { category: id, title, values: { revenue, orders } }
  })
  return { date, entries }
})

/** Retail: a store’s revenue and orders by department, day by day, with sale weekends standing out and a storm day closed. */
export const StoreSales: Story = {
  name: 'Store sales',
  args: {
    days: SALES_DAYS,
    metrics: SALES_METRICS,
    categories: DEPARTMENTS,
    details: SALES_DETAILS,
    copy: {
      title: 'Store sales',
      subtitle: 'Twenty weeks of daily revenue, by department',
      categoryLabel: 'Department',
      streak: 'Longest run open',
      peak: 'Best day',
      rest: 'Closed',
      noCategory: (department) => `No ${department.toLowerCase()} sales`,
      entries: 'Departments',
      entryCount: (n) => (n === 1 ? '1 department' : `${n} departments`),
      vsUsual: (weekday) => `vs. a usual ${weekday}`,
      synced: 'Updated 2 min ago',
    },
  },
}

/* Weather: daily rain by station for a wet spring giving way to a dry summer. */

const STATIONS: TerrainCalendarCategory[] = [
  { id: 'harbor', label: 'Harbor', tone: 'chart-5' },
  { id: 'hilltop', label: 'Hilltop', tone: 'chart-1' },
  { id: 'valley', label: 'Valley', tone: 'chart-3' },
]

const RAIN_METRICS: TerrainCalendarMetric[] = [
  { id: 'rain', label: 'Rainfall', tone: 'chart-5', format: { options: { style: 'unit', unit: 'inch', unitDisplay: 'short', maximumFractionDigits: 2 } } },
  { id: 'wet', label: 'Wet stations', tone: 'chart-2', format: { options: { maximumFractionDigits: 0 }, unit: 'wet' } },
]

const RAIN_DETAILS: TerrainCalendarDetail[] = [
  { id: 'rain', format: (value, locale) => new Intl.NumberFormat(locale, { style: 'unit', unit: 'inch', unitDisplay: 'short', maximumFractionDigits: 2 }).format(value), strong: (value) => value >= 1 },
  { id: 'hours', format: (value, locale) => new Intl.NumberFormat(locale, { style: 'unit', unit: 'hour', unitDisplay: 'narrow', maximumFractionDigits: 0 }).format(value) },
]

/** How wet each of the 24 weeks from March 2 tends to be: a wet March and April, then the dry season. */
const WETNESS = [0.9, 0.8, 1, 0.85, 0.7, 0.75, 0.6, 0.5, 0.45, 0.3, 0.35, 0.25, 0.2, 0.3, 0.1, 0.12, 0.08, 0.05, 0.06, 0.04, 0.08, 0.04, 0.05, 0.06]
const GAUGE = { harbor: 1, hilltop: 1.5, valley: 0.7 }
const RAIN_START = Date.UTC(2026, 2, 2) // Monday, March 2

const RAIN_DAYS: TerrainCalendarDay[] = Array.from({ length: 24 * 7 }, (_, i) => {
  const week = Math.floor(i / 7)
  const date = iso(RAIN_START, i)
  const entries: TerrainCalendarEntry[] = []
  STATIONS.forEach((s, k) => {
    const id = s.id as keyof typeof GAUGE
    const storm = date === '2026-03-19' ? 'Atmospheric river' : date === '2026-06-12' ? 'Thunderstorm' : undefined
    const wet = storm || hash(week, i, k, 3) < WETNESS[week]! * 0.75
    if (!wet) return
    const depth = storm ? (storm === 'Thunderstorm' ? 0.9 : 1.5) : 0.08 + hash(week, i, k, 4) ** 2 * 1.3 * (0.5 + WETNESS[week]!)
    const rain = Math.round(depth * GAUGE[id] * 100) / 100
    // The storm is named once, on the heaviest gauge, so the day's list still reads as stations.
    entries.push({ category: id, title: id === 'hilltop' ? storm : undefined, values: { rain, wet: 1, hours: Math.max(1, Math.round(2 + rain * 4 + hash(week, i, k, 5) * 5)) } })
  })
  return { date, entries }
})

/** Weather: three stations’ daily rain, a wet spring and a dry summer, with one atmospheric river in March. */
export const Rainfall: Story = {
  args: {
    days: RAIN_DAYS,
    metrics: RAIN_METRICS,
    categories: STATIONS,
    details: RAIN_DETAILS,
    copy: {
      title: 'Rainfall',
      subtitle: 'Daily rain at three stations, March to August',
      categoryLabel: 'Station',
      streak: 'Longest wet spell',
      peak: 'Wettest day',
      rest: 'Dry day',
      noCategory: (station) => `No rain at ${station}`,
      entries: 'Stations',
      entryCount: (n) => (n === 1 ? '1 station' : `${n} stations`),
      vsUsual: (weekday) => `vs. a usual wet ${weekday}`,
      synced: 'Updated hourly',
    },
  },
}

/** Skeleton figures and a skeleton landscape in the card’s place while your days load. */
export const Loading: Story = { args: { loading: true } }

/** No days yet: the message takes the terrain’s room. */
export const Empty: Story = { args: { days: [] } }

/** The days failed to load: the message and Retry take the terrain’s room, with a dash for each figure. */
export const Error: Story = { args: { error: 'The days couldn’t be loaded.', onRetry: fn() } }
