import type { InternalThemeId as ThemeId } from '@youj/core/lib/youj/theme'

/* The backdrops the docs show blocks on: six painted, grainy grounds, each with a light and a dark version and a
 * theme preset of the same name drawn from the same colours. Four are the motion package's Atmosphere scenes (code,
 * shipped); two are photographs kept in the docs (public/backdrops, credited in CREDITS.md there). Every palette
 * comes from a combination in Sanzo Wada's A Dictionary of Color Combinations (1933–34): the colour data only.
 * A block story names one with `backdrop="meadow"` (components/docs/block-stories.tsx). */

export const BACKDROP_IDS = ['meadow', 'sandstone', 'cinnabar', 'umber', 'seaglass', 'heather'] as const
export type BackdropId = (typeof BACKDROP_IDS)[number]

export interface WadaSwatch {
  name: string
  hex: string
}

export interface PhotoCredit {
  photographer: string
  /** The photographer's Unsplash profile. */
  profile: string
  /** The photograph's page on Unsplash. */
  source: string
}

export interface Backdrop {
  id: BackdropId
  name: string
  /** The palette that matches it: its accent, neutrals and chart come from the same combination. Picking it anywhere shows this backdrop. */
  palette: ThemeId
  /** What it is, in a line. */
  description: string
  /** How it's made. */
  technique: string
  /** The combination in Wada's book it takes its colours from. */
  wada: { number: number; swatches: WadaSwatch[] }
  /** A code scene (the Atmosphere component), or a photograph per mode. */
  kind: 'scene' | 'photo'
  photo?: Record<'light' | 'dark', { src: string; credit: PhotoCredit }>
  /** The block story the docs show on it. */
  showcase: { label: string; href: string }
}

export const BACKDROPS: readonly Backdrop[] = [
  {
    id: 'meadow',
    name: 'Meadow',
    palette: 'meadow',
    showcase: { label: 'Metric chart', href: '/docs/blocks/trends-and-comparisons#metric-chart' },
    description: 'A meadow under sky, panned so the grass streaks; at night, the blue hour.',
    technique: 'Code: directional motion-blur streaks',
    wada: {
      number: 294,
      swatches: [
        { name: 'Sulpher Yellow', hex: '#f5ecc2' },
        { name: 'Cream Yellow', hex: '#fdbf68' },
        { name: 'Cossack Green', hex: '#437742' },
        { name: 'Salvia Blue', hex: '#97acc8' },
      ],
    },
    kind: 'scene',
  },
  {
    id: 'sandstone',
    name: 'Sandstone',
    palette: 'sandstone',
    showcase: { label: 'Breakdown', href: '/docs/blocks/trends-and-comparisons' },
    description: 'Broad dunes lit from the top left, with a fine suede grain; at night, sand under a navy sky.',
    technique: 'Code: a lit height field and an embossed grain',
    wada: {
      number: 279,
      swatches: [
        { name: 'Raw Sienna', hex: '#bb7125' },
        { name: 'Vinaceous Cinnamon', hex: '#eea78c' },
        { name: 'Ecru', hex: '#c2ae93' },
        { name: 'Dark Tyrian Blue', hex: '#12354e' },
      ],
    },
    kind: 'scene',
  },
  {
    id: 'cinnabar',
    name: 'Cinnabar',
    palette: 'cinnabar',
    showcase: { label: 'Retention', href: '/docs/blocks/trends-and-comparisons#retention' },
    description: 'Near-black glowing into English red, crossed by soft shadow bands; by day, ivory warming to the red.',
    technique: 'Code: a layered gradient and heavy film grain',
    wada: {
      number: 190,
      swatches: [
        { name: 'Ivory Buff', hex: '#ebd3a2' },
        { name: 'English Red', hex: '#d96629' },
        { name: 'Black', hex: '#111314' },
      ],
    },
    kind: 'scene',
  },
  {
    id: 'umber',
    name: 'Umber',
    palette: 'umber',
    showcase: { label: 'Orders', href: '/docs/blocks/tables-and-lists#bulk-actions' },
    description: 'A dusk going down from a pale sky to umber; at night, a slate sky over a brass horizon.',
    technique: 'Code: a dusk gradient and a coarse stipple',
    wada: {
      number: 160,
      swatches: [
        { name: 'Sulphine Yellow', hex: '#c19f2c' },
        { name: 'Pale Raw Umber', hex: '#71502f' },
        { name: 'Dark Medici Blue', hex: '#547076' },
      ],
    },
    kind: 'scene',
  },
  {
    id: 'seaglass',
    name: 'Seaglass',
    palette: 'seaglass',
    showcase: { label: 'KPI cards', href: '/docs/blocks/trends-and-comparisons#kpi-cards' },
    description: 'A long-exposure sea at dawn; at night, a deep blue wave.',
    technique: 'Photograph: softened and graded',
    wada: {
      number: 302,
      swatches: [
        { name: 'Cream Yellow', hex: '#fdbf68' },
        { name: 'Ecru', hex: '#c2ae93' },
        { name: 'Nile Blue', hex: '#bce4e5' },
        { name: 'Antwarp Blue', hex: '#007190' },
      ],
    },
    kind: 'photo',
    photo: {
      light: {
        src: '/backdrops/seaglass-light.webp',
        credit: { photographer: 'Jonathan Bean', profile: 'https://unsplash.com/@jonathanbean', source: 'https://unsplash.com/photos/calm-sea-under-golden-clouds-ywnnwzcdR5o' },
      },
      dark: {
        src: '/backdrops/seaglass-dark.webp',
        credit: { photographer: 'Regine Tholen', profile: 'https://unsplash.com/@designbytholen', source: 'https://unsplash.com/photos/body-of-water-OSKCUpGVXv4' },
      },
    },
  },
  {
    id: 'heather',
    name: 'Heather',
    palette: 'heather',
    showcase: { label: 'Goals', href: '/docs/blocks/meters-and-limits#goals' },
    description: 'Heather on a moor, backlit and soft; at night, heather after sundown.',
    technique: 'Photograph: softened, panned and graded',
    wada: {
      number: 162,
      swatches: [
        { name: 'Old Rose', hex: '#d46d7a' },
        { name: 'Rainette Green', hex: '#8fa071' },
        { name: 'Lilac', hex: '#b984af' },
      ],
    },
    kind: 'photo',
    photo: {
      light: {
        src: '/backdrops/heather-light.webp',
        credit: { photographer: 'Jisca Lucia', profile: 'https://unsplash.com/@wanderlandjournal', source: 'https://unsplash.com/photos/a-field-full-of-purple-flowers-with-the-sun-shining-in-the-background-_YIhjRB16aU' },
      },
      dark: {
        src: '/backdrops/heather-dark.webp',
        credit: { photographer: 'Chiara Wolf', profile: 'https://unsplash.com/@wanderwolves', source: 'https://unsplash.com/photos/a-field-of-purple-flowers-p_RHVffaclk' },
      },
    },
  },
]

export const isBackdropId = (value: unknown): value is BackdropId => BACKDROP_IDS.includes(value as BackdropId)

export function backdropById(id: BackdropId): Backdrop {
  return BACKDROPS.find((b) => b.id === id)!
}

/** The backdrop a palette brings with it, if it has one: picking Sandstone anywhere shows the dune. */
export const backdropForPreset = (preset: string | null | undefined): Backdrop | null => (preset ? (BACKDROPS.find((b) => b.palette === preset) ?? null) : null)
