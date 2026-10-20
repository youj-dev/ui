import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { CoverageMatrix, type CoverageMatrixColumn, type CoverageMatrixRow } from './coverage-matrix'

/** A made-up app's features against the platforms they ship on, filled by how complete each is (0–3). */
const COLUMNS: CoverageMatrixColumn[] = [
  { id: 'web', label: 'Web' },
  { id: 'ios', label: 'iOS' },
  { id: 'android', label: 'Android' },
  { id: 'desktop', label: 'Desktop' },
]
const ROWS: CoverageMatrixRow[] = [
  { id: 'sync', label: 'Offline sync', values: [3, 3, 2, 1] },
  { id: 'share', label: 'Sharing', values: [3, 2, 2, 0] },
  { id: 'search', label: 'Search', values: [3, 1, 1, 2] },
  { id: 'export', label: 'Export', values: [2, 0, 0, 3] },
  { id: 'widgets', label: 'Widgets', values: [0, 3, 2, 0] },
]

const meta: Meta<typeof CoverageMatrix> = {
  title: 'UI/Data/Coverage Matrix',
  component: CoverageMatrix,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'How well each row is covered by each column: every cell fills from the bottom by depth in its column’s color, and a cell with nothing is hatched. Selecting a row (click, or Enter on a cell) turns its gaps to the danger tone. One tab stop (a grid): arrows move between the row names and cells, and focus or hover shows the value. The fills rise as it scrolls into view. Reduced motion: drawn in place.',
      },
    },
  },
  args: { rows: ROWS, columns: COLUMNS, max: 3, label: 'Features by platform', formatValue: (v: number) => `${v} of 3`, onValueChange: fn() },
  argTypes: { rows: { control: false }, columns: { control: false } },
  decorators: [
    (Story) => (
      <div className="w-96 max-w-full">
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof CoverageMatrix>

export const Default: Story = {}

/** Export selected: its two gaps turn to the danger tone. */
export const Selected: Story = { args: { defaultValue: 'export' } }

/** Your own words for the key, and no legend on the second. */
export const WithYourData: Story = {
  name: 'With your data',
  args: { noneLabel: 'Not started', depthLabel: 'Fill shows how far along' },
}

/** Nothing to show yet. */
export const Empty: Story = { args: { rows: [] } }
