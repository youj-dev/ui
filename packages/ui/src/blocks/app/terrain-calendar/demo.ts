import type { TerrainCalendarDay, TerrainCalendarEntry } from './data'

/* The demo days: six months of workouts, day by day. The demo is a 24-week
 * plan toward an Olympic-distance triathlon: base, a build with a recovery
 * week every fourth, a week off sick, the peak, a taper, race day and an easy
 * week after; a seeded wobble makes every run draw the same terrain. Each
 * entry carries what the demo measures: time (minutes), distance (km, none
 * for strength), effort (1 easy to 10 all out) and load, the session-RPE
 * product of time and effort. */

/** A seeded wobble in [0, 1): the same for the same inputs on every run. */
function hash(...parts: number[]) {
  let h = 2166136261
  for (const p of parts) h = Math.imul(h ^ Math.round(p * 1000), 16777619)
  h ^= h >>> 13
  h = Math.imul(h, 2654435761)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

const START = Date.UTC(2026, 3, 13) // Monday, April 13
const DAY = 86_400_000
const iso = (t: number) => new Date(t).toISOString().slice(0, 10)

/** How hard each of the 24 weeks goes: base, build (a recovery week every fourth), sick, peak, taper, race, easy. */
const PHASE = [0.7, 0.72, 0.76, 0.58, 0.8, 0.84, 0.88, 0.6, 0.92, 0.96, 1, 0.62, 1.02, 0.3, 0.9, 1.06, 1.1, 0.66, 1.14, 1.18, 1.2, 0.8, 0.6, 0.45]
const SICK = 13
const RACE = 22
/** Three weeks of something every day: the longest streak. */
const EVERY_DAY = [8, 9, 10]

type Sport = 'run' | 'ride' | 'swim' | 'strength'
type Template = [sport: Sport, minutes: number, km: number | undefined, effort: number, title?: string]

/** A week's shape, Monday to Sunday: the sessions a full-strength week holds. */
const WEEK: Template[][] = [
  [['swim', 40, 2, 4]],
  [['run', 55, 10.5, 8, 'Intervals']],
  [
    ['ride', 70, 32, 5],
    ['strength', 30, undefined, 6],
  ],
  [
    ['run', 50, 9.5, 7, 'Tempo'],
    ['swim', 45, 2.3, 5],
  ],
  [['swim', 30, 1.4, 3]],
  [['ride', 150, 72, 5, 'Long ride']],
  [['run', 75, 14, 6, 'Long run']],
]

const RACE_WEEK: Template[][] = [
  [],
  [['run', 35, 7, 7, 'Openers']],
  [],
  [
    ['swim', 30, 1.5, 5],
    ['ride', 45, 22, 5],
  ],
  [],
  [['ride', 40, 20, 6, 'Openers']],
  [
    ['swim', 27, 1.5, 9, 'Race'],
    ['ride', 72, 40, 9, 'Race'],
    ['run', 46, 10, 9, 'Race'],
  ],
]

function entry(sport: Sport, minutes: number, km: number | undefined, effort: number, title?: string): TerrainCalendarEntry {
  return { category: sport, title, values: { time: minutes, ...(km === undefined ? {} : { distance: km }), effort, load: minutes * effort } }
}

function entriesFor(week: number, day: number): TerrainCalendarEntry[] {
  const phase = PHASE[week] ?? 0.8
  if (week === RACE) return RACE_WEEK[day]!.map(([sport, minutes, km, effort, title]) => entry(sport, minutes, km, effort, title))
  if (week === SICK && day > 0 && day < 6) return []
  if (week === SICK && day === 6) return [entry('run', 30, 5, 3)]
  const everyDay = EVERY_DAY.includes(week)
  // Monday's and Friday's swims come and go, except in the three weeks of every day.
  if ((day === 0 || day === 4) && !everyDay && hash(week, day, 7) < 0.7) return []
  return WEEK[day]!.flatMap(([sport, minutes, km, effort, title], i) => {
    // A second session is skipped now and then; the first only outside the every-day weeks.
    if (hash(week, day, i, 1) < (i ? 0.3 : everyDay ? 0 : 0.06)) return []
    // Long sessions grow with the phase; intensity grows less.
    const scale = title?.startsWith('Long') ? phase ** 1.2 : 0.55 + 0.45 * phase
    const wobble = 1 + (hash(week, day, i, 2) - 0.5) * 0.24
    const time = Math.round(minutes * scale * wobble)
    const easy = phase < 0.7 ? Math.max(3, effort - 2) : effort
    return [entry(sport, time, km === undefined ? undefined : Math.round(((km * time) / minutes) * 10) / 10, easy, title)]
  })
}

export const DEMO_DAYS: TerrainCalendarDay[] = Array.from({ length: PHASE.length * 7 }, (_, i) => ({
  date: iso(START + i * DAY),
  entries: entriesFor(Math.floor(i / 7), i % 7),
}))
