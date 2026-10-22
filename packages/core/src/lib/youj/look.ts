/* The look axis. A theme owns color, type and the radius scale; a look owns
 * how each component is built: its anatomy, spacing and the shape of its
 * parts. Any theme pairs with any look.
 *
 * A look is CSS: recipes in @youj/react keyed on `[data-yj-look='<id>']`
 * and the components' own data-slot / data-variant hooks, so components carry
 * no branches for it. `classic` is the default: it has no recipes at all, so
 * a page without a provider is Classic too, and the root YoujProvider (or a
 * root ThemeScope) writes it without being asked. `bezel` is one prop away
 * (look="bezel"). The provider
 * and ThemeScope write the attribute for their subtree and carry it onto
 * everything they portal. */

export const LOOKS = ['classic', 'bezel'] as const

export type YoujLook = (typeof LOOKS)[number]

export interface LookInfo {
  id: YoujLook
  name: string
  /** One line on how the look builds components. */
  description: string
}

export const DEFAULT_LOOK: YoujLook = 'classic'

export const looks: readonly LookInfo[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Hairline-bordered panels, rounded-rectangle controls and underline tabs.',
  },
  {
    id: 'bezel',
    name: 'Bezel',
    description:
      'Instrument panels: hairline-divided sections under mono capital labels, pill actions, filled wells for fields, segmented tracks and figures in mono.',
  },
]

export function isYoujLook(value: unknown): value is YoujLook {
  return typeof value === 'string' && (LOOKS as readonly string[]).includes(value)
}

/** A look by id; unknown ids fall back to the default (classic). */
export function lookById(id: string | null | undefined): LookInfo {
  return looks.find((s) => s.id === id) ?? looks.find((s) => s.id === DEFAULT_LOOK)!
}
