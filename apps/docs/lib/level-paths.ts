import type { Level } from './taxonomy.ts'

/* The ladder's names. Every level lives in the docs: a component on its docs
 * page, a block in a story on a Blocks docs page (lib/block-docs.ts). The
 * galleries that listed them are retired. Plain data, so the client's
 * search and viewer read it too. */

/** A level a /view page can open an item of: the taxonomy's levels but the frame. */
export type BrowseLevel = Exclude<Level, 'frame'>

/** The components imported from the packages: each is its docs page. */
export type BasicLevel = Extract<BrowseLevel, 'component'>
export const isBasicLevel = (level: string | undefined): level is BasicLevel => level === 'component'

export const LEVEL_LABELS: Record<Level, { one: string; many: string }> = {
  component: { one: 'Component', many: 'Components' },
  card: { one: 'Card', many: 'Cards' },
  section: { one: 'Section', many: 'Sections' },
  frame: { one: 'Frame', many: 'Frames' },
  screen: { one: 'Screen', many: 'Screens' },
}
