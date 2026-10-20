'use client'

import { useState, type ComponentProps, type ReactNode } from 'react'
import { useYouj } from '@youj/core'
import { ImageIcon } from '@youj/icons'
import { cn } from '../../lib/utils'

/* A studio shot: one product photo as a catalogue or hero image, framed the same way wherever it sits, so a shop's
 * photos read as one shoot. It fills its box (give the box the aspect you want) on the theme's band, and crops
 * around `focus`, the point the product sits at, so a portrait tile, a square thumb and a wide hero all keep the
 * product in frame.
 *
 * - The photo fades up once it has loaded, never popping in half-drawn; the band holds its place until then.
 * - Change `src` (a colorway, another angle) and the new photo crossfades over the old one, which stays put until
 *   the new one is ready, so a swatch never flashes the box empty. Rapid changes keep the last photo that loaded.
 * - `view="detail"` closes in on `focus`, easing on the slow token; `fit="contain"` shows the whole photo instead.
 * - A photo that fails to load shows `fallback` (default: a quiet image mark), so a broken URL never breaks the grid.
 * - Decorative by default (the product's name sits beside it); pass `label` when the photo is the only thing naming it.
 * - Reduced motion: the fade, the crossfade and the close-up happen at once.
 */

/** Which side of a product a picture shows: `angle` is its other side, `detail` a close-up. */
type RenderView = 'front' | 'angle' | 'detail'

interface ProductRenderProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** The photo's URL. */
  src: string
  /** Responsive sources for the photo, as `<img srcSet>`. */
  srcSet?: string
  /** How wide the photo shows, as `<img sizes>`. */
  sizes?: string
  /** Where the product sits in the photo, in percent from the top start: the crop keeps it, `detail` closes in on it. Default `[50, 50]`. */
  focus?: readonly [number, number]
  /** `front` shows the photo; `detail` closes in on `focus`. Default `front`. */
  view?: Exclude<RenderView, 'angle'>
  /** `cover` fills the box and crops; `contain` shows the whole photo on the band. Default `cover`. */
  fit?: 'cover' | 'contain'
  /** Load it straight away (a hero above the fold) rather than when it nears the viewport. Default false. */
  priority?: boolean
  /** Names the photo for assistive technology; without it the photo is decorative. */
  label?: string
  /** Shown when the photo can't load. Default: a quiet image mark on the band. */
  fallback?: ReactNode
}

interface Photo {
  src: string
  srcSet?: string
}

function ProductRender({ src, srcSet, sizes, focus = [50, 50], view = 'front', fit = 'cover', priority = false, label, fallback, className, ...rest }: ProductRenderProps) {
  const k = useYouj()
  const [shown, setShown] = useState<Photo>({ src, srcSet })
  // The photo the shown one fades in over: the last that loaded, kept until the new one is ready.
  const [under, setUnder] = useState<Photo>()
  const [loaded, setLoaded] = useState<string>()
  const [failed, setFailed] = useState<string>()
  if (src !== shown.src) {
    setUnder(loaded === shown.src ? shown : under)
    setShown({ src, srcSet })
  }
  const ready = loaded === shown.src
  const broken = failed === shown.src
  // With no fade to wait for, the old photo goes as soon as the new one is ready.
  if (under && ready && k.reduced) setUnder(undefined)
  const [fx, fy] = focus
  const position = `${fx}% ${fy}%`
  const photo = cn('absolute inset-0 size-full', fit === 'cover' ? 'object-cover' : 'object-contain')

  return (
    <div
      data-slot="product-render"
      data-state={broken ? 'error' : ready ? 'loaded' : 'loading'}
      data-yj-view={view}
      data-reduced-motion={k.reduced || undefined}
      className={cn('relative block size-full overflow-hidden bg-band select-none', className)}
      {...rest}
    >
      {broken ? (
        (fallback ?? (
          <div role={label ? 'img' : undefined} aria-label={label} className="grid size-full place-items-center text-fg-subtle">
            <ImageIcon size={20} aria-hidden />
          </div>
        ))
      ) : (
        <div
          className="absolute inset-0 transition-[scale] yj-duration-slow ease-standard reduced:transition-none"
          style={{ transformOrigin: position, scale: view === 'detail' ? 1.8 : 1 }}
        >
          {under && under.src !== shown.src && (
            // eslint-disable-next-line @next/next/no-img-element -- copy-in blocks run in Vite too
            <img src={under.src} srcSet={under.srcSet} sizes={sizes} alt="" aria-hidden draggable={false} className={photo} style={{ objectPosition: position }} />
          )}
          {/* eslint-disable-next-line @next/next/no-img-element -- copy-in blocks run in Vite too */}
          <img
            key={shown.src}
            // A photo the browser already holds can finish before React listens for it.
            ref={(img) => {
              if (img?.complete && img.naturalWidth > 0) setLoaded(shown.src)
            }}
            src={shown.src}
            srcSet={shown.srcSet}
            sizes={sizes}
            alt={label ?? ''}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : undefined}
            decoding="async"
            draggable={false}
            onLoad={() => setLoaded(shown.src)}
            onError={() => setFailed(shown.src)}
            onTransitionEnd={() => ready && setUnder(undefined)}
            className={cn(photo, 'transition-opacity yj-duration-slow ease-standard reduced:transition-none', ready ? 'opacity-100' : 'opacity-0')}
            style={{ objectPosition: position }}
          />
        </div>
      )}
    </div>
  )
}

export { ProductRender }
export type { ProductRenderProps }
export type { RenderView }
