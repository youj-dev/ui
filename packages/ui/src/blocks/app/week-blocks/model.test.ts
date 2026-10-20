import { ENTRIES, KINDS, WEEK_START } from './data'
import {
  addDays,
  hourTicks,
  layoutWeek,
  mondayOf,
  parseTime,
  splitDuration,
  stepSelection,
  totalsByKind,
  wallClock,
  weekColumns,
  type WeekBlocksEntry,
} from './model'

const entry = (day: string, start: string, end: string, kind = 'billable'): WeekBlocksEntry => ({ day, start, end, kind })

describe('week blocks model', () => {
  test('parses 24-hour times and rejects anything else', () => {
    expect(parseTime('09:30')).toBe(570)
    expect(parseTime('9:05')).toBe(545)
    expect(parseTime('24:00')).toBe(1440)
    for (const bad of ['24:01', '12:60', '1230', 'noon', '']) expect(parseTime(bad)).toBeUndefined()
  })

  test('finds the Monday of any day and counts days across month ends', () => {
    expect(mondayOf('2026-10-09')).toBe('2026-10-05')
    expect(mondayOf('2026-10-05')).toBe('2026-10-05')
    expect(mondayOf('2026-10-11')).toBe('2026-10-05')
    expect(addDays('2026-10-30', 3)).toBe('2026-11-02')
  })

  test('shows five columns, seven when an entry falls on a weekend', () => {
    expect(weekColumns(WEEK_START, ENTRIES)).toBe(5)
    expect(weekColumns(WEEK_START, [...ENTRIES, entry('2026-10-10', '10:00', '11:00')])).toBe(7)
    expect(weekColumns(WEEK_START, [entry('2026-10-12', '10:00', '11:00')])).toBe(5)
  })

  test('the demo week adds up to 29h 30m, 23h 15m of it billable', () => {
    const { valid } = layoutWeek(ENTRIES, KINDS, WEEK_START, 5, [9, 18])
    const totals = totalsByKind(valid)
    expect(totals).toEqual({ billable: 23 * 60 + 15, personal: 6 * 60 + 15 })
    expect(totals.billable! + totals.personal!).toBe(29 * 60 + 30)
  })

  test('places entries in reading order, clipped to the window, and counts their whole length', () => {
    const { slots, valid } = layoutWeek(
      [
        entry('2026-10-06', '14:00', '15:00'),
        entry('2026-10-05', '08:00', '10:00'),
        entry('2026-10-05', '17:30', '19:00', 'personal'),
        entry('2026-10-05', '06:00', '07:00'),
      ],
      KINDS,
      WEEK_START,
      5,
      [9, 18],
    )
    expect(slots.map((s) => [s.column, s.from, s.to, s.minutes])).toEqual([
      [0, 540, 600, 120],
      [0, 1050, 1080, 90],
      [1, 840, 900, 60],
    ])
    expect(slots[1]!.kind.id).toBe('personal')
    // The entry outside the hours still counts toward the week.
    expect(valid).toHaveLength(4)
  })

  test('leaves out entries that are malformed, reversed or outside the week; an unknown kind is neutral', () => {
    const { slots, valid } = layoutWeek(
      [
        entry('2026-10-05', '10:00', '09:00'),
        entry('2026-10-05', 'x', '11:00'),
        entry('2026-10-12', '10:00', '11:00'),
        entry('2026-10-02', '10:00', '11:00'),
        entry('2026-10-05', '10:00', '11:00', 'mystery'),
      ],
      KINDS,
      WEEK_START,
      5,
      [9, 18],
    )
    expect(valid).toHaveLength(1)
    expect(slots[0]!.kind).toEqual({ id: 'mystery', label: 'mystery', tone: 'neutral' })
  })

  test('splits minutes into hours and minutes', () => {
    expect(splitDuration(1890)).toEqual({ hours: 31, minutes: 30 })
    expect(splitDuration(45)).toEqual({ hours: 0, minutes: 45 })
    expect(splitDuration(120)).toEqual({ hours: 2, minutes: 0 })
  })

  test('labels the ends and every third hour between', () => {
    expect(hourTicks(9, 18)).toEqual([9, 12, 15, 18])
    expect(hourTicks(8, 19)).toEqual([8, 12, 15, 19])
    expect(hourTicks(9, 11)).toEqual([9, 11])
  })

  test('arrows step through the entries, Home and End jump, Escape lets go', () => {
    expect(stepSelection(null, 'ArrowRight', 4)).toBe(0)
    expect(stepSelection(null, 'ArrowLeft', 4)).toBe(3)
    expect(stepSelection(1, 'ArrowDown', 4)).toBe(2)
    expect(stepSelection(3, 'ArrowRight', 4)).toBe(3)
    expect(stepSelection(0, 'ArrowUp', 4)).toBe(0)
    expect(stepSelection(2, 'Home', 4)).toBe(0)
    expect(stepSelection(2, 'End', 4)).toBe(3)
    expect(stepSelection(2, 'Escape', 4)).toBeNull()
    expect(stepSelection(2, 'a', 4)).toBeUndefined()
    expect(stepSelection(null, 'ArrowRight', 0)).toBeUndefined()
  })

  test('reads the day and minute in a time zone', () => {
    const time = Date.parse('2026-10-09T23:30:00Z')
    expect(wallClock(time, 'UTC')).toEqual({ day: '2026-10-09', minute: 23 * 60 + 30 })
    expect(wallClock(time, 'Asia/Tokyo')).toEqual({ day: '2026-10-10', minute: 8 * 60 + 30 })
  })
})
