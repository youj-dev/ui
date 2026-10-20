import { basics } from './basics.ts'

/* Each component's main docs demo (lib/basics.ts: the first ComponentPreview
 * on its page), shown by /view/component/<slug> (loaders in
 * generated/showcase.tsx, on a card stage). Plain text and node only, so the
 * generator script can import it. */

export type DemoKind = 'component'
export const DEMO_KINDS: readonly DemoKind[] = ['component']

export interface DemoItem {
  kind: DemoKind
  /** The taxonomy / registry item name. */
  slug: string
  /** The example it shows: `badge/demo` (lib/basics.ts's: the first on its docs page). */
  demo: string
}

/** Every component that has a demo. */
export function demoItems(): DemoItem[] {
  return DEMO_KINDS.flatMap((level) => basics(level).flatMap((e) => (e.demo ? [{ kind: level, slug: e.slug, demo: e.demo }] : [])))
}
