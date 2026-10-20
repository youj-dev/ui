import type { Meta, StoryObj } from '@storybook/react-vite'
import { defineTheme } from '@youj/core'
import { MoneyOverview } from './money-overview'

const kite = defineTheme({ accent: 'oklch(0.72 0.14 90)', neutral: { hue: 255, chroma: 0.02, wash: 0.4 }, radius: 'lg' }) // youj-allow: theme accent

const meta: Meta<typeof MoneyOverview> = {
  title: 'Blocks/App/Money overview',
  component: MoneyOverview,
  args: { theme: kite },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen', address: 'kite.bank/home' },
    docs: {
      description: {
        component:
          'Show a personal bank’s home: the balance with its hide-amounts toggle, a swipeable card carousel, spending by category, budgets and a day-grouped activity list, with a send-money flow that adds the payment to today.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof MoneyOverview>

/** Two columns on a wide screen: balance, cards and activity beside spending and budgets. The eye hides every amount. */
export const Default: Story = {}

/** Its own page, for an app without the frame: the greeting on a canvas, in a `main`. */
export const Standalone: Story = { args: { embedded: false } }

/** The same screen in the light theme. */
export const Light: Story = { globals: { theme: 'light' } }

/** The same screen in the dark theme. */
export const Dark: Story = { globals: { theme: 'dark' } }

/** A phone’s width: one column, in the same order, with the send flow as a drawer from the bottom. */
export const Phone: Story = { globals: { viewport: { value: 'mobile1', isRotated: false }, device: 'touch' } }
