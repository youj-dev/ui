import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/typewriter'
import { typewriter } from './meta/typewriter'

export { typewriter }
export type MiniatureTypewriterKey = MiniatureKeyOf<typeof typewriter>
export type MiniatureTypewriterHandle = MiniatureHandle<MiniatureTypewriterKey>
export interface MiniatureTypewriterProps extends MiniatureProps {
  ref?: Ref<MiniatureTypewriterHandle>
}

/**
 * VELA 9, portable typewriter. Type on your keyboard: each key dips, its typebar swings up to the printing point, the ribbon lifts, the letter lands on the paper and the carriage steps one space. The bell rings six spaces before the margin. Return the carriage, switch the ribbon between black and red, or put the lid on. Left alone, it types its letter by itself.
 *
 * Keys: A–Z type · Enter return · ⌫ back · ↑ ↓ ribbon black · red · Esc lid.
 */
export function MiniatureTypewriter(props: MiniatureTypewriterProps) {
  return <Miniature {...props} meta={typewriter} figure={figure} />
}
