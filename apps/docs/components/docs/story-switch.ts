import type { Youj } from '@youj/core/lib/youj/provider'

/* A story switch on a docs preview (./stories-view, ./block-stories-view), which never leaves the stage empty: the
 * story on show softens as it's picked away from (a blur, half its opacity, a little color and scale) and holds
 * there, under the stage's breathing (.story-breath in styles/site.css), for as long as the next one takes; once the
 * next has painted, the two crossfade, the new one coming into focus over the softened old one on the kit's spring.
 * A next story that's ready at once crossfades straight away and never brings the breathing. Reduced motion: the old
 * one dims and the two crossfade on opacity alone.
 *
 * A frame (a block's page, `{ frame: true }`) softens and crossfades on opacity alone: its transform is the scale it's
 * drawn at, which an animated one would replace, and a filter on a frame over a WebGL backdrop can blank the stage. */

interface Options {
  /** A block's frame: opacity only. */
  frame?: boolean
}

const SOFT: Keyframe = { opacity: 0.5, filter: 'blur(8px) saturate(0.7)', transform: 'scale(0.99)' }
const SHARP: Keyframe = { opacity: 1, filter: 'blur(0px) saturate(1)', transform: 'none' }

const curve = (k: Youj, token: Parameters<Youj['ease']>[0]) => `cubic-bezier(${k.ease(token).join(',')})`
/** The crossfade's length: a little over the kit's `slow`, so the two stories are both in view for a moment. */
export const crossMs = (k: Youj) => Math.round(k.ms('slow') * 1.35)

/** Where an element stands now (its animations included), as a keyframe to carry on from. */
function current(el: Element, plain: boolean): Keyframe {
  const style = getComputedStyle(el)
  if (plain) return { opacity: Number(style.opacity) }
  return { opacity: Number(style.opacity), filter: style.filter === 'none' ? 'blur(0px) saturate(1)' : style.filter, transform: style.transform }
}

/** Drops an element's running animations, keeping it where they had it. */
function settle(el: Element, plain: boolean): Keyframe {
  const at = current(el, plain)
  for (const animation of el.getAnimations()) animation.cancel()
  return at
}

/** The story on show is picked away from: it softens, gently, and holds there until the next one arrives. */
export function soften(el: Element, k: Youj, { frame = false }: Options = {}) {
  if (typeof el.animate !== 'function') return
  const plain = frame || k.reduced
  el.animate([settle(el, plain), plain ? { opacity: k.reduced ? 0.6 : 0.5 } : SOFT], { duration: k.ms('slow'), easing: curve(k, 'standard'), fill: 'forwards' })
}

/** The story on show is picked again before the switch landed: it comes back into focus. */
export function sharpen(el: Element, k: Youj, { frame = false }: Options = {}) {
  if (typeof el.animate !== 'function') return
  const plain = frame || k.reduced
  el.animate([settle(el, plain), plain ? { opacity: 1 } : SHARP], { duration: k.ms('base'), easing: curve(k, 'enter') })
}

/**
 * The next story has mounted: it comes into focus from nothing over `leaving` (the softened old one, a snapshot or a
 * frame), which fades out under it; `remove` runs once the crossfade is over. Both start a frame after the new one
 * has painted, so its first frame is never half drawn; until then the old one stays as it was.
 */
export function crossfade(next: HTMLElement, leaving: Element | null, k: Youj, remove?: () => void, { frame = false }: Options = {}): Promise<void> {
  if (typeof next.animate !== 'function') {
    remove?.()
    return Promise.resolve()
  }
  for (const animation of next.getAnimations()) animation.cancel()
  const plain = frame || k.reduced
  const duration = crossMs(k)
  const spring = getComputedStyle(next).getPropertyValue('--ease-spring').trim() || curve(k, 'enter')
  const fade = plain
    ? next.animate([{ opacity: 0 }, { opacity: 1 }], { duration, easing: curve(k, 'standard'), fill: 'backwards' })
    : next.animate([{ opacity: 0, filter: 'blur(8px) saturate(0.7)' }, { opacity: 1, filter: 'blur(0px) saturate(1)' }], { duration, easing: curve(k, 'enter'), fill: 'backwards' })
  const scale = plain ? null : next.animate([{ transform: 'scale(0.99)' }, { transform: 'none' }], { duration: Math.max(duration, k.ms('slow')), easing: spring, fill: 'backwards' })
  const out = leaving ? leaving.animate([current(leaving, plain), { opacity: 0 }], { duration, easing: curve(k, 'standard'), fill: 'forwards' }) : null
  fade.pause()
  scale?.pause()
  out?.pause()
  return new Promise((resolve) => {
    const end = () => {
      remove?.()
      resolve()
    }
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        fade.play()
        scale?.play()
        out?.play()
        fade.finished.then(end, end)
      }),
    )
  })
}

/** Runs `task` when the browser is idle; returns a cancel. */
export function whenIdle(task: () => void): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(task, { timeout: 3000 })
    return () => window.cancelIdleCallback(id)
  }
  const id = setTimeout(task, 300)
  return () => clearTimeout(id)
}
