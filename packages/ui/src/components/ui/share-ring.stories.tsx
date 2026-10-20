import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { ShareRing, type ShareRingProps } from './share-ring'

const MACROS = [
  { id: 'protein', label: 'Protein', value: 152, amount: 38 },
  { id: 'carbs', label: 'Carbs', value: 256, amount: 64 },
  { id: 'fat', label: 'Fat', value: 198, amount: 22 },
]

const meta: Meta<ShareRingProps> = {
  title: 'UI/Data/Share Ring',
  component: ShareRing,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A whole split into its parts, as a dial of cells: a dish’s calories by macro, a budget by category, a day by activity. The cells run clockwise from twelve o’clock in the tone of the part they fall in, parts take whole cells by the largest remainder, and with `max` above the total the rest of the ring stays dark. The total counts up in the bowl with its unit under it; the legend gives each part its amount and share (the shares always sum to 100%). Point at a part, on the dial or in the legend, to single it out. A dial turns clockwise in every script, so the ring keeps its direction in RTL. Reduced motion: drawn lit, the total jumps.',
      },
    },
  },
  args: {
    segments: MACROS,
    unit: 'kcal',
    amountFormat: { style: 'unit', unit: 'gram', unitDisplay: 'short' },
  },
}
export default meta
type Story = StoryObj<ShareRingProps>

const frame = (children: ReactNode) => <div className="w-[34rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-surface p-6">{children}</div>

export const Default: Story = { name: 'Macros', render: (args) => frame(<ShareRing {...args} size="lg" />) }

/** `max` above the total: 606 of a 2,000 kcal day, the rest of the ring dark. */
export const OfATarget: Story = { name: 'Of a target', args: { max: 2000 }, render: (args) => frame(<ShareRing {...args} size="default" />) }

/** Any composition: where a month’s money went, in the five chart colors, with the legend under the dial. */
export const Budget: Story = {
  args: {
    segments: [
      { id: 'home', label: 'Home', value: 1450 },
      { id: 'food', label: 'Food', value: 620 },
      { id: 'travel', label: 'Travel', value: 310 },
      { id: 'fun', label: 'Going out', value: 240 },
      { id: 'other', label: 'Other', value: 180 },
    ],
    unit: 'EUR',
    amountFormat: { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 },
    legend: 'below',
  },
  render: (args) => (
    <div className="w-80 rounded-2xl border border-line bg-surface p-6">
      <ShareRing {...args} size="default" />
    </div>
  ),
}

/** Sizes, from the 28px ring that sits in a pill (no bowl, no legend) up. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-8 rounded-2xl border border-line bg-surface p-6">
      {(['xs', 'sm', 'default'] as const).map((size) => (
        <ShareRing key={size} {...args} size={size} legend={false} />
      ))}
    </div>
  ),
}

/** Nothing logged yet: every cell dark and the total at zero. */
export const Empty: Story = {
  args: { segments: MACROS.map((s) => ({ ...s, value: 0, amount: 0 })) },
  render: (args) => frame(<ShareRing {...args} size="default" />),
}
