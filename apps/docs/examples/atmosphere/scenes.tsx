'use client'

import { cinnabar, meadow, sandstone, ThemeScope, umber } from '@youj/core'
import { Atmosphere } from '@youj/motion/backgrounds'

const SCENES = [
  { scene: 'meadow', theme: meadow, line: 'A meadow under sky, panned so it streaks' },
  { scene: 'sandstone', theme: sandstone, line: 'Broad dunes lit from the top left, in suede' },
  { scene: 'cinnabar', theme: cinnabar, line: 'A dark ground glowing into English red' },
  { scene: 'umber', theme: umber, line: 'A dusk from a pale sky down to umber' },
] as const

export default function AtmosphereScenes() {
  return (
    <div className="grid w-full gap-2 sm:grid-cols-2">
      {SCENES.map(({ scene, theme, line }) => (
        <ThemeScope key={scene} theme={theme}>
          <figure className="relative isolate m-0 grid aspect-[16/10] place-items-center overflow-hidden rounded-lg">
            <Atmosphere scene={scene} />
            <figcaption className="max-w-[80%] rounded-lg border border-line bg-surface px-3.5 py-2.5 text-fg shadow-lg">
              <p className="text-ui-sm font-medium capitalize">{scene}</p>
              <p className="text-ui-xs text-fg-muted">{line}</p>
            </figcaption>
          </figure>
        </ThemeScope>
      ))}
    </div>
  )
}
