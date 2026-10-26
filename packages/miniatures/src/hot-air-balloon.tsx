import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureProgressHandle, MiniatureKeyOf, MiniatureProgressProps } from './engine/types'
import { figure } from './figures/hot-air-balloon'
import { hotAirBalloon } from './meta/hot-air-balloon'

export { hotAirBalloon }
export type MiniatureHotAirBalloonKey = MiniatureKeyOf<typeof hotAirBalloon>
export type MiniatureHotAirBalloonHandle = MiniatureProgressHandle<MiniatureHotAirBalloonKey>
export interface MiniatureHotAirBalloonProps extends MiniatureProgressProps {
  ref?: Ref<MiniatureHotAirBalloonHandle>
}

/**
 * CIRREL Q–31, hot air balloon. A hot air balloon tethered over a small turf landing patch: striped gores under a parachute valve, a scoop skirt, load cables down to the burners on flexi poles, and a wicker basket with sandbags, with a windsock on the patch and clouds drifting past. Hold Space or press and hold the balloon to fire the burner: the flame roars, the envelope glows from inside and the balloon rises toward the top of its tether. Let go and it cools and slowly sinks, the basket swaying, until it lands. The arrow keys turn the wind and the balloon drifts with it, and the vent spills hot air to bring it down. Left alone, the pilot holds a hover. As a progress indicator the altitude follows the progress, and on completion it climbs to the top of the tether.
 *
 * Keys: Space hold to fire the burner · ← → wind · ↓ vent · P progress +25% · Enter done.
 */
export function MiniatureHotAirBalloon(props: MiniatureHotAirBalloonProps) {
  return <Miniature {...props} meta={hotAirBalloon} figure={figure} />
}
