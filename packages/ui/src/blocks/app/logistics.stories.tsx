import type { Meta, StoryObj } from '@storybook/react-vite'
import { basalt } from '@youj/core'
import { Logistics } from './logistics'

const meta: Meta<typeof Logistics> = {
  title: 'Blocks/App/Logistics',
  component: Logistics,
  args: { theme: basalt },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen', address: 'ops.lanefield.app/logistics' },
    docs: {
      description: {
        component:
          'Run freight from one screen: the ocean fleet on a map, the dispatch board with its queue, route and agent proposals, and one shipment in full, as three views that keep one size. Demo content — edit after adding.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof Logistics>

/** The fleet on the map beside its ships, two of them holding for a storm. */
export const Default: Story = {}

/** The dispatch board: the queue, the at-risk load on the map and the agent’s proposals. */
export const Dispatch: Story = { args: { defaultView: 'dispatch' } }

/** Load LD-4821 in full, its reroute waiting on you. */
export const Shipment: Story = { args: { defaultView: 'shipment' } }

/** Its own page, for an app without the frame: the whole viewport. */
export const Standalone: Story = { args: { embedded: false } }

/** The same screen in the light theme. */
export const Light: Story = { globals: { theme: 'light' } }

/** The same screen in the dark theme. */
export const Dark: Story = { globals: { theme: 'dark' } }

/** A phone’s width: each view scrolls inside the same height. */
export const Phone: Story = { globals: { viewport: { value: 'mobile1', isRotated: false }, device: 'touch' } }
