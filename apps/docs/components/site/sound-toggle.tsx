'use client'

import { useSyncExternalStore } from 'react'
import { VolumeIcon } from '@youj/icons/components/youj/icons/volume'
import { useSoundCue } from '@youj/core/lib/youj/sound-cue'
import { setSiteSound, useSiteSound } from '@/lib/site-sound'
import { cn } from '@/lib/cn'

const noop = () => () => {}

/**
 * The site's interface sound, on or off: a toggle button (its name stays
 * "Sound"; aria-pressed says which), the speaker's waves drawing in as it
 * turns on and crossing out as it turns off. Off by default. Turning it on is
 * the gesture browsers ask for before audio, and is answered with the toggle's
 * own sound once the pack is in; turning it off plays its last one. `sheet` is
 * the mobile menu's square key, beside the community links.
 */
export function SoundToggle({ variant = 'header' }: { variant?: 'header' | 'sheet' }) {
  const on = useSiteSound()
  const cue = useSoundCue()
  // The server draws it off; once hydrated it's redrawn in the stored state at rest, so a reload never animates it.
  const hydrated = useSyncExternalStore(noop, () => true, () => false)
  const tip = on ? 'Sound on' : 'Sound off'

  return (
    <button
      type="button"
      aria-label="Sound"
      aria-pressed={on}
      onClick={() => {
        if (on) cue('toggleOff')
        setSiteSound(!on)
      }}
      className={cn(
        variant === 'sheet'
          ? 'grid size-12 shrink-0 place-items-center rounded-xl border border-line bg-canvas text-fg-muted transition-colors yj-duration-fast ease-standard active:bg-hover focus-ring aria-pressed:text-fg'
          : 'group/tip relative hidden size-8 touch:size-11 place-items-center rounded-lg text-fg-muted transition-colors yj-duration-fast ease-standard hover:bg-hover hover:text-fg focus-ring aria-pressed:text-fg md:inline-grid',
      )}
    >
      <VolumeIcon key={hydrated ? 'client' : 'server'} size={variant === 'sheet' ? 20 : 18} strokeWidth={1.6} active={!on} />
      {variant === 'header' && (
        <span
          aria-hidden
          data-yj-tone="inverse"
          className="pointer-events-none absolute top-full left-1/2 z-50 mt-1.5 -translate-x-1/2 rounded-md bg-inverse px-2 py-1 text-ui-sm font-medium whitespace-nowrap text-fg opacity-0 shadow-sm transition-opacity yj-duration-fast ease-standard group-hover/tip:opacity-100 group-hover/tip:delay-300 group-focus-visible/tip:opacity-100 touch:hidden"
        >
          {tip}
        </span>
      )}
    </button>
  )
}
