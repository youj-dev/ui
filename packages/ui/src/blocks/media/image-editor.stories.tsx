import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { ImageEditor } from './image-editor'

const meta: Meta<typeof ImageEditor> = {
  title: 'Blocks/Media/Image editor',
  component: ImageEditor,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'An image field that shows exactly how the picture will look everywhere it appears: move, zoom, turn, straighten and flip it under a fixed frame, mark its focal point, and watch live previews of every size it’s shown at. Save hands over the framed file with its region and focal point for a CDN.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ImageEditor>

export const Default: Story = {}

/** A 3:1 header: wide screens show it all, narrower ones crop it around the focal point. */
export const Cover: Story = { args: { variant: 'cover' } }

/** A round profile photo, previewed at the sizes it’s shown. */
export const Avatar: Story = { args: { variant: 'avatar' } }

/** Nothing chosen yet: drop, paste or browse. */
export const Empty: Story = { args: { src: null } }

/** Its own page: a centered canvas and an `h1`. */
export const Standalone: Story = { args: { embedded: false } }

/** Your photo and saved framing, your crops and places it appears, saved through your API. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    src: '/blocks/products/kettle-sage.webp',
    defaultEdit: {
      aspect: 'card',
      zoom: 1.2,
      center: { x: 0.5, y: 0.52 },
      focal: { x: 0.47, y: 0.55 },
      alt: 'A sage enamel kettle with a black handle.',
    },
    aspects: [
      { id: 'card', label: 'Card', ratio: 4 / 5 },
      { id: 'hero', label: 'Hero', ratio: 21 / 9 },
    ],
    previews: [
      { id: 'grid', label: 'Shop grid', ratio: 4 / 5, size: 80 },
      { id: 'cart', label: 'Cart', ratio: 1, size: 48 },
      { id: 'og', label: 'Link preview', ratio: 1.91, size: 56 },
    ],
    outputType: 'image/webp',
    copy: { title: 'Product photo', description: 'The shop grid, cart and link previews all crop around the focal point.' },
    onSave: fn(),
    onEditChange: fn(),
    onRemove: fn(),
    onFileChange: fn(),
  },
}

const house =
  '<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="1350" viewBox="0 0 2400 1350">' +
  '<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ec5e6"/><stop offset="1" stop-color="#e8f1f8"/></linearGradient></defs>' +
  '<rect width="2400" height="1350" fill="url(#s)"/>' +
  '<rect y="980" width="2400" height="370" fill="#8fb27c"/>' +
  '<path d="M0 1010 Q 600 960 1200 1000 T 2400 990 V1050 H0 Z" fill="#7da56a"/>' +
  '<rect x="700" y="520" width="1000" height="520" fill="#f2e6d2"/>' +
  '<path d="M640 540 L1200 220 L1760 540 Z" fill="#6f4e3a"/>' +
  '<rect x="1090" y="760" width="220" height="280" fill="#3d5a73"/>' +
  '<circle cx="1280" cy="910" r="10" fill="#e6c36a"/>' +
  '<rect x="800" y="680" width="200" height="180" fill="#bcd9ee" stroke="#ffffff" stroke-width="12"/>' +
  '<rect x="1400" y="680" width="200" height="180" fill="#bcd9ee" stroke="#ffffff" stroke-width="12"/>' +
  '<rect x="1130" y="1040" width="140" height="310" fill="#d8cdb8"/>' +
  '</svg>'

/** A listing photo for a real estate site: a wide 3:1 cover crop plus the 16:9 and 2:1 crops portals ask for, with the places it shows. */
export const RealEstateListingPhoto: Story = {
  name: 'Real estate listing photo',
  args: {
    variant: 'cover',
    src: `data:image/svg+xml,${encodeURIComponent(house)}`,
    aspects: [
      { id: 'cover', label: '3:1', ratio: 3 },
      { id: 'wide', label: '16:9', ratio: 16 / 9 },
      { id: 'panorama', label: '2:1', ratio: 2 },
    ],
    previews: [
      { id: 'search', label: 'Search results', ratio: 3 / 2, size: 56 },
      { id: 'hero', label: 'Listing header', ratio: 3, size: 48 },
      { id: 'alert', label: 'Email alert', ratio: 16 / 9, size: 52 },
    ],
    defaultEdit: {
      aspect: 'wide',
      center: { x: 0.5, y: 0.5 },
      focal: { x: 0.5, y: 0.55 },
      alt: 'A two-story cream house with a brown roof, blue front door and a lawn.',
    },
    minDimensions: { width: 1600, height: 900 },
    maxOutput: 2400,
    outputType: 'image/webp',
    copy: {
      coverTitle: 'Listing photo',
      coverDescription: 'Search results, the listing header and email alerts crop it around the focal point.',
    },
  },
}
