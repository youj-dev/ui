'use client'

import { useRef, type KeyboardEvent } from 'react'
import Link from 'next/link'
import { YoujProvider, useSound, useYouj, type SoundCue } from '@youj/core'
import { beacon } from '@youj/sound'
import { cueInfo, lab } from '@youj/sound/lab'
import { ArrowRightIcon } from '@youj/icons'
import { Waveform, type WaveformHandle } from './sound-viz'

/* The default pack, to hear: a key per cue, played through a real
 * YoujProvider as an app plays it, from the first sample, on the press.
 * Keys 1–9 and 0 play them in order while a key has focus. The reader asks
 * for each sound, so it plays under reduced motion too. */

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
const NAMES: Record<SoundCue, string> = { tap: 'Tap', select: 'Select', toggleOn: 'On', toggleOff: 'Off', success: 'Success', error: 'Error', notify: 'Notify', open: 'Open', close: 'Close', tick: 'Tick' }
const sounds = lab.map(({ cue, defaultId, variants }) => ({ cue, sound: variants.find((v) => v.id === defaultId)! }))
const kb = Math.round(sounds.reduce((sum, { sound }) => sum + sound.bytes, 0) / 1024)

export function SoundStrip() {
  return (
    <YoujProvider sound={{ pack: beacon, muted: false, whenReduced: true }}>
      <Keys />
    </YoujProvider>
  )
}

function Keys() {
  const k = useYouj()
  const sound = useSound()
  const handles = useRef(new Map<SoundCue, WaveformHandle>())
  const trigger = (cue: SoundCue, ms: number) => {
    sound.play(cue)
    handles.current.get(cue)?.play(ms)
  }
  const onKeyDown = (event: KeyboardEvent) => {
    const index = KEYS.indexOf(event.key)
    if (index < 0 || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return
    const { cue, sound: entry } = sounds[index]!
    event.preventDefault()
    trigger(cue, entry.ms)
  }

  return (
    <div className="not-prose flex flex-col gap-3 rounded-xl border border-line bg-surface p-3 shadow-xs sm:p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-ui font-medium text-fg">
          The Beacon pack <span className="type-small font-normal text-fg-muted">· the default · {kb} KB</span>
        </p>
        <Link prefetch={false} href="/docs/sound#sound-builder" className="inline-flex items-center gap-1 rounded-sm text-ui-sm font-medium text-accent-text hover:underline focus-ring">
          Make your own in the Sound builder
          <ArrowRightIcon size={13} className="rtl:-scale-x-100" aria-hidden />
        </Link>
      </div>
      <div role="group" aria-label="Hear the Beacon pack" onKeyDown={onKeyDown} className="grid grid-cols-5 gap-1 sm:gap-2">
        {sounds.map(({ cue, sound: entry }, index) => (
          <button
            key={cue}
            type="button"
            aria-label={`Play ${cueInfo[cue].label}`}
            data-reduced-motion={k.reduced || undefined}
            onPointerDown={(event) => event.button === 0 && trigger(cue, entry.ms)}
            onKeyDown={(event) => {
              if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
                event.preventDefault()
                trigger(cue, entry.ms)
              }
            }}
            className="group flex min-w-0 flex-col gap-1.5 rounded-lg border border-line bg-surface px-1 py-2 text-start sm:px-2.5 transition-[background-color,scale] yj-duration-fast ease-standard hover:bg-hover focus-ring active:scale-[0.97] reduced:active:scale-100"
          >
            <span className="flex items-baseline justify-between gap-1">
              <span className="truncate text-[12px] font-medium text-fg sm:text-ui-sm">{NAMES[cue]}</span>
              <kbd aria-hidden className="font-mono text-ui-xs text-fg-subtle max-sm:hidden pointer-coarse:hidden">
                {KEYS[index]}
              </kbd>
            </span>
            <Waveform
              ref={(handle) => {
                if (handle) handles.current.set(cue, handle)
                else handles.current.delete(cue)
              }}
              wave={entry.wave}
              className="h-6 w-full sm:h-8"
            />
          </button>
        ))}
      </div>
    </div>
  )
}
