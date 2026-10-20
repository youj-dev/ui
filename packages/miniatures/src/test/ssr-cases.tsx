import type { ReactElement } from 'react'
import { MiniatureHourglass } from '../hourglass'
import { MiniatureServerCabinet } from '../server-cabinet'
import { MiniatureTurntable } from '../turntable'

/* Rendered on a server by scripts/ssr-render.mjs (a Node process with no DOM)
 * and hydrated in jsdom by ssr.test.tsx: each miniature, and the props that
 * change its server markup. */
export const cases: Record<string, () => ReactElement> = {
  Turntable: () => <MiniatureTurntable />,
  'Turntable, sized and dark': () => <MiniatureTurntable size={320} mode="dark" stage />,
  'Server cabinet, still': () => <MiniatureServerCabinet interactive={false} />,
  'Hourglass with progress': () => <MiniatureHourglass progress={0.3} keyboard="global" />,
}
