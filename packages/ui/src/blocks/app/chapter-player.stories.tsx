import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { ChapterPlayer, type ChapterPlayerChapter } from './chapter-player'
import { speech } from './chapter-player/data'

const meta: Meta<typeof ChapterPlayer> = {
  title: 'Blocks/App/Chapter Player',
  component: ChapterPlayer,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Explore a player with chapter navigation, speed controls and clip selection. Podcasts, lecture recordings and audiobooks read the same way: the media, its chapters and its words are props. Playback is simulated so you can try the interface.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof ChapterPlayer>

/** A talk-show episode: six chapters, the playhead a little into the third. */
export const Default: Story = { name: 'Podcast episode' }

/** Near the end, in the listener mail. */
export const Ending: Story = { args: { start: 39 * 60 + 5 } }

const topics: ChapterPlayerChapter[] = [
  { start: 0, title: 'Recap: nucleophiles' },
  { start: 4 * 60 + 20, title: 'Electrophiles and leaving groups' },
  { start: 13 * 60 + 45, title: 'SN1 versus SN2' },
  { start: 27 * 60 + 10, title: 'A worked example' },
  { start: 40 * 60 + 35, title: 'Stereochemistry check' },
  { start: 47 * 60 + 5, title: 'Questions from the room' },
]
const lecture = 52 * 60 + 20

/** Education: a lecture recording whose chapters are its topics, with its own words for them. */
export const LectureRecording: Story = {
  name: 'Lecture recording',
  args: {
    media: {
      series: 'Organic Chemistry 201',
      author: 'Prof. Daniel Whitfield',
      part: 14,
      title: 'Reaction mechanisms',
      date: new Date(2026, 9, 7).getTime(),
      length: lecture,
      chapters: topics,
      peaks: speech(lecture, topics, lecture, 201),
    },
    start: 15 * 60 + 8,
    onShareClip: fn(),
    copy: {
      subtitle: (series: string, part?: number) => `${series} · Lecture ${part}`,
      chapters: 'Topics',
      chapterCount: (n: number) => `${n} topics`,
      status: 'Recorded in Room 210',
      transcript: 'Lecture notes',
    },
  },
}

const book: ChapterPlayerChapter[] = [
  { start: 0, title: 'Prologue' },
  { start: 11 * 60 + 30, title: 'The harbor at dawn' },
  { start: 36 * 60 + 15, title: 'A letter from the coast' },
  { start: 61 * 60 + 50, title: 'The salt road' },
  { start: 88 * 60 + 5, title: 'What the tide left' },
  { start: 113 * 60 + 40, title: 'The lamp keeper' },
  { start: 141 * 60 + 20, title: 'Epilogue' },
]
const audiobook = 2 * 3600 + 52 * 60 + 40

/** An audiobook: one long recording split into chapters, with no episode number or date. */
export const Audiobook: Story = {
  name: 'Audiobook',
  args: {
    media: {
      series: 'Audiobook',
      author: 'Ines Calder',
      title: 'The Salt Road',
      length: audiobook,
      chapters: book,
      peaks: speech(audiobook, book, 900, 77),
    },
    start: 64 * 60 + 12,
    onShareClip: fn(),
    copy: {
      byline: (author: string) => `by ${author}`,
      status: 'Sleep timer off',
      transcript: 'Bookmarks',
    },
  },
}

/** Skeletons hold the player and the chapters while the media loads; the footer’s time left turns to one too. */
export const Loading: Story = { args: { loading: true } }

/** Nothing to play: the empty message in the player’s place. */
export const Empty: Story = { args: { media: null } }

/** The load failed: the message with Retry in the player’s place. */
export const Error: Story = { args: { error: 'Couldn’t load the recording.', onRetry: fn() } }

/** Drawn as its own page, with the title as the page’s `h1`. */
export const Standalone: Story = { args: { embedded: false } }
