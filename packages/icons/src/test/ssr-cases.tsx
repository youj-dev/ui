import type { ReactElement } from 'react'
import { CheckIcon, LoaderRingIcon, MenuIcon } from '../index'

/* Rendered on a server by scripts/ssr-render.mjs and hydrated in jsdom by
 * ssr.test.tsx: icons whose markup differs under reduced motion. */
export const cases: Record<string, () => ReactElement> = {
  'Icon on mount': () => <CheckIcon trigger="mount" />,
  'Icon loop': () => <LoaderRingIcon trigger="loop" aria-label="Loading" />,
  'State icon': () => <MenuIcon active={false} />,
}
