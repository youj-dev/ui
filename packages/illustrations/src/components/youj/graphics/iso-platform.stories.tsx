import type { Meta, StoryObj } from '@storybook/react-vite'
import { IsoBox } from './iso-box'
import { IsoCylinder } from './iso-cylinder'
import { IsoPlatform } from './iso-platform'
import { IsoScene } from './iso-scene'

const meta: Meta<typeof IsoPlatform> = {
  title: 'Motion/Graphics/IsoPlatform',
  component: IsoPlatform,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A plinth for a scene to stand on: a base slab and, inset from its edge, a thinner plate, so the edge reads as a machined lip. A square plinth can engrave its plate with a grid in the scene’s own units (`grid`), so shapes placed on it line up with the lines; children draw on the plate (ghost tiles for bays, marks). `shape="round"` for a turntable. Sunken by default, so what stands on it carries the light. Reduced motion: still.',
      },
    },
  },
  args: { x: 0, y: 0, w: 8, d: 6, h: 0.6, lip: 0.2, inset: 0.35, grid: 1, shape: 'box', tone: 'sunken' },
  argTypes: {
    shape: { control: 'inline-radio', options: ['box', 'round'] },
    tone: { control: 'select', options: ['neutral', 'raised', 'sunken', 'accent'] },
  },
  render: (args) => (
    <IsoScene>
      <IsoPlatform {...args} />
    </IsoScene>
  ),
}
export default meta
type Story = StoryObj<typeof IsoPlatform>

export const Playground: Story = {}

/** A gridded plinth with two bays marked out and one filled, assembling as it scrolls into view. */
export const Bays: Story = {
  render: () => (
    <IsoScene assemble unit={26}>
      <IsoPlatform x={0} y={0} w={9} d={6} h={0.6} grid={1}>
        <IsoBox x={0.9} y={0.9} z={0.8} w={2} d={2} h={0} variant="ghost" />
        <IsoBox x={3.5} y={0.9} z={0.8} w={2} d={2} h={0} variant="ghost" />
        <IsoBox x={6.1} y={0.9} z={0.8} w={2} d={2} h={0} variant="ghost" tone="accent" />
      </IsoPlatform>
      <IsoBox x={0.9} y={0.9} z={0.8} w={2} d={2} h={1.6} />
      <IsoCylinder x={4} y={3.4} z={0.8} r={0.9} h={1.2} tone="raised" />
    </IsoScene>
  ),
}

/** Round: a turntable of two tiers. */
export const Round: Story = {
  args: { shape: 'round', w: 7, d: 7, h: 0.5, lip: 0.3, inset: 0.6, grid: undefined },
}
