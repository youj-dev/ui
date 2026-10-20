import type { Meta, StoryObj } from '@storybook/react-vite'
import { IsoBox } from './iso-box'
import { IsoCylinder } from './iso-cylinder'
import { IsoPlatform } from './iso-platform'
import { IsoScene } from './iso-scene'
import { IsoStack } from './iso-stack'
import { DotGrid, IsoFloor } from './grids'

const meta: Meta<typeof IsoScene> = {
  title: 'Motion/Graphics/IsoScene',
  component: IsoScene,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The stage for the isometric kit: one SVG that frames its shapes’ projected extent at full separation (or a `size` volume), drawn at `unit` CSS px per grid unit, centered, and scaled down to fit. When a shape names its parts, a callout rail of `rail` CSS px sits beside the drawing, so labels never cover geometry. Shapes written as direct children are painted far to near whatever their order. `assemble` drops them in on the settle spring the first time the scene is seen, far ones first; `explode` (a number, a boolean, or "hover") springs one separation value that stacks and `lift`ed shapes follow, so a reversal mid-way never jumps; `float` bobs a shape on one clock that pauses offscreen. Decorative by default (aria-hidden); `title` makes it a named image. Reduced motion: the final state, still.',
      },
    },
  },
  args: { assemble: true, explode: 'hover', unit: 24 },
  argTypes: {
    explode: { control: 'select', options: ['hover', 0, 0.5, 1] },
    unit: { control: { type: 'range', min: 12, max: 36, step: 2 } },
  },
}
export default meta
type Story = StoryObj<typeof IsoScene>

/** An edge node on its plinth, a spare in its bay and a sensor puck waiting to be placed. Hover to take the node apart. */
export const Hero: Story = {
  render: (args) => (
    <div className="relative isolate w-fit max-w-[92vw] overflow-hidden rounded-2xl border border-line bg-surface p-6 sm:p-8">
      <DotGrid gap={18} />
      <IsoScene {...args} title="An edge node on a plinth, beside an empty bay and a sensor puck">
        <IsoFloor w={10} d={10} kind="dots" />
        <IsoPlatform x={0.5} y={0.5} w={9} d={9} h={0.5} grid={1}>
          <IsoBox x={5.8} y={1.6} z={0.7} w={2.6} d={2.6} h={0} variant="ghost" />
        </IsoPlatform>
        <IsoStack
          x={1.6}
          y={4.6}
          z={0.7}
          w={3.6}
          d={3.6}
          gap={1.3}
          layers={[
            { id: 'base', h: 0.7, label: 'chassis', detail: 'die-cast, fanless' },
            { id: 'board', h: 0.25, inset: 0.3, label: 'mainboard', detail: '2 × 2.5 GbE' },
            { id: 'npu', h: 0.35, inset: 0.9, label: 'compute', detail: 'swappable module', lit: true },
            { id: 'lid', h: 0.5, variant: 'wire', label: 'lid', detail: 'four captive screws' },
          ]}
        />
        <IsoCylinder x={6.3} y={6.2} z={0.7} r={0.8} h={0.7} float lift={1} />
      </IsoScene>
    </div>
  ),
}

/** Painter's order from isoSort: written in any order, a row of boxes and a tall tower still overlap correctly. */
export const Order: Story = {
  args: { assemble: false, explode: 0 },
  render: (args) => (
    <IsoScene {...args}>
      <IsoFloor w={8} d={8} />
      <IsoBox x={5} y={5} w={2} d={2} h={1} tone="accent" />
      <IsoBox x={1} y={1} w={2} d={2} h={4} />
      <IsoBox x={3} y={4} w={2} d={1} h={2} tone="raised" />
      <IsoBox x={4} y={1} w={3} d={2} h={0.6} tone="sunken" />
      <IsoCylinder x={1} y={5} r={1} h={2.4} />
    </IsoScene>
  ),
}

/** Reduced motion: the same drawing, finished and still. Nothing drops or bobs; the separation jumps to its target. Switch Motion to "reduced" in the toolbar. */
export const ReducedMotion: Story = {
  name: 'Reduced motion',
  args: { assemble: true, explode: 1 },
  render: Hero.render,
}
