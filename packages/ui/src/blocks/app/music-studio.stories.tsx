import type { Meta, StoryObj } from '@storybook/react-vite'
import { MusicStudio } from './music-studio'

const meta: Meta<typeof MusicStudio> = {
  title: 'Blocks/App/Music studio',
  component: MusicStudio,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen' },
    docs: {
      description: {
        component:
          'Run a music session from controls that float over the song: play, change the tempo, snap the grid and search for clips. Playback is simulated so you can try it out.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof MusicStudio>

/** Paused two bars into the drop. Press play, change the tempo, switch the snap, or press `/` and type “hook”. */
export const Default: Story = {}

/** Its own page, for an app without the frame: the session capsule, search and vitals over the viewport. */
export const Standalone: Story = { args: { embedded: false } }

/** Playing from the top of the verse. */
export const Playing: Story = { args: { autoPlay: true, start: 8 * 4 } }
