import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** One thing a showroom shows: in the viewfinder's row, the explorer's grid and (by its id) the address. */
export interface ShowroomItem {
  id: string
  /** Its name: the thumbnail's tooltip and accessible name, the card's title. */
  label: string
  /** Its picture in the site's light and dark, each null until there is one. */
  thumbs?: Record<'light' | 'dark', string | null>
  /** Draws its picture itself instead (a drawing in the page's own theme, not a shot): `square` in a strip, 4:3 in a card. */
  draw?: (square: boolean) => ReactNode
}

/** True when the item has a picture: one it draws, or a shot in either scheme. */
export const hasThumb = (item: ShowroomItem) => Boolean(item.draw || item.thumbs?.light || item.thumbs?.dark)

/** The item's picture in light and dark (each falling back on the other), one shown per scheme; or the one it draws. */
export function Thumbs({ item, eager, square = false }: { item: ShowroomItem; eager: boolean; square?: boolean }) {
  if (item.draw) return item.draw(square)
  const { light, dark } = item.thumbs ?? { light: null, dark: null }
  return (
    <>
      <Thumb src={(light ?? dark)!} eager={eager} square={square} className="dark:hidden" />
      <Thumb src={(dark ?? light)!} eager={eager} square={square} className="hidden dark:block" />
    </>
  )
}

/** One scheme's thumbnail; the other's, hidden, isn't fetched while it's lazy. */
function Thumb({ src, eager, square, className }: { src: string; eager: boolean; square: boolean; className: string }) {
  return (
    // A plain img: dev-only pages' local thumbnails
    <img
      src={src}
      alt=""
      width={600}
      height={450}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      className={cn(
        'size-full object-cover',
        // A strip's square crops the 4:3 shot to its middle, a little closer in, where the item sits.
        square ? 'scale-[1.2]' : 'transition-transform duration-(--yj-duration-slow) ease-standard group-hover/card:scale-[1.03] motion-reduce:transition-none',
        className,
      )}
    />
  )
}
