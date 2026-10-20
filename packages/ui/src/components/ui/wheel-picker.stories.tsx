import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { WheelPicker, type WheelPickerColumn, type WheelPickerOption, type WheelPickerSingleProps } from './wheel-picker'

const pad = (n: number) => String(n).padStart(2, '0')
const range = (from: number, to: number, label: (n: number) => string = String): WheelPickerOption[] =>
  Array.from({ length: to - from + 1 }, (_, i) => ({ value: String(from + i), label: label(from + i) }))

const FRUIT: WheelPickerOption[] = ['Apple', 'Apricot', 'Banana', 'Blueberry', 'Cherry', 'Fig', 'Grape', 'Kiwi', 'Lemon', 'Mango', 'Peach', 'Pear', 'Plum'].map((f) => ({
  value: f.toLowerCase(),
  label: f,
}))

const TIME: WheelPickerColumn[] = [
  { id: 'hour', label: 'Hours', options: range(1, 12) },
  { id: 'minute', label: 'Minutes', options: range(0, 59, pad) },
  {
    id: 'period',
    label: 'AM or PM',
    options: [
      { value: 'AM', label: 'AM' },
      { value: 'PM', label: 'PM' },
    ],
  },
]

const meta: Meta<WheelPickerSingleProps> = {
  title: 'UI/Forms/Wheel Picker',
  component: WheelPicker,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A drum of values you spin: one or more columns, the chosen row of each in one band across the middle, the rows above and below curving away and fading. Drag, flick, scroll or click a row; type to jump. Each column is a spinbutton: ArrowUp turns to the next row, ArrowDown to the one before, Page Up and Down by five, Home and End to the ends, ArrowLeft and Right move between columns. Motion: a flick carries on and decays onto a row (the `slow` duration), a release past an end springs back and every other move turns on the `smooth` spring. Reduced motion: no momentum, every move lands at once. With `loop` each column wraps around. Every row passed ticks. It mirrors in right-to-left.',
      },
    },
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'default', 'lg'] },
    loop: { control: 'boolean' },
    disabled: { control: 'boolean' },
    sound: { control: 'boolean' },
  },
  args: { options: FRUIT, label: 'Fruit', defaultValue: 'cherry', size: 'default', loop: false, disabled: false, sound: true },
}
export default meta
type Story = StoryObj<WheelPickerSingleProps>

/** One column through the shorthand (`options` and `label`), with the value it reports. */
export const Playground: Story = {
  render: function Render(args) {
    const [value, setValue] = useState(args.defaultValue)
    return (
      <div className="flex flex-col items-center gap-3">
        <WheelPicker {...args} value={value} onValueChange={setValue} className="w-48" />
        <p className="text-ui-sm text-fg-muted">Picked {value}</p>
      </div>
    )
  },
}

/** Hours, minutes and AM or PM: three columns, one value per column id. */
export const Time: Story = {
  render: function Render(args) {
    const [time, setTime] = useState<Record<string, string>>({ hour: '9', minute: '30', period: 'AM' })
    return (
      <div className="flex flex-col items-center gap-3">
        <WheelPicker size={args.size} loop={args.loop} disabled={args.disabled} sound={args.sound} aria-label="Alarm" columns={TIME} value={time} onValueChange={setTime} />
        <p className="text-ui-sm text-fg-muted tabular-nums">
          {time.hour}:{time.minute} {time.period}
        </p>
      </div>
    )
  },
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const daysIn = (year: number, month: number) => new Date(year, month, 0).getDate()

/** Month, day and year. The days follow the month: the 31st is there only when the month has it, and the app clamps the day. */
export const DateStory: Story = {
  name: 'Date',
  render: function Render(args) {
    const [date, setDate] = useState<Record<string, string>>({ month: '2', day: '14', year: '2026' })
    const days = daysIn(Number(date.year), Number(date.month))
    const columns: WheelPickerColumn[] = [
      { id: 'month', label: 'Month', options: MONTHS.map((m, i) => ({ value: String(i + 1), label: m })) },
      { id: 'day', label: 'Day', options: range(1, 31).map((o) => ({ ...o, disabled: Number(o.value) > days })) },
      { id: 'year', label: 'Year', options: range(1950, 2050) },
    ]
    const change = (next: Record<string, string>) => {
      const max = daysIn(Number(next.year), Number(next.month))
      setDate(Number(next.day) > max ? { ...next, day: String(max) } : next)
    }
    return <WheelPicker size={args.size} disabled={args.disabled} sound={args.sound} aria-label="Birthday" columns={columns} value={date} onValueChange={change} />
  },
}

/** `loop`: each column wraps around, so the minutes run from 59 back to 00. */
export const Loop: Story = {
  args: { loop: true },
  render: (args) => (
    <WheelPicker
      size={args.size}
      loop={args.loop}
      sound={args.sound}
      aria-label="Timer"
      columns={[
        { id: 'hour', label: 'Hours', options: range(0, 23, pad) },
        { id: 'minute', label: 'Minutes', options: range(0, 59, pad) },
        { id: 'second', label: 'Seconds', options: range(0, 59, pad) },
      ]}
      defaultValue={{ hour: '0', minute: '5', second: '0' }}
    />
  ),
}

/** Reduced motion: no momentum; a drag still follows the pointer, and every release, key or click lands on its row at once. */
export const ReducedMotion: Story = {
  name: 'Reduced motion',
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <WheelPicker size={args.size} aria-label="Alarm" columns={TIME} defaultValue={{ hour: '7', minute: '15', period: 'AM' }} />
    </YoujProvider>
  ),
}
