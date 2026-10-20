'use client'

import { createContext, useContext } from 'react'
import type { IconSwapTransition } from '@youj/icons'

/* How the explorer draws its icons: the viewer's own settings, not part of
 * shared links. */

/** Theme tokens an icon can be drawn in, or a custom color. */
export const INKS = [
  { id: 'default', label: 'Default', css: 'var(--color-fg)', className: '' },
  { id: 'muted', label: 'Muted', css: 'var(--color-fg-muted)', className: 'text-fg-muted' },
  { id: 'accent', label: 'Accent', css: 'var(--color-accent)', className: 'text-accent' },
  { id: 'success', label: 'Success', css: 'var(--color-success)', className: 'text-success' },
  { id: 'warning', label: 'Warning', css: 'var(--color-warning)', className: 'text-warning' },
  { id: 'danger', label: 'Danger', css: 'var(--color-danger)', className: 'text-danger' },
] as const

export type InkId = (typeof INKS)[number]['id']

/** A token id, or a custom color as #rrggbb. */
export type Ink = InkId | `#${string}`

export type PreviewMode = 'hover' | 'loop' | 'morph'
export type Density = 'grid' | 'list'

export interface DisplaySettings {
  size: number
  strokeWidth: number
  ink: Ink
  mode: PreviewMode
  density: Density
  /** The transition swap pairs play. */
  transition: IconSwapTransition
}

/** The size is the one the code is written with (the package's 24 leaves it out); a card draws its icon a size up (icon-grid.tsx, previewSize). */
export const DEFAULT_SETTINGS: DisplaySettings = {
  size: 24,
  strokeWidth: 1.5,
  ink: 'default',
  mode: 'hover',
  density: 'grid',
  transition: 'morph',
}

export const SIZE_RANGE = { min: 16, max: 64, step: 4 } as const
export const STROKE_RANGE = { min: 1, max: 2.5, step: 0.25 } as const

export const isCustomInk = (ink: Ink): ink is `#${string}` => ink.startsWith('#')

/** What Custom starts as, until a color is picked. */
export const DEFAULT_CUSTOM_INK = '#a855f7' as const

/** The CSS color an ink paints with. */
export function inkColor(ink: Ink): string {
  if (isCustomInk(ink)) return ink
  return INKS.find((i) => i.id === ink)!.css
}

export interface ExplorerContextValue extends DisplaySettings {
  /** When the morph wave last turned, on the performance clock, so tiles time their step from it. */
  waveAt: number
}

export const ExplorerSettingsContext = createContext<ExplorerContextValue>({ ...DEFAULT_SETTINGS, waveAt: 0 })

export const useDisplay = () => useContext(ExplorerSettingsContext)
