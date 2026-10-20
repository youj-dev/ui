'use client'

import { deferHydration } from '@/components/ui/defer-hydration'

/**
 * A homepage loop, hydrated when it nears the screen. The server draws its
 * poster (both schemes', picked by CSS), which is all it shows until the
 * page is idle and it's near anyway, so its code waits for that too and
 * isn't part of the page's load.
 */
export const LoopVideo = deferHydration(() => import('@/components/landing/loop-video').then((m) => m.LoopVideo), { view: true })
