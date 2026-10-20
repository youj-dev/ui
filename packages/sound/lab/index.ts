/* The Sound builder's data, for the docs and Storybook: every candidate per
 * cue, measured, with each cue's loudness and the default pack's pick. Not
 * part of the published package. The render writes manifest.ts
 * (`pnpm -F @youj/sound render`); the candidates' audio is the
 * package's own `candidates`, so the builder plays exactly what ships. */

import type { SoundCue } from '@youj/core'

export { lab, labPacks } from './manifest'
export type { LabCue, LabPack, LabSound } from './types'
export { LONG_MS, encodeWav, processSound, type CueTarget, type ProcessedSound, type SoundIssue } from './process'

/** What each cue is for, as the builder and the docs name it. */
export const cueInfo: Record<SoundCue, { label: string; plays: string }> = {
  tap: { label: 'Tap', plays: 'A button is pressed, a copy button, a toggle key.' },
  select: { label: 'Select', plays: 'A tab or segment is chosen.' },
  toggleOn: { label: 'Toggle on', plays: 'A switch, checkbox or toggle turns on.' },
  toggleOff: { label: 'Toggle off', plays: 'It turns off.' },
  success: { label: 'Success', plays: 'An action succeeds, a copy lands, a success toast.' },
  error: { label: 'Error', plays: 'An action fails, an error toast.' },
  notify: { label: 'Notify', plays: 'Any other toast arrives.' },
  open: { label: 'Open', plays: 'A dialog or sheet opens.' },
  close: { label: 'Close', plays: 'It closes.' },
  tick: { label: 'Tick', plays: 'A detent: a slider or stepper step, in your own controls.' },
}
