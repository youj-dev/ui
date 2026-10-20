'use client'

import { useState } from 'react'
import { WheelPicker, type WheelPickerColumn } from '@youj/react'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const daysIn = (year: number, month: number) => new Date(year, month, 0).getDate()
const numbers = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => ({ value: String(from + i), label: String(from + i) }))

export default function WheelPickerDate() {
  const [date, setDate] = useState<Record<string, string>>({ month: '2', day: '14', year: '1990' })
  const days = daysIn(Number(date.year), Number(date.month))
  const columns: WheelPickerColumn[] = [
    { id: 'month', label: 'Month', options: MONTHS.map((m, i) => ({ value: String(i + 1), label: m })) },
    // Every month shows 31 rows, so the column never changes length; the days a month lacks are disabled.
    { id: 'day', label: 'Day', options: numbers(1, 31).map((o) => ({ ...o, disabled: Number(o.value) > days })) },
    { id: 'year', label: 'Year', options: numbers(1930, 2026) },
  ]

  const change = (next: Record<string, string>) => {
    const max = daysIn(Number(next.year), Number(next.month))
    setDate(Number(next.day) > max ? { ...next, day: String(max) } : next)
  }

  return <WheelPicker aria-label="Date of birth" columns={columns} value={date} onValueChange={change} />
}
