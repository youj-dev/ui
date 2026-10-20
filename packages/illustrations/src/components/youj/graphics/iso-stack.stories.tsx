import type { Meta, StoryObj } from '@storybook/react-vite'
import { IsoBox } from './iso-box'
import { IsoScene } from './iso-scene'
import { IsoStack, type IsoStackLayer } from './iso-stack'
import { LineGrid } from './grids'

const LAYERS: IsoStackLayer[] = [
  { id: 'base', h: 0.6, label: 'base plate', detail: 'aluminum, 3 mm' },
  {
    id: 'cells',
    h: 0.9,
    inset: 0.25,
    label: 'cell pack',
    detail: '4 × 21700',
    lit: true,
    content: ({ x, y, z, w, d }) => (
      <>
        <IsoBox x={x + 0.3} y={y + 0.3} z={z} w={w / 2 - 0.45} d={d - 0.6} h={0.12} tone="accent" />
        <IsoBox x={x + w / 2 + 0.15} y={y + 0.3} z={z} w={w / 2 - 0.45} d={d - 0.6} h={0.12} tone="accent" />
      </>
    ),
  },
  { id: 'bms', h: 0.2, inset: 0.4, label: 'bms board', detail: 'balancing, CAN out' },
  { id: 'shell', h: 0.8, variant: 'wire', label: 'shell', detail: 'snap-fit, IP65' },
]

const meta: Meta<typeof IsoStack> = {
  title: 'Motion/Graphics/IsoStack',
  component: IsoStack,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A stack of slabs or disks taken apart by the scene’s separation: each layer travels in proportion to its height in the stack, on one spring, so reversing mid-way never jumps. Along z, each named layer gets a callout, a hairline leader to the scene’s rail beside the drawing with a mono capital label and a quieter detail, fading in as the layers part (together, the thing is one object). A `lit` layer takes the accent and a solid leader; `dim` quiets the rest. `content` draws on a layer’s top face and moves with it. Assembling, layers land bottom first. Reduced motion: the separation jumps to its target.',
      },
    },
  },
  args: { x: 0, y: 0, w: 4, d: 3, gap: 1.4, axis: 'z', shape: 'box', dim: false, layers: LAYERS },
  argTypes: {
    axis: { control: 'inline-radio', options: ['x', 'y', 'z'] },
    shape: { control: 'inline-radio', options: ['box', 'disk'] },
    layers: { control: false },
  },
}
export default meta
type Story = StoryObj<typeof IsoStack>

/** A battery module, exploded. Hover the drawing to put it back together. */
export const Exploded: Story = {
  render: (args) => (
    <div className="relative isolate w-fit max-w-[92vw] overflow-hidden rounded-2xl border border-line bg-surface p-8">
      <LineGrid gap={20} />
      <IsoScene explode={1} unit={30}>
        <IsoStack {...args} />
      </IsoScene>
    </div>
  ),
}

/** Parts on hover: the drawing is assembled until the pointer is over it. */
export const OnHover: Story = {
  name: 'Explode on hover',
  render: (args) => (
    <IsoScene explode="hover" assemble unit={30}>
      <IsoStack {...args} />
    </IsoScene>
  ),
}

/** Disks, one lit and the rest dimmed around it. */
export const Disks: Story = {
  args: {
    shape: 'disk',
    w: 4,
    d: 4,
    dim: true,
    layers: [
      { id: 'mount', h: 0.4, label: 'mount' },
      { id: 'coil', h: 0.5, inset: 0.3, label: 'charging coil', detail: '15 W', lit: true },
      { id: 'board', h: 0.2, inset: 0.2, label: 'driver board' },
      { id: 'cap', h: 0.5, variant: 'wire', label: 'cap' },
    ],
  },
  render: Exploded.render,
}

/** Along x: tiers laid out side by side, for a sequence rather than an assembly. */
export const AlongX: Story = {
  name: 'Along an axis',
  args: { axis: 'x', gap: 1.2, w: 1, d: 3, layers: LAYERS.map((l) => ({ ...l, h: 2, inset: 0, content: undefined })) },
  render: (args) => (
    <IsoScene explode="hover" unit={30}>
      <IsoStack {...args} />
    </IsoScene>
  ),
}
