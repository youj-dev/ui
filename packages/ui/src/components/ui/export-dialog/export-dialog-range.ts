import { startOfDay } from 'date-fns'
import { dateRangePresets } from '../date-range-picker'
import { dateTimeFormat } from '../../../lib/utils'

/* The date ranges the Export Dialog offers and what each one reads as. Pure:
 * the clock comes in as `now`, so a range never depends on when it runs. */

/** The preset ranges, named as the provider's labels name them. */
const EXPORT_PRESET_IDS = ['today', 'yesterday', 'last7Days', 'last30Days', 'thisMonth', 'lastMonth', 'yearToDate'] as const

type ExportPresetId = (typeof EXPORT_PRESET_IDS)[number]

interface ExportRange {
  /** First day, at the start of that day (local time). */
  from: Date
  /** Last day, at the start of that day (local time). Both ends are included. */
  to: Date
}

/**
 * "Sep 23 – 29", "Sep 29", "Dec 24 – Jan 6, 2027". The year is left out while
 * both ends fall in `now`'s year, and `year` forces it (the summary always names it).
 */
function formatExportRange(range: ExportRange, locale?: string, { now, year }: { now?: Date; year?: boolean } = {}): string {
  const showYear = year || (now !== undefined && (range.from.getFullYear() !== now.getFullYear() || range.to.getFullYear() !== now.getFullYear()))
  return dateTimeFormat(locale, { month: 'short', day: 'numeric', ...(showYear ? { year: 'numeric' } : {}) }).formatRange(range.from, range.to)
}

/** The range a preset stands for on the day of `now`, and how it reads in `locale`: `{ from, to, text }`. */
function presetRange(id: ExportPresetId, now: Date, locale?: string): ExportRange & { text: string } {
  const preset = dateRangePresets[EXPORT_PRESET_IDS.indexOf(id)]!.range(startOfDay(now))
  // The picker's month presets end at 23:59:59.999; the days are what matter.
  const range = { from: startOfDay(preset.from), to: startOfDay(preset.to) }
  return { ...range, text: formatExportRange(range, locale, { now }) }
}

export { EXPORT_PRESET_IDS, formatExportRange, presetRange, type ExportPresetId, type ExportRange }
