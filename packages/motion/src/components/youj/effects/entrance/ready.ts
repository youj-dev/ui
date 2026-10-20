/** Resolves once a demo is ready to be read: its fonts loaded, its own entrance animations over (a fade it plays on
 *  mounting; never a loop or anything that outlasts the wait), and its layout still for two frames (a chart that
 *  measures itself after mounting), each wait at most `cap` ms. An entrance reads the demo once, so it reads it at rest. */
export async function ready(node: Element, cap = 1000) {
  await document.fonts?.ready
  // (only what is playing on the clock and ends within the cap: a paused, scroll-driven or long ambient animation, an
  // 8 s drift, is part of the demo at rest, not its entrance)
  const ends = (a: Animation) => {
    const t = a.effect?.getComputedTiming()
    return Number(t?.endTime) - Number(a.currentTime)
  }
  const running = node.getAnimations({ subtree: true }).filter((a) => a.playState === 'running' && a.timeline === document.timeline && ends(a) <= cap)
  const timeout = () => new Promise((done) => setTimeout(done, cap))
  if (running.length) await Promise.race([Promise.allSettled(running.map((a) => a.finished)), timeout()])
  const until = performance.now() + cap
  let last = ''
  // (a part swapped for another of the same size, as a deferred hydration does, is a change too)
  let swapped = false
  const watch = new MutationObserver(() => {
    swapped = true
  })
  watch.observe(node, { childList: true, subtree: true })
  for (let still = 0; still < 2 && performance.now() < until; ) {
    await new Promise((done) => requestAnimationFrame(done))
    const r = node.getBoundingClientRect()
    const now = `${r.width},${r.height},${node.scrollHeight},${node.getElementsByTagName('*').length}`
    still = now === last && !swapped ? still + 1 : 0
    last = now
    swapped = false
  }
  watch.disconnect()
}
