import type { Meta, StoryObj } from '@storybook/react-vite'
import { ExplodedView } from './exploded-view'

const meta: Meta<typeof ExplodedView> = {
  title: 'Blocks/App/Exploded View',
  component: ExplodedView,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card', preset: 'basalt', address: 'fleet.northwind.dev/hardware/relay-r4' },
    docs: {
      description: {
        component:
          'Explore a device layer by layer with an exploded drawing beside its specifications. Demo content — edit after adding.',
      },
    },
  },
  argTypes: { theme: { control: false }, focusPart: { control: 'select', options: ['chassis', 'mainboard', 'compute', 'spreader', 'lid'] } },
}
export default meta
type Story = StoryObj<typeof ExplodedView>

export const Default: Story = { name: 'Headphones' }

/** Assembled, with the heat spreader in focus: the figures still point at their parts. */
export const Assembled: Story = { args: { defaultAssembled: true, focusPart: 'spreader' } }

/** The same device with its own spec sheet and labels: a faster module, more ports, a sealed lid. The drawing is the same five layers. */
export const RelayR4Pro: Story = {
  name: 'Relay R4 Pro',
  args: {
    focusPart: 'mainboard',
    copy: {
      title: 'Relay R4 Pro',
      subtitle: 'edge gateway · rev A',
      status: 'Pre-order · ships in Q1',
      headline: 'Twice the compute in the same footprint',
      body: 'The Pro keeps the chassis and the lid and swaps the module: 40 TOPS in the same socket, a vapor chamber that now reaches the radios, and two more ethernet ports on the mainboard. Existing mounts and antennas carry over.',
      statusLine: 'Rev A · pre-orders open',
      order: 'Pre-order module',
      ordering: 'Reserving',
      ordered: 'Module reserved',
      orderedAnnounce: 'Compute module reserved for Relay R4 Pro',
      drawing: 'Relay R4 Pro taken apart into five layers: chassis, mainboard, compute module, heat spreader and lid',
    },
    parts: [
      { id: 'chassis', name: 'chassis', detail: 'die-cast, fanless' },
      { id: 'mainboard', name: 'mainboard', detail: '5G modem, 4 × 2.5 GbE' },
      { id: 'compute', name: 'compute module', detail: 'swappable, 40 TOPS' },
      { id: 'spreader', name: 'heat spreader', detail: 'vapor chamber, wider' },
      { id: 'lid', name: 'lid', detail: 'gasketed, four screws' },
    ],
    specs: [
      { id: 'npu', label: 'NPU', figures: [['40', 'TOPS']], part: 'compute' },
      { id: 'power', label: 'Power', figures: [['12', 'W typ'], ['18', 'W peak']], part: 'chassis' },
      { id: 'thermal', label: 'Thermal', figures: [['−40 to +70', '°C']], part: 'spreader' },
      { id: 'radios', label: 'Radios', figures: [['5G · Wi-Fi 7 · Thread', '']], part: 'mainboard' },
      { id: 'ethernet', label: 'Ethernet', figures: [['4 × 2.5', 'GbE']], part: 'mainboard' },
      { id: 'ingress', label: 'Ingress', figures: [['IP67', '']], part: 'lid' },
    ],
  },
}
