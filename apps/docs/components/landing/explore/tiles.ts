/* The Explore section's tiles: what each shows, its docs and its size on the bento. Plain data, read by the server
 * section (explore.tsx), which hands each live island only the tile's id. The order is the reading order and the
 * tablet's dense flow; from `xl` each tile takes its named area of AREAS. */

export type ExploreId =
  | 'voice'
  | 'rings'
  | 'slide'
  | 'hold'
  | 'flap'
  | 'capsule'
  | 'units'
  | 'hierarchy'
  | 'waffle'
  | 'loader'
  | 'icons'
  | 'share'
  | 'chart'
  | 'scene'
  | 'cursors'
  | 'breakdown'
  | 'dial'
  | 'signature'
  | 'gauge'
  | 'miniature'
  | 'heatmap'
  | 'compare'
  | 'wheel'
  | 'scrub'
  | 'glass'
  | 'radar'
  | 'clock'
  | 'diff'

/** `lg` two by two, `wide` two across, `tall` two down, `sm` one cell. */
export type ExploreSize = 'lg' | 'wide' | 'tall' | 'sm'

export interface ExploreTile {
  id: ExploreId
  name: string
  href: string
  size: ExploreSize
  /** The server's stand-in until the live piece arrives: a card's outline, or a round one. */
  ph?: 'round'
}

export const EXPLORE_TILES: readonly ExploreTile[] = [
  { id: 'voice', name: 'Voice Orb', href: '/docs/components/voice-orb', size: 'lg', ph: 'round' },
  { id: 'rings', name: 'Activity Rings', href: '/docs/components/activity-rings', size: 'tall', ph: 'round' },
  { id: 'slide', name: 'Slide to Confirm', href: '/docs/components/slide-to-confirm', size: 'sm' },
  { id: 'hold', name: 'Async Button', href: '/docs/components/button#async-button', size: 'sm' },
  { id: 'flap', name: 'Text Effect', href: '/docs/motion/text-effect', size: 'wide' },
  { id: 'capsule', name: 'Capsules', href: '/docs/components/capsule', size: 'wide' },
  { id: 'units', name: 'Unit Chart', href: '/docs/components/unit-chart', size: 'wide' },
  { id: 'hierarchy', name: 'Hierarchy Chart', href: '/docs/components/hierarchy-chart', size: 'wide' },
  { id: 'waffle', name: 'Waffle Chart', href: '/docs/components/waffle-chart', size: 'sm' },
  { id: 'loader', name: 'Draft loader', href: '/loaders?id=draft', size: 'sm', ph: 'round' },
  { id: 'icons', name: 'Animated icons', href: '/icons', size: 'sm' },
  { id: 'share', name: 'Share Ring', href: '/docs/components/share-ring', size: 'tall', ph: 'round' },
  { id: 'chart', name: 'Chart', href: '/docs/components/chart', size: 'wide' },
  { id: 'scene', name: 'Padlock illustration', href: '/illustrations?scene=padlock', size: 'sm', ph: 'round' },
  { id: 'cursors', name: 'Live Cursors', href: '/docs/components/live-cursors', size: 'lg' },
  { id: 'breakdown', name: 'Breakdown List', href: '/docs/components/breakdown-list', size: 'tall' },
  { id: 'dial', name: 'Dial', href: '/docs/components/dial', size: 'tall', ph: 'round' },
  { id: 'signature', name: 'Signature Pad', href: '/docs/components/signature-pad', size: 'wide' },
  { id: 'gauge', name: 'Gauge', href: '/docs/components/gauge', size: 'sm', ph: 'round' },
  { id: 'miniature', name: 'Turntable miniature', href: '/miniatures?item=turntable', size: 'sm', ph: 'round' },
  { id: 'heatmap', name: 'Calendar Heatmap', href: '/docs/components/calendar-heatmap', size: 'wide' },
  { id: 'compare', name: 'Image Compare', href: '/docs/components/image-compare', size: 'wide' },
  { id: 'wheel', name: 'Wheel Picker', href: '/docs/components/wheel-picker', size: 'tall' },
  { id: 'scrub', name: 'Scrub Number Field', href: '/docs/components/scrub-number-field', size: 'wide' },
  { id: 'glass', name: 'Liquid Glass', href: '/docs/components/liquid-glass', size: 'wide' },
  { id: 'radar', name: 'Radar Chart', href: '/docs/components/radar-chart', size: 'tall', ph: 'round' },
  { id: 'clock', name: 'World Clock', href: '/docs/components/world-clock', size: 'wide' },
  { id: 'diff', name: 'Diff Viewer', href: '/docs/components/diff-viewer', size: 'lg' },
]
