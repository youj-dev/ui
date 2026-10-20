import { useCallback, useState } from 'react'

/**
 * State that is controlled when `value` is defined and the component's own
 * otherwise. The setter only writes the internal copy when uncontrolled; the
 * caller reports the change (onValueChange) itself, with whatever extra
 * arguments it has. `null` is a controlled empty value; `undefined` means
 * uncontrolled.
 */
export function useControllableState<T>(value: T | undefined, defaultValue: T): [T, (next: T) => void] {
  const [inner, setInner] = useState(defaultValue)
  const controlled = value !== undefined
  const set = useCallback(
    (next: T) => {
      if (!controlled) setInner(next)
    },
    [controlled],
  )
  return [controlled ? value : inner, set]
}
