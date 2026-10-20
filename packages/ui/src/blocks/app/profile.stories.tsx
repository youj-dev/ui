import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { defineTheme } from '@youj/core'
import { Profile } from './profile'

const ember = defineTheme({ accent: 'oklch(0.66 0.18 45)' }) // youj-allow: theme accent

const meta: Meta<typeof Profile> = {
  title: 'Blocks/App/Profile',
  component: Profile,
  // The showcase's look: the block itself inherits the app's theme.
  args: { theme: ember },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen' },
    docs: {
      description: {
        component:
          'Give creators a public profile with a cover, follow controls and a link visitors can copy.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Profile>

export const Default: Story = {}

/** Its own page, for an app without the frame: the name over a full-bleed cover. */
export const Standalone: Story = { args: { embedded: false } }

/** Someone else's profile, stats and strings; every action reports to the Actions panel. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    user: {
      name: 'Kofi Mensah',
      handle: 'kofimakes',
      initials: 'KM',
      verified: true,
      location: 'Accra',
      role: 'Synth builder at Harmattan Audio',
      bio: 'I build small analog synths and write about the circuits. Next up: a four-voice drone box.',
      url: 'https://harmattan.audio/@kofimakes',
    },
    followers: 3_204,
    stats: [
      { label: 'Following', value: 142 },
      { label: 'Kits', value: 6 },
      { label: 'Sold', value: 1_870 },
    ],
    work: [
      { id: 'drift', name: 'Drift', meta: 'Drone synth · 2026', glyph: '∿', face: 'font-mono', tone: 'bg-accent-subtle text-accent', likes: 812 },
      { id: 'pulse', name: 'Pulse 8', meta: 'Sequencer · 2025', glyph: '▮▯▮', face: 'font-mono', tone: 'bg-fg text-canvas', likes: 540 },
    ],
    skills: ['Analog circuits', 'PCB design', 'Eurorack'],
    status: { title: 'Taking kit orders', description: 'Ships in two weeks.' },
    friends: [
      { id: 'y', name: 'Yaa Asantewaa' },
      { id: 'm', name: 'Mo Diallo' },
      { id: 'e', name: 'Efua Owusu' },
    ],
    links: [
      { label: 'harmattan.audio', href: '#' },
      { label: 'Build logs', href: '#' },
    ],
    about: <p>Electrical engineer by training; synth builder by night. Every kit ships with a hand-drawn schematic.</p>,
    copy: { follow: 'Subscribe', following: 'Subscribed', workTab: 'Kits' },
    onFollowingChange: fn(),
    onMessage: fn(),
    onCopyLink: fn(),
  },
}
