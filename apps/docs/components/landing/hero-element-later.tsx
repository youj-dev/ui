'use client'

import { deferHydration } from '@/components/ui/defer-hydration'

/**
 * One of the hero's elements, hydrated once the page is idle. The server draws it in full, so the card is finished from
 * the first paint; its code (the components, the scene, the presets, Banyan's loader) is fetched after the page has
 * loaded. Mounted with no server markup (a tile's own, off the pinned stage), it loads straight away.
 */
export const HeroElementLater = deferHydration(() => import('@/components/landing/hero-elements').then((m) => m.HeroElement), { idle: true })
