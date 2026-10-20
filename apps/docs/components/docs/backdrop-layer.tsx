'use client'

import type { CSSProperties } from 'react'
import { Atmosphere, type AtmosphereScene } from '@youj/motion/backgrounds'
import { atmosphereStill } from '@youj/motion/components/youj/backgrounds/atmosphere'
import { backdropById, type BackdropId } from '@/lib/backdrops'
import { cn } from '@/lib/cn'

/**
 * A backdrop (lib/backdrops) filling its positioned parent, in the site's light or dark. A scene is the motion
 * package's Atmosphere over its still (painted from the first frame, and all there is until `live`); a photograph
 * is the mode's file, with the same grain laid over it in CSS (styles/site.css `data-backdrop`). Decorative.
 */
export function BackdropLayer({ id, live = true, className }: { id: BackdropId; live?: boolean; className?: string }) {
  const backdrop = backdropById(id)
  const photo = backdrop.photo
  return (
    <div aria-hidden data-backdrop={id} className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {photo ? (
        <div data-backdrop-photo="" className="absolute inset-0" style={{ '--backdrop-light': `url(${photo.light.src})`, '--backdrop-dark': `url(${photo.dark.src})` } as CSSProperties} />
      ) : (
        <>
          <div data-backdrop-still="light" className="absolute inset-0" style={atmosphereStill(id as AtmosphereScene, 'light')} />
          <div data-backdrop-still="dark" className="absolute inset-0" style={atmosphereStill(id as AtmosphereScene, 'dark')} />
          {live && <Atmosphere scene={id as AtmosphereScene} className="bg-transparent" />}
        </>
      )}
    </div>
  )
}
