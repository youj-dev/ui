'use client'

import { lazy, Suspense, useEffect, useState, type ComponentType, type LazyExoticComponent } from 'react'
import type { LoaderProps } from '@youj/loaders'

/* A menu's feature art: one of the Youj animations, live, in the site's own
 * light or dark, on the stage the gallery's cards stand on. Each is a chunk
 * of its own (the animation and the kit it's drawn with), fetched as its
 * menu is about to open, so no page carries animation code until a menu
 * opens; the panel mounts only while its menu is open, and one closing holds
 * its frame. Under reduced motion it's the animation's still frame. It's a
 * picture: the card's link names the feature. The dev panel's Loader color
 * puts the loaders in the theme's colors (data-loader-color="theme" on
 * <html>), read as a menu opens, to compare them in the real menu; they're
 * in their two colors alone by default. */

const LOADERS = {
  // Docs, "Install Youj": a terminal types one command and checks it off.
  prompt: () => import('@youj/loaders/prompt').then((m) => ({ default: m.LoaderPrompt })),
  // Components, "Every state designed": a focus ring tabs through a form's fields, its checkbox and its button.
  tabstop: () => import('@youj/loaders/tabstop').then((m) => ({ default: m.LoaderTabstop })),
  // Blocks, its kinds' card: tiles settle into a layout.
  mosaic: () => import('@youj/loaders/mosaic').then((m) => ({ default: m.LoaderMosaic })),
  // Build, Create, "Create your own": a gantry carries a part across the frame and sets it in place.
  gantry: () => import('@youj/loaders/gantry').then((m) => ({ default: m.LoaderGantry })),
  // Explore, "Every icon, searchable": a drafting sheet draws in.
  draft: () => import('@youj/loaders/draft').then((m) => ({ default: m.LoaderDraft })),
  // Visuals, "Miniatures": the record player, spinning, still to the pointer (a picture, not the toy).
  turntable: () =>
    import('@youj/miniatures/turntable').then((m) => ({
      default: ({ size, paused, className }: LoaderProps) => <m.MiniatureTurntable size={size} autoPlay={!paused} interactive={false} aria-hidden className={className} />,
    })),
  // The Visuals menu's rows, each a real one of its kind: an icon looping, a scene, a loader.
  // Icons: a sun morphs into a moon and back, a true path morph between two icons (IconSwap's `morph`).
  'row-icon': () =>
    Promise.all([
      import('@youj/icons/components/youj/icons/icon-swap'),
      import('@youj/icons/components/youj/icons/sun'),
      import('@youj/icons/components/youj/icons/moon'),
    ]).then(([{ IconSwap }, { SunIcon }, { MoonIcon }]) => ({
      default: function IconMorph({ size, paused, className }: LoaderProps) {
        const [night, setNight] = useState(false)
        useEffect(() => {
          if (paused) return
          const flip = setInterval(() => setNight((n) => !n), 1800)
          return () => clearInterval(flip)
        }, [paused])
        return <IconSwap from={SunIcon} to={MoonIcon} active={night} transition="morph" size={Number(size) * 0.6} strokeWidth={1.5} aria-hidden className={className} />
      },
    })),
  'row-scene': () =>
    import('@youj/illustrations/components/youj/graphics/illustrations/scenes/backups').then((m) => ({
      // Lifted a touch: the scene's base sits low in its box, and the card's plate would clip it.
      default: ({ size, paused, className }: LoaderProps) => <m.IllustrationBackups unit={Number(size) / 13} float={!paused} aria-hidden className={`${className ?? ''} -translate-y-1`} />,
    })),
} satisfies Record<string, () => Promise<{ default: ComponentType<LoaderProps> }>>

export type FeatureArtId = keyof typeof LOADERS

/** Every animation a menu's feature can show. */
export const FEATURE_ART = Object.keys(LOADERS) as FeatureArtId[]

const art = {} as Record<FeatureArtId, LazyExoticComponent<ComponentType<LoaderProps>>>
for (const id of FEATURE_ART) art[id] = lazy(LOADERS[id])

/** Starts fetching an animation as its menu is pointed at or focused, so it's in by the time the panel opens. */
export function prefetchArt(id: FeatureArtId) {
  LOADERS[id]().catch(() => {})
}

/** The animation `size` px tall, decorative, fading in as it arrives, holding its frame while `paused`. */
export function FeatureArt({ id, size, paused }: { id: FeatureArtId; size: number; paused: boolean }) {
  const Animation = art[id]
  const themed = typeof document !== 'undefined' && document.documentElement.dataset.loaderColor === 'theme'
  return (
    <Suspense fallback={null}>
      <Animation size={size} paused={paused} label={null} colors={themed ? 'theme' : undefined} className="relative transition-opacity yj-duration-base ease-enter starting:opacity-0" />
    </Suspense>
  )
}
