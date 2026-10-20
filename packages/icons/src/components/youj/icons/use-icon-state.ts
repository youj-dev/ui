import { useCallback, useState } from 'react'

interface StateOptions {
  /** Controlled state. */
  active?: boolean
  defaultActive?: boolean
  onActiveChange?: (active: boolean) => void
}

/**
 * A pressed toggle (bookmark, like, mute): one fixed name, and the state is
 * announced through aria-pressed. The name must not change with the state.
 */
interface PressedOptions extends StateOptions {
  label: string
  labels?: never
}

/**
 * An action that flips (play ↔ pause, show ↔ hide password): the name says
 * what the button will do next, so it changes and aria-pressed is omitted.
 */
interface ActionOptions extends StateOptions {
  /** Names for [inactive, active], e.g. ['Play', 'Pause']. */
  labels: readonly [string, string]
  label?: never
}

export type UseIconStateOptions = PressedOptions | ActionOptions

export interface IconStateButtonProps {
  type: 'button'
  onClick: () => void
  'aria-label': string
  'aria-pressed'?: boolean
}

export interface IconState {
  active: boolean
  toggle: () => void
  setActive: (active: boolean) => void
  /** Spread onto a native <button>. */
  buttonProps: IconStateButtonProps
  /** Spread onto an IconSwap or a state icon. */
  iconProps: { active: boolean }
}

/**
 * Turns an IconSwap or a state icon into an accessible toggle button:
 *
 *   const bookmark = useIconState({ label: 'Bookmark' })
 *   <button {...bookmark.buttonProps}><IconSwap {...bookmark.iconProps} from={Bookmark} to={BookmarkCheck} /></button>
 *
 * Pass `label` for a pressed toggle (aria-pressed, fixed name) or `labels`
 * for an action whose name follows the state (no aria-pressed).
 */
export function useIconState(options: UseIconStateOptions): IconState {
  const { active: controlled, defaultActive = false, onActiveChange } = options
  const [inner, setInner] = useState(defaultActive)
  const active = controlled ?? inner

  const setActive = useCallback(
    (next: boolean) => {
      if (controlled === undefined) setInner(next)
      onActiveChange?.(next)
    },
    [controlled, onActiveChange],
  )
  const toggle = useCallback(() => setActive(!active), [setActive, active])

  const buttonProps: IconStateButtonProps = options.labels
    ? { type: 'button', onClick: toggle, 'aria-label': options.labels[active ? 1 : 0] }
    : { type: 'button', onClick: toggle, 'aria-label': options.label, 'aria-pressed': active }

  return { active, toggle, setActive, buttonProps, iconProps: { active } }
}
