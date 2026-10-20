'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { useInView } from 'motion/react'
import { useYouj } from '@youj/core'
import { CardFrame, ELEMENT_SIZE } from '@/components/landing/hero-card'
import { HeroElementLater } from '@/components/landing/hero-element-later'
import { HERO_PIN_QUERY } from '@/components/landing/hero-score'
import type { MenuWave, PillarId } from '@/lib/nav'

/**
 * A family tile's element where the hero isn't pinned (phones, short screens, reduced motion): the same element the
 * card shows, drawn in the tile once it nears the screen. Pinned, the card's own element travels here, so this draws
 * nothing and the page holds one set. The server draws nothing either: the tile keeps its room, and the hero's load
 * carries no second set. Blocks is the card's frame, scaled to the tile.
 */
export function TileElement({ id, waves }: { id: PillarId; waves: MenuWave[] }) {
  const k = useYouj()
  const box = useRef<HTMLDivElement>(null)
  const near = useInView(box, { once: true, margin: '300px 0px' })
  const [pinned, setPinned] = useState(true)
  useLayoutEffect(() => {
    const media = window.matchMedia(HERO_PIN_QUERY)
    const update = () => setPinned(media.matches && !k.reduced)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [k.reduced])
  // The frame is a whole card: scaled to fit the tile, as a page's layout.
  const [fit, setFit] = useState(0.35)
  useLayoutEffect(() => {
    const el = box.current
    if (id !== 'blocks' || !el) return
    const observer = new ResizeObserver(() => setFit(Math.min((el.clientWidth * 0.9) / 720, (el.clientHeight * 0.9) / 340)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [id])
  const size = ELEMENT_SIZE[id]
  return (
    <div ref={box} className="absolute inset-0 grid place-items-center">
      {!pinned &&
        near &&
        (id === 'blocks' ? (
          <div className="shrink-0" style={{ width: size.w * fit, height: size.h * fit }}>
            <div className="ho-tile-frame origin-top-left" style={{ width: size.w, height: size.h, scale: fit }}>
              <CardFrame />
            </div>
          </div>
        ) : (
          <div className="shrink-0" style={{ width: size.w, height: size.h }}>
            <HeroElementLater id={id} waves={waves} />
          </div>
        ))}
    </div>
  )
}
