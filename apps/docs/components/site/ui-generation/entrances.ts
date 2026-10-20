import { skipsEffects } from './power'

/* The entrance effects a docs preview offers (the island's Entrance menu). To add one: add an entry with an id, a
 * label and a one-line description, and a `run` that plays it on the demo. Load the effect's code with `import()`
 * inside `run`, so a reader on None never fetches it. The reader's pick is `useEntranceId` (./opt-in.ts); a page's
 * demos wear the pick through <Generated> (./generated.tsx) and the frames through `?generate=<id>`. */

export interface EntranceTarget {
  /** The wrapper around the demo (./generated.tsx). */
  host: HTMLElement
  /** The demo's first box. */
  node: HTMLElement
  /** The demo's name, for its script (./scripts.ts). */
  name?: string
  /** Where its source is published (lib/code-url.ts), for Code; a docs example's is found by its name. */
  code?: string
  speed: number
}

export interface Entrance {
  id: string
  label: string
  description: string
  /** Plays the effect over the demo and returns what cancels it (and a promise for when it is over); absent on None. */
  run?: (target: EntranceTarget) => Promise<{ cancel: () => void; finished?: Promise<unknown> } | undefined>
}

/** The Code panel's tab for a published source: `/code/docs/switch/demo.json` → `switch/demo.tsx`, a block's file by its last two segments. */
export function codeFileName(src: string) {
  const parts = src.replace(/^\/code\//, '').replace(/\.json$/, '').split('/')
  return parts[0] === 'docs' ? `${parts.slice(1).join('/')}.tsx` : parts.slice(-2).join('/')
}

/** Every effect is gated by the low-power rule (./power.ts) before its code loads: on a device that can't hold 60 fps the demo just shows. */
const gated = (entry: Entrance): Entrance => {
  const run = entry.run
  return run ? { ...entry, run: async (target) => ((await skipsEffects()) ? undefined : run(target)) } : entry
}

const EFFECTS: Entrance[] = [
  { id: 'none', label: 'None', description: 'The demo is just there.' },
  {
    id: 'generate',
    label: 'Generate',
    description: 'The demo builds itself in, part by part.',
    run: async ({ node, name, speed }) => {
      const [{ generate }, { ready }, { SCRIPTS }] = await Promise.all([
        import('@youj/motion/components/youj/effects/generate/engine'),
        import('@youj/motion/components/youj/effects/entrance/ready'),
        import('./scripts'),
      ])
      await ready(node) // parts a demo lays out after mounting (a treemap, a measured chart) are read too
      const script = (name && SCRIPTS[name]) || {}
      return generate(node, { speed, order: script.order, names: script.names, duration: script.duration })
    },
  },
  {
    id: 'blueprint',
    label: 'Blueprint',
    description: 'The demo is drafted as a blueprint, with its measurements, then inked in.',
    run: async ({ node, speed }) => {
      const { blueprint } = await import('@youj/motion/components/youj/effects/blueprint/engine')
      await document.fonts?.ready
      return blueprint(node, { speed })
    },
  },
  {
    id: 'prism',
    label: 'Prism',
    description: 'Each piece arrives as three color channels that slide together and snap into register.',
    run: async ({ node, speed }) => {
      const [{ prism }, { ready }] = await Promise.all([
        import('@youj/motion/components/youj/effects/prism/engine'),
        import('@youj/motion/components/youj/effects/entrance/ready'),
      ])
      await ready(node)
      return prism(node, { speed })
    },
  },
  {
    id: 'trace',
    label: 'Trace',
    description: 'A signal runs the layout like a circuit and lights each part up as it arrives.',
    run: async ({ node, speed }) => {
      const [{ trace }, { ready }] = await Promise.all([
        import('@youj/motion/components/youj/effects/trace/engine'),
        import('@youj/motion/components/youj/effects/entrance/ready'),
      ])
      await ready(node)
      return trace(node, { speed })
    },
  },
  {
    id: 'inspector',
    label: 'Inspector',
    description: "Each part appears first as the browser's box model, then turns into the real part.",
    run: async ({ node, speed }) => {
      const [{ inspector }, { ready }] = await Promise.all([
        import('@youj/motion/components/youj/effects/inspector/engine'),
        import('@youj/motion/components/youj/effects/entrance/ready'),
      ])
      await ready(node)
      return inspector(node, { speed })
    },
  },
  {
    id: 'layers',
    label: 'Layers',
    description: 'The demo starts as an exploded stack of its layers, then collapses flat into the real thing.',
    run: async ({ node, speed }) => {
      const [{ layers }, { ready }] = await Promise.all([
        import('@youj/motion/components/youj/effects/layers/engine'),
        import('@youj/motion/components/youj/effects/entrance/ready'),
      ])
      await ready(node)
      return layers(node, { speed })
    },
  },
  {
    id: 'passes',
    label: 'Render passes',
    description: "The browser's pipeline as theatre: layout boxes, a flat paint, then the real composite.",
    run: async ({ node, speed }) => {
      const [{ renderPasses }, { ready }] = await Promise.all([
        import('@youj/motion/components/youj/effects/passes/engine'),
        import('@youj/motion/components/youj/effects/entrance/ready'),
      ])
      await ready(node)
      return renderPasses(node, { speed })
    },
  },
  {
    id: 'code',
    label: 'Code',
    description: "The demo's code writes itself, and each line compiles into its part.",
    run: async ({ host, node, name, code, speed }) => {
      // reduced motion: the demo is just there, as on None (and its source isn't fetched)
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
      const { codeUrl, loadCode } = await import('@/lib/code-load')
      const src = code ?? (name ? codeUrl.example(name) : undefined)
      if (!src) return undefined
      const [{ compile }, { ready }, body] = await Promise.all([
        import('./compile'),
        import('@youj/motion/components/youj/effects/entrance/ready'),
        loadCode(src),
        import('./code.css'),
      ])
      await ready(node)
      return compile(host, node, { speed, source: { ...body, file: codeFileName(src) } })
    },
  },
]

export const ENTRANCES: readonly Entrance[] = EFFECTS.map(gated)
