'use client'

import { ImageAccordion, type ImageAccordionItem } from '@youj/react'

/** Demo photos served by the Youj site; pass your own `src`. */
const PHOTOS = 'https://www.youj.dev/blocks/products'

const PANELS: ImageAccordionItem[] = [
  {
    id: 'ridge',
    media: { src: `${PHOTOS}/kettle-sage.webp`, alt: 'A sage green enamel kettle' },
    title: 'Ridge Kettle',
    description: 'Enamelled steel, for every hob',
  },
  {
    id: 'ritual',
    media: { src: `${PHOTOS}/tea-set.webp`, alt: 'A kettle, a caddy and three cups on a walnut tray' },
    title: 'Ritual Tea Set',
    description: 'Glazed in small batches',
  },
  {
    id: 'vases',
    media: { src: `${PHOTOS}/bud-vases.webp`, alt: 'Three white bud vases in a row' },
    title: 'Bud Vases',
    description: 'Unglazed stoneware, thrown by hand',
  },
  {
    id: 'hearth',
    media: { src: `${PHOTOS}/kettle-cream.webp`, alt: 'A cream stovetop kettle with a walnut grip' },
    title: 'Hearth Kettle',
    description: 'A whistler with a grip that stays cool',
  },
  {
    id: 'mug',
    media: { src: `${PHOTOS}/mug.webp`, alt: 'A white porcelain mug' },
    title: 'Daily Mug',
    description: 'Porcelain that keeps coffee hot',
  },
  {
    id: 'sky',
    media: { src: `${PHOTOS}/kettle-sky.webp`, alt: 'A sky blue enamel kettle' },
    title: 'Ridge Kettle in Sky',
    description: 'The same kettle, in a pale blue',
  },
]

export default function ImageAccordionDemo() {
  return (
    <div className="w-full max-w-3xl">
      <ImageAccordion items={PANELS} />
    </div>
  )
}
