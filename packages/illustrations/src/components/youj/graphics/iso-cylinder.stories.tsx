import type { Meta, StoryObj } from '@storybook/react-vite'
import { IsoCylinder } from './iso-cylinder'
import { IsoScene } from './iso-scene'
import { IsoFloor } from './grids'

const meta: Meta<typeof IsoCylinder> = {
  title: 'Motion/Graphics/IsoCylinder',
  component: IsoCylinder,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A cylinder standing in the square footprint `x..x+2r`, `y..y+2r`: a lit top ellipse over a side shaded from the left face’s color to the right’s, so it reads round in the same light as the boxes beside it. `h={0}` draws a disc on a plane; the wireframe dashes the far half of its base. Same `tone`, `color`, `variant`, `float` and `lift` as IsoBox. Reduced motion: still.',
      },
    },
  },
  args: { x: 1, y: 1, r: 1.5, h: 2.5, tone: 'neutral', variant: 'solid', float: false },
  argTypes: {
    tone: { control: 'select', options: ['neutral', 'raised', 'sunken', 'accent', 'success', 'warning', 'danger'] },
    variant: { control: 'inline-radio', options: ['solid', 'wire', 'ghost'] },
  },
  render: (args) => (
    <IsoScene>
      <IsoFloor w={5} d={5} />
      <IsoCylinder {...args} />
    </IsoScene>
  ),
}
export default meta
type Story = StoryObj<typeof IsoCylinder>

export const Playground: Story = {}

/** Three volumes in a row, solid, wire and ghost; the ghost is where a fourth will stand. */
export const Variants: Story = {
  render: () => (
    <IsoScene unit={26}>
      <IsoFloor w={11} d={4} kind="dots" />
      <IsoCylinder x={0.5} y={0.5} r={1.2} h={3} />
      <IsoCylinder x={3.3} y={0.5} r={1.2} h={2.2} tone="accent" float />
      <IsoCylinder x={6.1} y={0.5} r={1.2} h={2.6} variant="wire" />
      <IsoCylinder x={8.9} y={0.5} r={1.2} h={1.4} variant="ghost" />
    </IsoScene>
  ),
}
