/* A fictional team's alerts over the last 7 days, by half-hour of the day: pass yours through the block's props. */

export type HourLanesTone = 'accent' | 'neutral' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

/** One lane through a day: one value per bucket, midnight first (48 half-hours, 24 hours…). */
export interface HourLane {
  id: string
  label: string
  tone: HourLanesTone
  values: readonly number[]
}

/** A swell of alerts around `peak` (a half-hour), over a quiet floor. */
const swell = (peak: number, height: number, width: number, floor: number) =>
  Array.from({ length: 48 }, (_, i) => Math.round(floor + height * Math.exp(-((i - peak) ** 2) / (2 * width * width))))

export const LANES: HourLane[] = [
  { id: 'identity', label: 'Identity', tone: 'chart-3', values: swell(22, 62, 7, 8) },
  { id: 'devices', label: 'Devices', tone: 'chart-1', values: swell(26, 50, 9, 8) },
  { id: 'cloud', label: 'Cloud', tone: 'chart-5', values: swell(34, 52, 4, 4) },
  { id: 'mail', label: 'Mail', tone: 'chart-4', values: swell(23, 58, 4, 5) },
  { id: 'network', label: 'Network', tone: 'chart-2', values: swell(5, 50, 4, 6) },
  { id: 'apps', label: 'Apps', tone: 'neutral', values: swell(25, 32, 4, 3) },
]

export const DEFAULT_COPY = {
  title: 'Alerts by hour',
  subtitle: 'Last 7 days',
  zone: 'UTC',
  offHours: 'Off-hours',
  chartLabel: 'Alerts by time of day, per source',
  /** A count with its unit, in the grid's cells and the peak flag: "65 alerts". */
  countLabel: (count: string) => `${count} alerts`,
  peak: (time: string, count: string) => `Peak ${time} · ${count}`,
  peakHour: 'Peak hour',
  offHoursShare: 'Off-hours',
  nightLead: 'Night lead',
  loadingLabel: 'Loading the chart',
  retry: 'Retry',
  emptyTitle: 'Nothing to show',
  emptyDescription: 'Counts by hour show up here.',
}

export type HourLanesCopy = typeof DEFAULT_COPY
