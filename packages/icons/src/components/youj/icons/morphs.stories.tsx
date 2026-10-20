import type { Meta, StoryObj } from '@storybook/react-vite'
import { icons } from './index'
import { autoplayParameters, morphMeta, morphParameters, MorphsView, type MorphArgs } from './story-kit'

const stateIcons = icons.filter((I) => I.meta.states)

const meta = {
  ...morphMeta,
  title: 'Icons/Morphs',
  parameters: morphParameters(
    `Every state icon (${stateIcons.length} of them). Each takes a controlled \`active\` prop and morphs between its two states: shared-structure path morphs (play ↔ pause, sun ↔ moon), sequenced transforms (menu ↔ close) and masked slashes (eye-off, mic-off). Reversing plays the exact opposite choreography, and a toggle mid-morph reverses from wherever it is. Under reduced motion the state switches instantly. Use the toolbar's ¼× speed to study them.`,
  ),
} satisfies Meta<MorphArgs>

export default meta
type Story = StoryObj<MorphArgs>

const render: Story['render'] = ({ auto }) => (
  <MorphsView
    auto={auto}
    icons={stateIcons}
    strokeWidth={1.5}
    showName={false}
    heading="Two states, one continuous shape"
    intro="Click any card to toggle it. Toggle again mid-morph to watch it reverse."
  />
)

export const Morphs: Story = { render }

export const Autoplay: Story = {
  args: { auto: true },
  parameters: autoplayParameters,
  render,
}
