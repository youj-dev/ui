import type { GenerateOptions } from '@youj/motion/components/youj/effects/generate/engine'

/** A demo's tuning for Generate: the regions dragged out first, their names, the run's length. */
export type GenerateScript = Pick<GenerateOptions, 'order' | 'names' | 'duration'>

/* Showcase tuning for a few demos' Generate runs, by the name <ComponentPreview> uses. A demo without one is built from
 * its DOM alone (@youj/motion generate/engine.ts); a script only names the regions dragged out first and the length. */
export const SCRIPTS: Record<string, GenerateScript> = {
  'prompt-input/session': {
    order: ['[data-slot=input-group]', 'section', 'section > :last-child'],
    names: { '[data-slot=input-group]': 'composer', section: 'session', 'section > :last-child': 'footer' },
    duration: 6300,
  },
  // The home hero's card (components/landing/hero-build.ts): its release bar, then the panels its parts sit in.
  'home/hero': {
    order: ['.hc-head', '.hc-frame > :nth-child(3) > .hc-tile', '.hc-frame > :nth-child(5) > .hc-tile', '.hc-frame > :nth-child(7) > .hc-tile'],
    names: {
      '.hc-head': 'release',
      '.hc-frame > :nth-child(3) > .hc-tile': 'alerts',
      '.hc-frame > :nth-child(5) > .hc-tile': 'servers',
      '.hc-frame > :nth-child(7) > .hc-tile': 'appearance',
    },
    duration: 6500,
  },
}
