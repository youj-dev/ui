import { createIcon } from './icon-base'

/**
 * Indeterminate spinner: a constant-rate turn with an arc that breathes on a
 * different period, so the motion never visibly repeats. Loops by default.
 * Static fallback: a quarter arc on a faint track.
 */
export const LoaderRingIcon = createIcon({
  name: 'loader-ring',
  category: 'status',
  keywords: ['spinner', 'loading', 'progress', 'busy', 'pending', 'wait'],
  defaultTrigger: 'loop',
  loop: 'continuous',
  // The loop is CSS (motion's youj.css, `[data-icon='loader-ring']`): the svg turns and the arc breathes on the
  // compositor's schedule, not a script's, so it costs no layout per frame. The icon only says when it is active.
  variants: () => ({}),
  render: () => (
    <>
      <circle cx="12" cy="12" r="9" opacity={0.2} />
      <path d="M12 3 A9 9 0 1 1 12 21 A9 9 0 1 1 12 3" pathLength={1} />
    </>
  ),
})
