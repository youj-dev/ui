import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { cn } from '../../lib/utils'
import { productById, Swatches } from './product-card'
import { ProductRender } from './product-render'

const meta: Meta<typeof ProductRender> = {
  title: 'Blocks/Commerce/Product render',
  component: ProductRender,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Show your product photos as one studio shoot: catalogue tiles and hero images that keep the product in frame at any aspect, fade up when loaded, crossfade between colorways and close in on a detail.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ProductRender>

const P = '/blocks/products'

interface Tile {
  src: string
  name: string
  note: string
  focus?: [number, number]
  /** A tile that fills the room its row gives it (the hero, the wide shot) rather than standing 4:5. */
  fill?: boolean
}

const HERO: Tile = { src: `${P}/kettle-sage.webp`, name: 'Ridge Kettle', note: 'Sage enamel', focus: [52, 58], fill: true }
const BESIDE: Tile[] = [
  { src: `${P}/tea-set.webp`, name: 'Ritual Tea Set', note: 'Oat glaze, walnut tray', focus: [48, 60] },
  { src: `${P}/kettle-cream.webp`, name: 'Hearth Kettle', note: 'Cream', focus: [46, 62] },
  { src: `${P}/kettle-rose-side.webp`, name: 'Ridge Kettle', note: 'Rose, from the side', focus: [55, 58] },
  { src: `${P}/mug.webp`, name: 'Daily Mug', note: 'Porcelain', focus: [50, 55] },
]
const BELOW: Tile[] = [
  { src: `${P}/bud-vases.webp`, name: 'Bud Vases', note: 'Set of three, unglazed', focus: [50, 62], fill: true },
  { src: `${P}/kettle-sky.webp`, name: 'Ridge Kettle', note: 'Sky enamel', focus: [52, 58] },
  { src: `${P}/kettle-cream-side.webp`, name: 'Hearth Kettle', note: 'Cream, from the side', focus: [50, 62] },
]

/** A tile of the lookbook: hover closes in on the product. */
function LookTile({ tile, priority, className }: { tile: Tile; priority?: boolean; className?: string }) {
  const [near, setNear] = useState(false)
  return (
    <figure className={cn('flex min-h-0 flex-col gap-2', className)}>
      <div
        className={cn('relative overflow-hidden rounded-xl', tile.fill ? 'min-h-0 flex-1' : 'aspect-[4/5]')}
        // A filling tile still has a floor, for when it stands alone in a narrow column.
        style={tile.fill ? { minHeight: '16rem' } : undefined}
        onPointerEnter={() => setNear(true)}
        onPointerLeave={() => setNear(false)}
      >
        <ProductRender src={tile.src} focus={tile.focus} view={near ? 'detail' : 'front'} priority={priority} sizes="(min-width: 64rem) 36rem, 50vw" className="absolute inset-0" />
      </div>
      <figcaption className="flex items-baseline justify-between gap-3 px-0.5 text-ui-sm">
        <span className="truncate font-medium text-fg">{tile.name}</span>
        <span className="truncate text-fg-muted">{tile.note}</span>
      </figcaption>
    </figure>
  )
}

/** A lookbook: the hero shot beside four tiles, then a wide shot and two more; each closes in on its product on hover. */
export const Catalogue: Story = {
  render: () => (
    <div className="min-h-dvh bg-canvas p-4 sm:p-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2">
          <LookTile tile={HERO} priority />
          <div className="grid grid-cols-2 gap-x-4 gap-y-6">
            {BESIDE.map((tile) => (
              <LookTile key={tile.src} tile={tile} />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
          {BELOW.map((tile) => (
            <LookTile key={tile.src} tile={tile} className={tile.fill ? 'col-span-2' : undefined} />
          ))}
        </div>
      </div>
    </div>
  ),
}

/** A colorway's own photo crossfades over the one shown: the old one stays until the new one is ready. */
export const Colorways: Story = {
  render: function Render() {
    const kettle = productById('ridge-kettle')
    const [color, setColor] = useState(kettle.colors[0]!.id)
    const way = kettle.colors.find((c) => c.id === color)!
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas p-6">
        <figure className="flex w-full max-w-md flex-col gap-3">
          <div className="relative aspect-square overflow-hidden rounded-xl">
            <ProductRender src={way.image ?? kettle.image!} label={`${kettle.name} in ${way.name}`} priority className="absolute inset-0" />
          </div>
          <figcaption className="flex items-center justify-between gap-3 text-ui">
            <span className="font-medium text-fg">
              {kettle.name} <span className="text-fg-muted">· {way.name}</span>
            </span>
            <Swatches product={kettle} value={color} onValueChange={setColor} size="lg" />
          </figcaption>
        </figure>
      </div>
    )
  },
}

/** One photo in any box: a portrait tile, a square, a wide banner and the detail close-up keep the product in frame; `contain` shows all of it. */
export const Framing: Story = {
  render: () => (
    <div className="min-h-dvh bg-canvas p-4 sm:p-8">
      <div className="mx-auto grid max-w-5xl grid-cols-2 items-start gap-4 sm:grid-cols-4">
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl">
          <ProductRender src={`${P}/bud-vases.webp`} focus={[50, 62]} className="absolute inset-0" />
        </div>
        <div className="relative aspect-square overflow-hidden rounded-xl">
          <ProductRender src={`${P}/bud-vases.webp`} focus={[50, 62]} view="detail" className="absolute inset-0" />
        </div>
        <div className="relative col-span-2 aspect-[16/9] overflow-hidden rounded-xl">
          <ProductRender src={`${P}/kettle-sage.webp`} focus={[52, 58]} className="absolute inset-0" />
        </div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl">
          <ProductRender src={`${P}/bud-vases.webp`} fit="contain" className="absolute inset-0" />
        </div>
        <div className="relative aspect-square overflow-hidden rounded-xl">
          <ProductRender src="/blocks/products/missing.webp" label="A photo that didn’t load" className="absolute inset-0" />
        </div>
      </div>
    </div>
  ),
}
