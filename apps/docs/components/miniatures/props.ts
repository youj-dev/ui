import type { HTMLAttributes } from 'react'
import type { MiniatureProps } from '@youj/miniatures'
import type { ComponentDoc, PropDoc } from '@/lib/props'

/* The props every miniature takes, as the props table draws them (the docs' Props, /docs/miniatures). The generated
 * tables read the kit's components only, so these are written here, keyed by MiniatureProps' own props: one added to
 * the package fails the typecheck until it's described. */

type Own = Exclude<keyof MiniatureProps, keyof Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onChange'>>

const OWN: Record<Own, Omit<PropDoc, 'name' | 'required'>> = {
  mode: { type: "'light' | 'dark' | 'system'", default: "'system'", description: 'Light, dark, or `system`: the page’s theme class or `data-theme`, else the OS.' },
  size: { type: 'number | string', description: 'The side of the square it’s fitted into, in pixels or any CSS length. Without it, it fills its container’s width at its own aspect ratio.' },
  stage: { type: 'boolean', default: 'false', description: 'Paints its stage behind it: warm paper, or warm charcoal in the dark.' },
  interactive: { type: 'boolean', default: 'true', description: '`false` draws a still picture (`role="img"`): no focus, pointer or keys. The ref still drives it.' },
  keyboard: { type: "'scoped' | 'global' | 'off'", default: "'scoped'", description: 'Where its keys work. `scoped` never takes the page’s keys.' },
  sound: { type: 'boolean', default: 'false', description: 'Lets it make its sounds, from the first click or key on it, never before.' },
  autoPlay: { type: 'boolean', default: 'true', description: '`false` shows its first frame and waits for an interaction or `play()`.' },
  reducedMotion: { type: "'user' | 'always' | 'never'", default: "'user'", description: '`user` follows `prefers-reduced-motion`; reduced, every change jumps to its end.' },
  onStateChange: { type: '(snapshot: MiniatureSnapshot) => void', description: 'Called with the new snapshot after the readout changes, at most once a frame.' },
}

export const MINIATURE_PROPS: ComponentDoc = {
  name: 'MiniatureProps',
  file: 'packages/miniatures/src/engine/types.ts',
  props: [
    ...Object.entries(OWN).map(([name, doc]) => ({ name, required: false, ...doc })),
    { name: 'aria-label', type: 'string', required: false, default: 'its name and model', description: 'Overrides the accessible name.' },
  ],
  extends: ['HTMLAttributes<HTMLDivElement>'],
}
