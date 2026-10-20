type Category = string
type CoverStyle = 'orbit' | 'split' | 'stripes' | 'grid'

/** A part of an article: a heading in the table of contents and its paragraphs. */
interface BlogSection {
  id: string
  heading: string
  body: string[]
}

interface Post {
  id: string
  title: string
  /** The standfirst under the title. */
  dek: string
  /** Filters the index; the filters are the posts' categories, in order. */
  category: Category
  author: string
  /** The author's role, after the byline. */
  role?: string
  /** As it should read: "Sep 18, 2026". */
  date: string
  /** Reading time. */
  minutes: number
  /** A photo's URL for the cover, in place of a drawn one. */
  image?: string
  /** The drawn cover's pattern. Default 'orbit'. */
  cover?: CoverStyle
  /** The drawn cover's mark. */
  glyph?: string
  /** A pull quote set after the second section. */
  quote?: string
  /** The article: headings (for the table of contents) and paragraphs. Default: the demo's four sections. */
  sections?: BlogSection[]
}

const POSTS: Post[] = [
  {
    id: 'slow-interfaces',
    title: 'In praise of slow interfaces',
    dek: 'Speed is a feature until it isn’t. On the moments where a product should make you wait, and how to make the wait feel like care.',
    category: 'Essays',
    author: 'Mira Okafor',
    role: 'Design director',
    date: 'Sep 18, 2026',
    minutes: 9,
    cover: 'orbit',
    glyph: '◐',
    quote: 'A pause is only friction when nobody designed it.',
  },
  {
    id: 'grid-we-broke',
    title: 'The grid we broke on purpose',
    dek: 'How a twelve-column system turned into five, and why the museum signage project needed fewer rules, not more.',
    category: 'Process',
    author: 'Tomás Reyes',
    role: 'Senior designer',
    date: 'Sep 4, 2026',
    minutes: 6,
    cover: 'grid',
    glyph: '#',
    quote: 'The system was right. The building was wrong for it.',
  },
  {
    id: 'variable-serifs',
    title: 'Variable serifs, set small',
    dek: 'Optical sizing finally works on the web. Notes from setting a 9pt caption face for a newspaper redesign.',
    category: 'Type',
    author: 'Hana Ito',
    role: 'Type designer',
    date: 'Aug 21, 2026',
    minutes: 7,
    cover: 'split',
    glyph: 'Aa',
    quote: 'At nine points, every serif is a decision about ink.',
  },
  {
    id: 'plugin-we-deleted',
    title: 'The plugin we deleted',
    dek: 'We built an internal Figma plugin that saved everyone an hour a week. Then we removed it. A short post-mortem.',
    category: 'Tools',
    author: 'Jonah Weiss',
    role: 'Design engineer',
    date: 'Aug 7, 2026',
    minutes: 5,
    cover: 'stripes',
    glyph: '⌘',
    quote: 'The hour it saved was the hour we used to talk.',
  },
  {
    id: 'critique-rituals',
    title: 'Critique without the theater',
    dek: 'Three small changes to our weekly crit that made junior designers speak first and senior ones listen longer.',
    category: 'Process',
    author: 'Mira Okafor',
    role: 'Design director',
    date: 'Jul 24, 2026',
    minutes: 4,
    cover: 'orbit',
    glyph: '“',
    quote: 'The loudest person in a crit should be the work.',
  },
  {
    id: 'colour-in-print',
    title: 'Color that survives the press',
    dek: 'Screens forgive; paper remembers. Our checklist for brand colors that have to live on uncoated stock.',
    category: 'Essays',
    author: 'Hana Ito',
    role: 'Type designer',
    date: 'Jul 10, 2026',
    minutes: 8,
    cover: 'split',
    glyph: '●',
    quote: 'Uncoated paper is a second opinion on every color.',
  },
]

const BLOG_COPY = {
  tagline: 'A journal by Oblique Studio',
  rss: 'RSS feed',
  readingProgress: 'Reading progress',
  featured: 'Featured essay',
  latest: 'Latest notes',
  filter: 'Filter by category',
  all: 'All',
  minRead: (minutes: number) => `${minutes} min read`,
  emptyCategory: (category: string) => `Nothing in ${category} yet. It’s coming.`,
  empty: 'No posts yet.',
  allNotes: 'All notes',
  copyLink: 'Copy link',
  linkCopied: 'Link copied',
  copyError: 'Couldn’t copy',
  nextRead: 'Next read',
  readNote: 'Read the note',
}
type BlogCopy = typeof BLOG_COPY

const SECTIONS = [
  {
    id: 'the-brief',
    heading: 'The brief',
    body: [
      'Every project at the studio starts with a one-page brief, and this one was shorter than most. The client knew what they wanted to feel and very little about what they wanted to see, which is the best possible place to begin.',
      'We spent the first week not designing at all: sitting with the people who would use the thing, reading their complaints aloud, and sorting them into problems of speed, of clarity and of trust.',
    ],
  },
  {
    id: 'what-we-tried',
    heading: 'What we tried',
    body: [
      'Our first three directions were all reasonable, which was the problem. Each one solved the brief and none of them said anything. The fourth came from a sketch on the back of a printout, and it was the only one anybody remembered the next morning.',
      'We prototyped it in a day, tested it in two, and threw away half of it on the third. What survived was smaller and stranger than the sketch, and much better.',
    ],
  },
  {
    id: 'what-stuck',
    heading: 'What stuck',
    body: [
      'The pieces that lasted were the ones that asked the least of people. Fewer choices on the first screen, more patience on the second, and a clear way back from every mistake.',
      'It is tempting to call that restraint. It was mostly listening, done for long enough that the obvious answer had time to show up.',
    ],
  },
  {
    id: 'takeaways',
    heading: 'Takeaways',
    body: [
      'Write the brief as a feeling before you write it as a feature list. Design the fourth idea, not the first. And keep the printout: the good sketch is always on the back of something.',
    ],
  },
]

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return ((words[0]?.[0] ?? '') + (words.length > 1 ? (words.at(-1)?.[0] ?? '') : '')).toUpperCase() || '?'
}


export { BLOG_COPY, initials, POSTS, SECTIONS, type BlogCopy, type BlogSection, type Category, type CoverStyle, type Post }
