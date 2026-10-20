import type { ActivityFeedEvent, ActivityFeedPerson, ActivityFeedType } from './data'

/* Folding: the feed reads as what happened, not as a log. Newest first, a
 * run of the same thing folds into one row while it stays within an hour
 * of the row's newest event:
 *   - `people`: different people doing it to the same target ("Mara, Theo
 *     and 3 others starred Pricing page v2");
 *   - `items`: one person's run of it on the same target ("Jonas pushed 5
 *     commits to main"), their items listed under the row.
 * A row is keyed by its oldest event, so when a newer event joins it the
 * row stays the same element: its count rolls instead of a row arriving. */

export interface FeedRow {
  key: string
  type: string
  /** Newest first. */
  events: ActivityFeedEvent[]
  /** Who, in order of their newest event, once each. */
  actors: ActivityFeedPerson[]
  items: NonNullable<ActivityFeedEvent['items']>
  /** The newest event's time. */
  time: number
}

export const timeOf = (event: Pick<ActivityFeedEvent, 'time'>) => +new Date(event.time)
const WINDOW = 60 * 60_000

export function fold(events: readonly ActivityFeedEvent[], types: Record<string, ActivityFeedType>): FeedRow[] {
  const rows: FeedRow[] = []
  for (const event of [...events].sort((a, b) => timeOf(b) - timeOf(a))) {
    const row = rows[rows.length - 1]
    const how = types[event.type]?.fold
    const joins =
      row &&
      how &&
      row.type === event.type &&
      row.events[0]!.target?.label === event.target?.label &&
      row.time - timeOf(event) <= WINDOW &&
      (how === 'people' ? !row.actors.some((a) => a.id === event.actor.id) : row.actors[0]!.id === event.actor.id)
    if (joins) {
      row.events.push(event)
      row.key = event.id
      if (!row.actors.some((a) => a.id === event.actor.id)) row.actors.push(event.actor)
      row.items.push(...(event.items ?? []))
    } else {
      rows.push({ key: event.id, type: event.type, events: [event], actors: [event.actor], items: [...(event.items ?? [])], time: timeOf(event) })
    }
  }
  return rows
}

const startOfDay = (time: number, utc: boolean) => {
  const d = new Date(time)
  if (utc) d.setUTCHours(0, 0, 0, 0)
  else d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Rows by day, newest day first. Before the browser's clock is known, days are UTC days. */
export function byDay(rows: readonly FeedRow[], now: number | null): { day: number; label: 'today' | 'yesterday' | null; rows: FeedRow[] }[] {
  const utc = now === null
  const today = now === null ? null : startOfDay(now, false)
  // The day before today's midnight: right across a daylight-saving change too.
  const yesterday = today === null ? null : startOfDay(today - 1, false)
  const out: { day: number; label: 'today' | 'yesterday' | null; rows: FeedRow[] }[] = []
  for (const row of rows) {
    const day = startOfDay(row.time, utc)
    const last = out[out.length - 1]
    if (last?.day === day) last.rows.push(row)
    else out.push({ day, label: day === today ? 'today' : day === yesterday ? 'yesterday' : null, rows: [row] })
  }
  return out
}
