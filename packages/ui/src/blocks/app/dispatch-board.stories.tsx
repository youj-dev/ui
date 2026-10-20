import type { Meta, StoryObj } from '@storybook/react-vite'
import { basalt } from '@youj/core'
import { DispatchBoard } from './dispatch-board'

const meta: Meta<typeof DispatchBoard> = {
  title: 'Blocks/App/Dispatch board',
  component: DispatchBoard,
  args: { theme: basalt },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen', address: 'ops.lanefield.app/dispatch', partOf: 'app-logistics' },
    docs: {
      description: {
        component:
          'Run a freight dispatch board: a queue of loads, the selected one on a route map with a reroute to approve or compare, every driver’s day as lanes with proposed runs dashed, and the dispatch agent’s proposals.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof DispatchBoard>

/** The load at risk on the map, its reroute waiting on you. */
export const Default: Story = {}

/** Its own page, for an app without the frame: a Dispatch title row over a centered canvas. */
export const Standalone: Story = { args: { embedded: false } }

/** A delayed load whose fix is a new driver: the proposed run is dashed on Priya’s lane. */
export const Reassign: Story = { args: { defaultLoad: 'LD-4930' } }

/** The same screen in the light theme. */
export const Light: Story = { globals: { theme: 'light' } }

/** The same screen in the dark theme. */
export const Dark: Story = { globals: { theme: 'dark' } }

/** A phone’s width: the queue, the map, the lanes and the agent’s proposals in one column. */
export const Phone: Story = { globals: { viewport: { value: 'mobile1', isRotated: false }, device: 'touch' } }
