import type { Meta, StoryObj } from '@storybook/react-vite'
import { graphite } from '@youj/core'
import { FleetOverview } from './fleet-overview'

const meta: Meta<typeof FleetOverview> = {
  title: 'Blocks/App/Fleet overview',
  component: FleetOverview,
  args: { theme: graphite },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen', address: 'harbor.app/fleet', partOf: 'app-logistics' },
    docs: {
      description: {
        component:
          'Track an ocean-freight fleet on a map: ships steaming along their lanes, a list of what is sailing, holding or in port, a voyage panel with route, ETA, log and manifest, and a storm to reroute around.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof FleetOverview>

/** A held ship open on the map, the storm warning above the list, its reroute one click away. */
export const Default: Story = {}

/** Its own page, for an app without the frame: the map fills the viewport under its panels. */
export const Standalone: Story = { args: { embedded: false } }

/** No voyage open: the whole fleet framed. */
export const WholeFleet: Story = { name: 'Whole fleet', args: { defaultSelectedId: null } }

/** The same screen in the light theme. */
export const Light: Story = { globals: { theme: 'light' } }

/** The same screen in the dark theme. */
export const Dark: Story = { globals: { theme: 'dark' } }

/** A phone’s width: the map above the list, and a voyage opens in a drawer. */
export const Phone: Story = { args: { defaultSelectedId: null }, globals: { viewport: { value: 'mobile1', isRotated: false }, device: 'touch' } }
