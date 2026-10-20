import type { ReactElement } from 'react'
import { IllustrationDatabase, IsoBox, IsoScene } from '../index'

/* Rendered on a server by scripts/ssr-render.mjs and hydrated in jsdom by
 * ssr.test.tsx: scenes whose markup differs under reduced motion. */
export const cases: Record<string, () => ReactElement> = {
  'IsoScene with floating shapes': () => (
    <IsoScene>
      <IsoBox x={0} y={0} z={0} w={2} d={2} h={1} float lift={1} />
      <IsoBox x={3} y={0} z={0} w={1} d={1} h={1} float={0.16} />
    </IsoScene>
  ),
  'A ready-made scene': () => <IllustrationDatabase />,
}
