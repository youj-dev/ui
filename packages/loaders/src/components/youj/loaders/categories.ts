/* The loaders' categories, in gallery order, and the metadata each
 * loader declares about itself (`export const meta` in its own file).
 * scripts/loaders.mjs reads every loader's meta to write its
 * category's barrel and registry fragment, so no shared list is edited by
 * hand when a loader is added. */

export type LoaderCategory = 'color' | 'depth' | 'geometry' | 'orbs' | 'mechanics' | 'science' | 'waves' | 'signal' | 'glyph' | 'interface' | 'software'

export interface LoaderCategoryInfo {
  id: LoaderCategory
  title: string
  blurb: string
}

export const LOADER_CATEGORIES: LoaderCategoryInfo[] = [
  { id: 'color', title: 'Color', blurb: 'Built around the theme’s colors: hue travelling through a structure, layered tints, color as state.' },
  { id: 'depth', title: 'Depth', blurb: 'Particle fields in perspective: nearer marks larger and brighter.' },
  { id: 'geometry', title: 'Geometry', blurb: 'Wireframes, planes lit by their facets, surfaces drawn in lines.' },
  { id: 'orbs', title: 'Orbs', blurb: 'Spherical worlds: unfolding shells, liquid bodies, optical skins and orbital structures.' },
  { id: 'mechanics', title: 'Mechanics', blurb: 'Working mechanisms and physical motion: linked parts, contact and exchanged energy.' },
  { id: 'science', title: 'Science', blurb: 'Molecular structures and physical processes: bonds, orbitals, reactions and curling tracks.' },
  { id: 'waves', title: 'Waves', blurb: 'Pulses, wavefronts and fields: energy propagating through space and matter.' },
  { id: 'signal', title: 'Signal', blurb: 'Waveforms and live data, drawn as they arrive.' },
  { id: 'glyph', title: 'Glyph', blurb: 'The youj letterforms, drawing, turning and assembling.' },
  { id: 'interface', title: 'Interface', blurb: 'Cursors, focus rings, pipelines and construction marks.' },
  { id: 'software', title: 'Software', blurb: 'Software at work: app frames, design canvases, data, code and deploys.' },
]

/** How a loader is mainly drawn. Particles are one tool among many: at most about a quarter of the set. */
export const LOADER_TECHNIQUES = ['particles', 'lines', 'planes', 'paths', 'type', 'mixed'] as const
export type LoaderTechnique = (typeof LOADER_TECHNIQUES)[number]

export interface LoaderMeta {
  /** Kebab-case; the file's name, the class `yj-<id>` and the registry item `loader-<id>`. Its component is `Loader` + its PascalCase. */
  id: string
  /** Its name in the gallery: our own, a word or two. */
  title: string
  category: LoaderCategory
  technique: LoaderTechnique
  /** Words a search should find it by. */
  tags: readonly string[]
  /** One or two sentences: what it shows and how it moves. */
  description: string
  /** Its place in its category's gallery row; lower first. */
  order: number
  /** Its colored parts, in the order `colors` colors them (its extra tones, `c1` first). Its spec draws with these (`tones: meta.colors`). */
  colors?: readonly LoaderColorPart[]
}

/** A theme role a colored part can take: one of the four derived from the accent (`c1` what moves, `c2` the second layer, `c3` a finished state, `c4` rare) or the success ink. */
export type LoaderToneRole = 'c1' | 'c2' | 'c3' | 'c4' | 'success'

/** A colored part (an extra tone): its name (a word or two, for the gallery's pickers), the tone it stands in for without `colors`, and its theme role (by default `c1`, `c2`, `c3`, `c4` for the first to the fourth). */
export interface LoaderColorPart {
  part: string
  mono: 'ink' | 'accent'
  role?: LoaderToneRole
}

/** The roles the parts take by default, first to fourth. */
export const DEFAULT_TONE_ROLES: readonly LoaderToneRole[] = ['c1', 'c2', 'c3', 'c4']

const ACCENT = 'var(--yj-anim-accent, var(--color-accent))'

/** The theme's color for each role, derived from the accent so it follows every theme: muted, and lighter in the dark scheme where the second layer needs it. */
export const TONE_ROLE_COLORS: Readonly<Record<LoaderToneRole, string>> = {
  c1: `oklch(from ${ACCENT} .74 .065 calc(h + 180))`, // youj-allow: derived from the theme accent
  c2: `oklch(from ${ACCENT} calc(.62 + .1 * var(--yj-dark, 1)) .06 h)`, // youj-allow: derived from the theme accent
  c3: 'var(--color-success)',
  c4: `oklch(from ${ACCENT} .70 .05 calc(h + 90))`, // youj-allow: derived from the theme accent
  success: 'var(--color-success)',
}
