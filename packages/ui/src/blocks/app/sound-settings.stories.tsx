import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { DEFAULT_SOUND_SETTINGS, SoundSettings } from './sound-settings'

const meta: Meta<typeof SoundSettings> = {
  title: 'Blocks/App/Sound settings',
  component: SoundSettings,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Let people choose a sound pack, set the volume and pick which moments make a sound, with a Play button for each. Nothing plays until they press it. Pass the settings to your YoujProvider and wrap the app in SoundEventFilter.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof SoundSettings>

export const Default: Story = {}

/** Sounds off: the speaker is crossed out and everything below it rests. */
export const Muted: Story = { args: { defaultValue: { ...DEFAULT_SOUND_SETTINGS, enabled: false } } }

/** Under reduced motion, sounds go quiet with it; the page says why, next to the switch that keeps them. */
export const ReducedMotion: Story = { name: 'Reduced motion', globals: { reducedMotion: 'always' } }

/** Your app's words (here German), with the settings kept by the app through `onValueChange`. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    defaultValue: { ...DEFAULT_SOUND_SETTINGS, pack: 'felt', volume: 0.3, events: { ...DEFAULT_SOUND_SETTINGS.events, tap: false } },
    onValueChange: fn(),
    copy: {
      title: 'Klang',
      description: 'Kurze Töne, die bestätigen, was du gerade getan hast. Sie spielen nur als Antwort auf dich.',
      reset: 'Zurücksetzen',
      interfaceSounds: 'Oberflächentöne',
      onDescription: 'An für alles, was du in der App tust.',
      volume: 'Lautstärke',
      packTitle: 'Klangpaket',
      packDescription: 'Eine Klangfamilie für die ganze App.',
      eventsTitle: 'Ton abspielen bei',
      play: 'Abspielen',
    },
  },
}
