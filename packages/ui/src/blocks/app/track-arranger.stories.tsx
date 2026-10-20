import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { TrackArranger, type TrackArrangerClip, type TrackArrangerTrack } from './track-arranger'

const meta: Meta<typeof TrackArranger> = {
  title: 'Blocks/App/Track Arranger',
  component: TrackArranger,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Arrange a project from its parts: move and trim clips, mute or solo a track, and set each clip’s volume. Song sketches, podcast edits and video timelines read the same way: the project, its tracks and clips are props. Playback is simulated so you can try the interface.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof TrackArranger>

/** A song idea in four tracks: a hummed line, guitar, bass and a beat. */
export const Default: Story = { name: 'Song idea' }

/** Nothing selected yet: the inspector says what it's for. */
export const NothingSelected: Story = { name: 'Nothing selected', args: { defaultSelected: null, start: 0 } }

/** Deterministic loudness samples from a function of time, 0 to 1. */
const wave = (length: number, resolution: number, level: (t: number) => number) =>
  Array.from({ length: Math.round(length / resolution) }, (_, i) => Math.round(Math.min(1, Math.max(0, level(i * resolution))) * 100) / 100)
/** Speech: phrases of different strength with a breath between them. */
const speech = (seed: number) => (t: number) => (Math.sin(t * 0.55 + seed) > -0.7 ? 0.3 + 0.5 * Math.abs(Math.sin(t * 2.3 + seed * 3)) * (0.7 + 0.3 * Math.sin(t * 0.21 + seed)) : 0.06)
/** Music: a steady bed that swells every few seconds. */
const bed = (t: number) => 0.4 + 0.3 * Math.sin(t * 0.9) * Math.cos(t * 0.17)

const R = 0.1
const episode: TrackArrangerTrack[] = [
  { id: 'host', name: 'Host', caption: 'Mic 1', color: 1, peaks: wave(90, R, speech(1)) },
  { id: 'guest', name: 'Guest', caption: 'Mic 2', color: 2, peaks: wave(90, R, speech(2.4)) },
  { id: 'music', name: 'Music', caption: 'Bed', color: 3, peaks: wave(90, R, bed) },
  { id: 'ads', name: 'Ads', caption: 'Sponsor', color: 5, peaks: wave(90, R, speech(5.1)) },
]
const episodeClips: TrackArrangerClip[] = [
  { id: 'intro', track: 'host', name: 'intro', start: 0, end: 12 },
  { id: 'q1', track: 'host', name: 'question 1', start: 28, end: 36, offset: 28 },
  { id: 'q2', track: 'host', name: 'question 2', start: 58, end: 66, offset: 58 },
  { id: 'outro', track: 'host', name: 'outro', start: 80, end: 90, offset: 80 },
  { id: 'a1', track: 'guest', name: 'answer 1', start: 12, end: 28, offset: 12 },
  { id: 'a2', track: 'guest', name: 'answer 2', start: 36, end: 48, offset: 36, gain: 2 },
  { id: 'a3', track: 'guest', name: 'answer 3', start: 66, end: 80, offset: 66 },
  { id: 'bed-in', track: 'music', name: 'bed in', start: 0, end: 10, gain: -6 },
  { id: 'bed-out', track: 'music', name: 'bed out', start: 80, end: 90, offset: 80, gain: -3 },
  { id: 'mid-roll', track: 'ads', name: 'mid-roll', start: 48, end: 58, offset: 48 },
]

/** Podcast production: a host, a guest, a music bed and a sponsor read laid end to end, with its own words. */
export const PodcastEdit: Story = {
  name: 'Podcast edit',
  args: {
    project: { title: 'Episode 43: The quiet shift', length: 90, detail: '2 speakers · mono' },
    tracks: episode,
    clips: episodeClips,
    start: 31,
    defaultSelected: 'a2',
    onExport: fn(),
    copy: {
      subtitle: (detail?: string) => `Episode edit · ${detail}`,
      timeline: 'Episode timeline',
      gain: 'Level',
      none: 'Select a clip to set its start, end and level.',
      saved: 'Autosaved',
      export: 'Export episode',
      exported: 'Exported',
      announceExported: 'Episode exported',
      duplicate: 'Duplicate edit',
    },
  },
}

const VR = 0.25
const video: TrackArrangerTrack[] = [
  { id: 'video', name: 'Video', caption: 'Camera A', color: 2, peaks: wave(60, VR, (t) => 0.12 + 0.1 * Math.abs(Math.sin(t * 0.8))) },
  { id: 'titles', name: 'Titles', caption: 'Overlay', color: 4, peaks: wave(60, VR, () => 0.05) },
  { id: 'voice', name: 'Voice-over', caption: 'Studio mic', color: 1, peaks: wave(60, VR, speech(3.3)) },
  { id: 'music', name: 'Music', caption: 'Licensed', color: 3, peaks: wave(60, VR, bed) },
]
const videoClips: TrackArrangerClip[] = [
  { id: 'wide', track: 'video', name: 'wide shot', start: 0, end: 12 },
  { id: 'close', track: 'video', name: 'product close-up', start: 12, end: 30, offset: 12 },
  { id: 'broll', track: 'video', name: 'team b-roll', start: 30, end: 44, offset: 30 },
  { id: 'end', track: 'video', name: 'end card', start: 44, end: 60, offset: 44 },
  { id: 'title', track: 'titles', name: 'title card', start: 2, end: 8, offset: 2 },
  { id: 'lower', track: 'titles', name: 'lower third', start: 20, end: 26, offset: 20 },
  { id: 'cta', track: 'titles', name: 'call to action', start: 48, end: 58, offset: 48 },
  { id: 'vo-1', track: 'voice', name: 'intro line', start: 4, end: 18, offset: 4 },
  { id: 'vo-2', track: 'voice', name: 'features', start: 18, end: 40, offset: 18, gain: 1.5 },
  { id: 'vo-3', track: 'voice', name: 'tagline', start: 46, end: 54, offset: 46 },
  { id: 'track', track: 'music', name: 'launch theme', start: 0, end: 60, gain: -4 },
]

/** Video: footage, titles, a voice-over and a music track on a 60-second teaser, with its own words. */
export const VideoTimeline: Story = {
  name: 'Video timeline',
  args: {
    project: { title: 'Launch teaser', length: 60, detail: '1080p · 24 fps' },
    tracks: video,
    clips: videoClips,
    resolution: VR,
    start: 21,
    defaultSelected: 'vo-2',
    onExport: fn(),
    copy: {
      subtitle: (detail?: string) => `Cut 3 · ${detail}`,
      timeline: 'Video timeline',
      gain: 'Volume',
      none: 'Select a clip to set its start, end and volume.',
      saved: 'Saved to the project',
      export: 'Render video',
      exporting: 'Rendering…',
      exported: 'Rendered',
      announceExported: 'Video rendered',
      duplicate: 'Duplicate cut',
    },
  },
}

/** Skeletons hold the transport, the lanes and the inspector while the project loads. */
export const Loading: Story = { args: { loading: true } }

/** No tracks yet: the empty message in the body’s place. */
export const Empty: Story = { args: { tracks: [], clips: [] } }

/** The load failed: the message with Retry in the body’s place. */
export const Error: Story = { args: { error: 'Couldn’t load the project.', onRetry: fn() } }

/** Drawn as its own page, with the title as the page’s `h1`. */
export const Standalone: Story = { args: { embedded: false } }
