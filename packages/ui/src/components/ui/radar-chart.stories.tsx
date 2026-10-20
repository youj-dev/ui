import type { Meta, StoryObj } from '@storybook/react-vite'
import { RadarChart, type RadarChartAxis, type RadarChartSeries } from './radar-chart'

/** Three made-up assistants scored out of 100 on eight things. */
const AXES: RadarChartAxis[] = [
  { id: 'reasoning', label: 'Reasoning', description: 'How well it works through problems that take several steps.' },
  { id: 'code', label: 'Code', description: 'Writing, explaining and fixing programs.' },
  { id: 'speed', label: 'Speed', description: 'How quickly the first words arrive and how fast the rest follow.' },
  { id: 'value', label: 'Value', description: 'What you get for each dollar spent.' },
  { id: 'memory', label: 'Memory', description: 'How much of a long conversation or document it keeps in view.' },
  { id: 'vision', label: 'Vision', description: 'Reading images, charts and screenshots.' },
  { id: 'tools', label: 'Tools', description: 'Calling other programs and using what comes back.' },
  { id: 'safety', label: 'Safety', description: 'Staying within its limits when pushed.' },
]

const SERIES: RadarChartSeries[] = [
  { id: 'atlas', name: 'Atlas 2', values: [88, 82, 56, 48, 90, 76, 84, 80] },
  { id: 'quill', name: 'Quill S', values: [64, 70, 92, 90, 52, 58, 66, 72] },
  { id: 'meridian', name: 'Meridian', values: [76, 58, 70, 66, 70, 88, 52, 90] },
]

const meta: Meta<typeof RadarChart> = {
  title: 'UI/Data/Radar Chart',
  component: RadarChart,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Several things scored on the same axes, one filled shape each, so what one has more of than another reads at a glance. Hovering or focusing an axis label explains the axis; hovering or focusing a point names series, axis and value. The plot is one tab stop (arrows walk axes and series), the legend toggles series, and a hidden table holds the numbers. The shapes open from the center as it scrolls into view and morph when values change. Reduced motion: drawn in place.',
      },
    },
  },
  args: { axes: AXES, series: SERIES, label: 'Assistants compared' },
  argTypes: { axes: { control: false }, series: { control: false } },
  decorators: [
    (Story) => (
      <div className="w-[min(calc(100vw-2rem),36rem)]">
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof RadarChart>

export const Default: Story = {}

/** Two series on a fixed 0 to 10 scale, five rings and a unit in every value. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    axes: [
      { id: 'sleep', label: 'Sleep' },
      { id: 'focus', label: 'Focus' },
      { id: 'mood', label: 'Mood' },
      { id: 'energy', label: 'Energy' },
      { id: 'calm', label: 'Calm' },
    ],
    series: [
      { id: 'mon', name: 'Monday', values: [6, 7, 5, 6, 4], tone: 'chart-5' },
      { id: 'fri', name: 'Friday', values: [8, 6, 9, 7, 8], tone: 'chart-4' },
    ],
    max: 10,
    rings: 5,
    formatValue: (value) => `${value} of 10`,
    label: 'Week check-in',
  },
}

/** Three axes make a triangle; one series is enough. */
export const Triangle: Story = {
  args: {
    axes: AXES.slice(0, 3),
    series: SERIES.slice(0, 1),
  },
}

/** Without a legend, e.g. when your own controls choose the series. */
export const NoLegend: Story = { name: 'No legend', args: { legend: false } }
