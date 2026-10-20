import type { Meta, StoryObj } from '@storybook/react-vite'
// The docs site's Sound builder is the one builder: the same component /docs/sound/builder renders.
import { SoundBuilder } from '../../../apps/docs/components/sound/sound-builder'

const meta: Meta<typeof SoundBuilder> = {
  title: 'Sound/Builder',
  component: SoundBuilder,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Every candidate for every cue, leveled to the cue’s loudness, with the default (the Glass pack) first. Play any, pick one and hear it, or add a file of your own: it’s decoded here, trimmed and matched to the pack. Hear the whole set against the default, and export the pack as a definePack file (and a .zip with your files as WAV). In a row, 1–5 play, 0 plays the default and Shift+1–5 picks. Picks live in the link; files stay in the tab.',
      },
    },
  },
  decorators: [(Story) => <div className="mx-auto max-w-6xl p-6">{Story()}</div>],
}
export default meta

export const Builder: StoryObj<typeof SoundBuilder> = {}
