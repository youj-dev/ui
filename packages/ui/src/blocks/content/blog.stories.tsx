import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { defineTheme } from '@youj/core'
import { Blog } from './blog'

/** Field Notes' red and square corners. */
const fieldNotes = defineTheme({
  accent: 'oklch(0.58 0.21 25)', // youj-allow: theme accent
  radius: 'sm',
})

const meta: Meta<typeof Blog> = {
  title: 'Blocks/Content/Blog',
  component: Blog,
  // The showcase's look: the block itself inherits the app's theme.
  args: { theme: fieldNotes },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen' },
    docs: {
      description: {
        component:
          'Give your journal a magazine-style home with an article view for reading each story.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Blog>

export const Index: Story = {}

export const Article: Story = { args: { defaultPostId: 'slow-interfaces' } }

/** With your data: a bakery's journal with its own posts, brand and words; opening a post is reported in Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    brand: { name: 'Crumb & Co. Journal' },
    rssHref: null,
    copy: { tagline: 'Notes from the bakehouse', featured: 'This week', latest: 'From the oven', allNotes: 'All posts', minRead: (n: number) => `${n} min` },
    posts: [
      {
        id: 'levain',
        title: 'Keeping a levain alive through August',
        dek: 'Heat makes starters sprint. Here is how we slow ours down without losing the sour.',
        category: 'Bread',
        author: 'Inès Laurent',
        role: 'Head baker',
        date: 'Aug 30, 2026',
        minutes: 5,
        cover: 'stripes',
        glyph: '∿',
        quote: 'A cold fridge buys you a day; a stiff starter buys you three.',
        sections: [
          { id: 'heat', heading: 'Why heat hurries it', body: ['Yeast and bacteria both speed up as the kitchen warms, and the bacteria win.'] },
          { id: 'stiff', heading: 'Go stiff', body: ['Feed at 50% hydration and the starter keeps its shape and its patience.'] },
        ],
      },
      { id: 'butter', title: 'Laminating with cultured butter', dek: 'More flavour, less forgiveness.', category: 'Pastry', author: 'Ravi Mehta', date: 'Aug 12, 2026', minutes: 7, cover: 'grid', glyph: '≡' },
      { id: 'rye', title: 'The 100% rye we almost gave up on', dek: 'Three months, forty loaves, one good crumb.', category: 'Bread', author: 'Inès Laurent', date: 'Jul 28, 2026', minutes: 9, cover: 'split', glyph: '◑' },
    ],
    onPostIdChange: fn(),
  },
}
