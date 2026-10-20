import type { Meta, StoryObj } from '@storybook/react-vite'
import { IsoBox } from './iso-box'
import { IsoScene } from './iso-scene'
import { IsoFloor } from './grids'
import type { IsoTone } from './tones'

const meta: Meta<typeof IsoBox> = {
  title: 'Motion/Graphics/IsoBox',
  component: IsoBox,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A box in an IsoScene: three faces shaded from the theme (top lightest, left a step down, right darkest, in both schemes) with hairline edges and the near top edges lit. `tone` picks a neutral or status ink, `color` takes any CSS color (token references stay in step with the theme). `variant="wire"` is a wireframe with its hidden edges dashed; `"ghost"` is a dashed outline for a place something will go. `h={0}` draws a tile; children draw on the top face and move with it. `float` bobs it, `lift` raises it with the scene’s separation. Reduced motion: still.',
      },
    },
  },
  args: { x: 1, y: 1, z: 0, w: 3, d: 3, h: 2, tone: 'neutral', variant: 'solid', float: false, lift: 0 },
  argTypes: {
    tone: { control: 'select', options: ['neutral', 'raised', 'sunken', 'accent', 'success', 'warning', 'danger'] },
    variant: { control: 'inline-radio', options: ['solid', 'wire', 'ghost'] },
  },
  render: (args) => (
    <IsoScene explode={1}>
      <IsoFloor w={5} d={5} />
      <IsoBox {...args} />
    </IsoScene>
  ),
}
export default meta
type Story = StoryObj<typeof IsoBox>

export const Playground: Story = {}

const TONES: IsoTone[] = ['neutral', 'raised', 'sunken', 'accent', 'success', 'warning', 'danger']

/** Every tone, solid, then as a wireframe and a ghost: the same light in both schemes. */
export const Tones: Story = {
  render: () => (
    <IsoScene unit={22}>
      <IsoFloor w={TONES.length * 3 + 1} d={9} />
      {TONES.map((tone, i) => (
        <IsoBox key={tone} x={1 + i * 3} y={1} w={2} d={2} h={2} tone={tone} />
      ))}
      {TONES.map((tone, i) => (
        <IsoBox key={`w-${tone}`} x={1 + i * 3} y={4} w={2} d={2} h={2} tone={tone} variant="wire" />
      ))}
      {TONES.map((tone, i) => (
        <IsoBox key={`g-${tone}`} x={1 + i * 3} y={7} w={2} d={2} h={i % 2 ? 0 : 2} tone={tone} variant="ghost" />
      ))}
    </IsoScene>
  ),
}

/** A board with parts on it: tiles and small boxes as children of the top face, moving with it. */
export const Decorated: Story = {
  render: () => (
    <IsoScene unit={30} assemble>
      <IsoBox x={0} y={0} w={6} d={4} h={0.4} tone="sunken">
        <IsoBox x={0.5} y={0.5} w={2} d={2} h={0.3} tone="raised" />
        <IsoBox x={3} y={0.6} w={1} d={1} h={0.25} tone="accent" />
        <IsoBox x={3} y={2.1} w={2.4} d={1.3} h={0} tone="neutral" variant="ghost" />
        <IsoBox x={4.6} y={0.6} w={0.8} d={0.5} h={0.2} />
      </IsoBox>
    </IsoScene>
  ),
}
