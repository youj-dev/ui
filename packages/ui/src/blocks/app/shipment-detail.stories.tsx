import type { Meta, StoryObj } from '@storybook/react-vite'
import { basalt } from '@youj/core'
import { ShipmentDetail } from './shipment-detail'
import { ROUTE, SHIPMENT } from './shipment-detail/data'

const meta: Meta<typeof ShipmentDetail> = {
  title: 'Blocks/App/Shipment detail',
  component: ShipmentDetail,
  args: { theme: basalt },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen', address: 'ops.lanefield.app/shipments/LD-4821', partOf: 'app-logistics' },
    docs: {
      description: {
        component:
          'Follow one shipment: the route as a stage rail with a detour, the vehicle with its readings called out, the route agent’s reroute to approve, the timeline, the record and the documents.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof ShipmentDetail>

/** At risk, the reroute waiting on you. */
export const AtRisk: Story = { name: 'At risk' }

/** Its own page, for an app without the frame: a large title row over a centered canvas. */
export const Standalone: Story = { args: { embedded: false } }

/** The reroute approved: on time, the detour marked approved, the decision on the timeline. */
export const Approved: Story = { args: { defaultDecision: 'approved' } }

/** With your data: another shipment, lane and detour, fed through props. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    shipment: { ...SHIPMENT, id: 'SH-1290', customer: 'Northwind Foods', from: 'Lakeside Hub', to: 'Hillcrest Market', pallets: 9, load: '9 of 26 pallets · 5,100 lb' },
    route: { ...ROUTE, road: 'Route 9', detour: { ...ROUTE.detour, via: 'Mill Ln' } },
    documents: [{ id: 'inv', name: 'Invoice', detail: 'Net 30 · Northwind Foods', status: 'filed' }],
  },
}

/** The same screen in the light theme. */
export const Light: Story = { globals: { theme: 'light' } }

/** The same screen in the dark theme. */
export const Dark: Story = { globals: { theme: 'dark' } }

/** A phone’s width: one column, the agent’s case right after the route it is about. */
export const Phone: Story = { globals: { viewport: { value: 'mobile1', isRotated: false }, device: 'touch' } }
