'use client'

import { deferHydration } from '@/components/ui/defer-hydration'

/**
 * The Start section's two stacks, hydrated when they near the screen. The
 * server draws them in full (piled, as they wait to open), so the section is
 * finished from the first paint; their code is fetched only once they're
 * close, and they open when they're in view, as before. They sit at the foot
 * of the homepage, so none of it is part of the page's load. The third way
 * in, a whole page, shows the family's app frame, drawn only once it's here
 * (the family's tile has already drawn it in full).
 */
export const KitStack = deferHydration(() => import('@/components/landing/start-stack').then((m) => m.KitStack), { view: true })
export const PiecePath = deferHydration(() => import('@/components/landing/start-stack').then((m) => m.PiecePath), { view: true })
export const BlocksFrame = deferHydration(() => import('@/components/landing/blocks-frame').then((m) => m.BlocksFrameLater), { view: true })
