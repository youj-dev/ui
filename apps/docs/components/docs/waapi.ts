import type { Youj } from '@youj/core/lib/youj/provider'

type Duration = Parameters<Youj['ms']>[0]
type Easing = NonNullable<Parameters<Youj['ease']>[0]>

/** A token tween on the Web Animations API (no motion engine on arrival), held at its end until cancelled. Its `finished` settles either way. */
export function tween(el: Element, keyframes: Keyframe[], k: Youj, duration: Duration, ease: Easing = 'standard') {
  // Where there's no Web Animations API (jsdom), it's a tween that has already finished.
  if (typeof el.animate !== 'function') return Object.assign({ cancel() {}, finished: Promise.resolve() } as unknown as Animation, { done: Promise.resolve(true) })
  const animation = el.animate(keyframes, { duration: k.ms(duration), easing: `cubic-bezier(${k.ease(ease).join(',')})`, fill: 'forwards' })
  return Object.assign(animation, { done: animation.finished.then(() => true, () => false) })
}
