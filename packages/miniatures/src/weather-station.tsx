import { type Ref, useCallback, useEffect, useRef } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/weather-station'
import { weatherStation } from './meta/weather-station'

export { weatherStation }
export type MiniatureWeatherStationKey = MiniatureKeyOf<typeof weatherStation>
export type MiniatureWeatherStationHandle = MiniatureHandle<MiniatureWeatherStationKey>
export interface MiniatureWeatherStationProps extends MiniatureProps {
  /** The wind in km/h, 0 to 40 in steps of 2 (it starts at 8). Leave it out to let the keys and clicks set it. */
  wind?: number
  ref?: Ref<MiniatureWeatherStationHandle>
}

/**
 * AEREN F–04, weather station. A solar panel, three rotating wind cups, directional vane, graduated rain collector and seven-segment display on a bolted mast. Adjust wind, make rain, drain the collector or switch day and night.
 *
 * Keys: W wind + · ⇧ W wind − · R rain · ⇧ R drain · D day / night.
 */
export function MiniatureWeatherStation({ wind, ref, ...props }: MiniatureWeatherStationProps) {
  const inner = useRef<MiniatureWeatherStationHandle | null>(null)
  const join = useCallback(
    (handle: MiniatureWeatherStationHandle | null) => {
      inner.current = handle
      if (typeof ref === 'function') ref(handle)
      else if (ref) ref.current = handle
    },
    [ref],
  )
  useEffect(() => {
    if (wind !== undefined) (inner.current as unknown as { setProgress(p: number): void } | null)?.setProgress(wind / 40)
  }, [wind])
  return <Miniature {...props} ref={join} meta={weatherStation} figure={figure} />
}
