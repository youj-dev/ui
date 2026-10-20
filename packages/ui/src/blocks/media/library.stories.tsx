import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { MediaLibrary, type MediaLibraryAsset, type MediaLibraryFolder } from './library'

const meta: Meta<typeof MediaLibrary> = {
  title: 'Blocks/Media/Media library',
  component: MediaLibrary,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'A media picker that’s as quick from the keyboard as with a mouse: search, filter, folders, grid or list, an ordered selection with a maximum, a lightbox that grows from its tile, and uploads dropped straight into the open folder.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof MediaLibrary>

export const Default: Story = {}

/** As a list, for files where the name and size matter more than the picture. */
export const List: Story = { args: { defaultView: 'list' } }

/** Placeholders while the library loads. */
export const Loading: Story = { args: { loading: true } }

/** The library didn’t load: the reason, and Try again. */
export const Failed: Story = { args: { error: 'The media service didn’t answer in time.', onRetry: fn() } }

/** An empty library: drop files or upload them. */
export const EmptyLibrary: Story = { name: 'Empty', args: { assets: [], folders: [] } }

/** Its own page: a centered canvas and an `h1`. */
export const Standalone: Story = { args: { embedded: false } }

const P = '/blocks/products'
const MB = 1024 * 1024
const at = (day: number) => Date.UTC(2026, 8, day)
const SHOP_FOLDERS: MediaLibraryFolder[] = [
  { id: 'hero', name: 'Hero shots' },
  { id: 'detail', name: 'Details' },
]
const SHOP: MediaLibraryAsset[] = [
  {
    id: 'k1',
    name: 'kettle-front.webp',
    kind: 'image',
    preview: `${P}/kettle-sky.webp`,
    width: 1040,
    height: 1300,
    size: 1.5 * MB,
    folder: 'hero',
    alt: 'Sky blue kettle, front.',
    addedAt: at(20),
  },
  {
    id: 'k2',
    name: 'kettle-side.webp',
    kind: 'image',
    preview: `${P}/kettle-sky-side.webp`,
    width: 1040,
    height: 1300,
    size: 1.4 * MB,
    folder: 'detail',
    alt: 'Sky blue kettle, side.',
    addedAt: at(19),
  },
  {
    id: 'k3',
    name: 'kettle-cream.webp',
    kind: 'image',
    preview: `${P}/kettle-cream.webp`,
    width: 1040,
    height: 1300,
    size: 1.6 * MB,
    folder: 'hero',
    addedAt: at(18),
  },
  {
    id: 'k4',
    name: 'tea-set.webp',
    kind: 'image',
    preview: `${P}/tea-set.webp`,
    width: 1040,
    height: 1300,
    size: 2.1 * MB,
    folder: 'detail',
    addedAt: at(17),
  },
]

/** Your files and folders, one cover image only, inserted and uploaded through your API. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    assets: SHOP,
    folders: SHOP_FOLDERS,
    defaultSelection: ['k1'],
    max: 1,
    accept: 'image/*',
    copy: { title: 'Choose a cover', description: 'One image, shown first on the product page.', insert: () => 'Use as cover' },
    onInsert: fn(),
    onCancel: fn(),
    onUpload: fn(async (_file: File, { onProgress }: { onProgress: (p: number) => void }) => {
      onProgress(50)
      return { preview: `${P}/mug.webp` }
    }),
    onSelectionChange: fn(),
  },
}

const KB = 1024
const sep = (day: number, hour = 10) => Date.UTC(2026, 8, day, hour)
const UNITS: MediaLibraryFolder[] = [
  { id: 'unit-1', name: 'Unit 1 · Cells' },
  { id: 'unit-2', name: 'Unit 2 · Genetics' },
]
const COURSE: MediaLibraryAsset[] = [
  { id: 's1', name: 'cell-structure-slides.pdf', kind: 'document', size: 3.2 * MB, folder: 'unit-1', addedAt: sep(2) },
  { id: 'r1', name: 'reading-membrane-transport.pdf', kind: 'document', size: 640 * KB, folder: 'unit-1', addedAt: sep(2, 9) },
  {
    id: 'v1',
    name: 'lecture-1-cell-structure.mp4',
    kind: 'video',
    width: 1920,
    height: 1080,
    duration: 3160,
    size: 412 * MB,
    folder: 'unit-1',
    addedAt: sep(3),
  },
  { id: 'a1', name: 'office-hours-unit-1.m4a', kind: 'audio', duration: 1680, size: 24 * MB, folder: 'unit-1', addedAt: sep(4) },
  { id: 's2', name: 'mendelian-inheritance-slides.pdf', kind: 'document', size: 4.1 * MB, folder: 'unit-2', addedAt: sep(9) },
  { id: 'r2', name: 'reading-punnett-squares.pdf', kind: 'document', size: 520 * KB, folder: 'unit-2', addedAt: sep(9, 9) },
  {
    id: 'v2',
    name: 'lecture-2-genetics.mp4',
    kind: 'video',
    width: 1920,
    height: 1080,
    duration: 2940,
    size: 388 * MB,
    folder: 'unit-2',
    addedAt: sep(10),
  },
  {
    id: 'v3',
    name: 'lab-demo-pipetting.mp4',
    kind: 'video',
    width: 1920,
    height: 1080,
    duration: 540,
    size: 96 * MB,
    folder: 'unit-2',
    addedAt: sep(11),
  },
]

/** An education team's course shelf: slides, readings, lecture recordings and office-hours audio, picked for one week. */
export const CourseMaterials: Story = {
  name: 'Course materials',
  args: {
    assets: COURSE,
    folders: UNITS,
    defaultSelection: ['s1', 'v1'],
    max: 6,
    accept: 'application/pdf,video/*,audio/*',
    copy: {
      title: 'Add materials to Week 4',
      description: 'Introduction to Biology · pick up to six. They show in the order you pick them.',
      root: 'All materials',
      search: 'Search materials',
      filters: { all: 'All', image: 'Figures', video: 'Recordings', audio: 'Audio', document: 'Slides & readings' },
      kinds: { image: 'Figure', video: 'Recording', audio: 'Audio', document: 'Slides or reading' },
      insert: (count) => (count ? `Add ${count} to the week` : 'Add to the week'),
    },
  },
}

const svg = (body: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">${body}</svg>`)}`
const logo = (bg: string, mark: string) => svg(`<rect width="400" height="400" fill="${bg}"/>${mark}`)
const BRAND: MediaLibraryAsset[] = [
  {
    id: 'logo-dark',
    name: 'tidewater-logo-dark.svg',
    kind: 'image',
    preview: logo(
      '#f6f1e7',
      '<circle cx="200" cy="170" r="70" fill="#1f3b4d"/><path d="M110 250 Q155 220 200 250 T290 250" stroke="#1f3b4d" stroke-width="14" fill="none"/>',
    ),
    width: 400,
    height: 400,
    size: 12 * KB,
    folder: 'logos',
    alt: 'Tidewater Coffee mark in navy on cream.',
    addedAt: sep(22),
  },
  {
    id: 'logo-light',
    name: 'tidewater-logo-light.svg',
    kind: 'image',
    preview: logo(
      '#1f3b4d',
      '<circle cx="200" cy="170" r="70" fill="#f6f1e7"/><path d="M110 250 Q155 220 200 250 T290 250" stroke="#f6f1e7" stroke-width="14" fill="none"/>',
    ),
    width: 400,
    height: 400,
    size: 12 * KB,
    folder: 'logos',
    alt: 'Tidewater Coffee mark in cream on navy.',
    addedAt: sep(22),
  },
  {
    id: 'logo-amber',
    name: 'tidewater-logo-amber.svg',
    kind: 'image',
    preview: logo(
      '#d98e32',
      '<circle cx="200" cy="170" r="70" fill="#fff8ea"/><path d="M110 250 Q155 220 200 250 T290 250" stroke="#fff8ea" stroke-width="14" fill="none"/>',
    ),
    width: 400,
    height: 400,
    size: 12 * KB,
    folder: 'logos',
    alt: 'Tidewater Coffee mark in white on amber.',
    addedAt: sep(21),
  },
  { id: 'font-sans', name: 'tidewater-sans.otf', kind: 'document', size: 186 * KB, folder: 'fonts', addedAt: sep(18) },
  { id: 'font-serif', name: 'tidewater-serif.otf', kind: 'document', size: 212 * KB, folder: 'fonts', addedAt: sep(18, 9) },
  { id: 'guide', name: 'brand-guidelines-2026.pdf', kind: 'document', size: 5.4 * MB, addedAt: sep(15) },
  {
    id: 'sting',
    name: 'logo-sting-5s.mp4',
    kind: 'video',
    width: 1920,
    height: 1080,
    duration: 5,
    size: 7.8 * MB,
    folder: 'video',
    addedAt: sep(12),
  },
  {
    id: 'film',
    name: 'brand-film-90s.mp4',
    kind: 'video',
    width: 1920,
    height: 1080,
    duration: 90,
    size: 164 * MB,
    folder: 'video',
    addedAt: sep(10),
  },
]

/** A marketing team's brand kit: logo files, typefaces, guidelines and films, for a partner to download. */
export const BrandKit: Story = {
  name: 'Brand kit',
  args: {
    assets: BRAND,
    folders: [
      { id: 'logos', name: 'Logos' },
      { id: 'fonts', name: 'Typefaces' },
      { id: 'video', name: 'Film' },
    ],
    defaultSelection: ['logo-dark', 'logo-light'],
    max: Infinity,
    defaultView: 'grid',
    accept: 'image/svg+xml,.otf,.ttf,video/mp4,application/pdf',
    copy: {
      title: 'Tidewater Coffee brand kit',
      description: 'Everything a partner needs to use the brand. Pick what to include in the press pack.',
      root: 'Whole kit',
      search: 'Search the brand kit',
      filters: { all: 'All', image: 'Logos', video: 'Film', audio: 'Audio', document: 'Type & guides' },
      kinds: { image: 'Logo', video: 'Film', audio: 'Audio', document: 'Type or guide' },
      insert: (count) => (count ? `Add ${count} to the press pack` : 'Add to the press pack'),
    },
  },
}
