import { ready } from '@youj/motion/components/youj/effects/entrance/ready'
import { generate } from '@youj/motion/components/youj/effects/generate/engine'
import type { EntranceRun } from '@youj/motion/components/youj/effects/entrance/run'

/* Docs site only, with the Generate entrance: a dialog, sheet or popover that opens while a demo is arriving (its
 * <Generated> host wears `data-gen-live`, ./generated.tsx: the first view, a Replay, a new story) builds in once its
 * opening motion is over (@youj/motion generate/engine.ts), and its build stops if it closes first. One the reader opens afterwards, by
 * clicking, appears as it always does. One watcher for the page, shared by every demo on it. */

const POPUP = '[role=dialog], [role=alertdialog]'
let users = 0
let watcher: MutationObserver | null = null
const runs = new Map<Element, EntranceRun>()

async function play(popup: HTMLElement) {
  if (runs.has(popup) || popup.closest('[data-yj-generate]') || !document.querySelector('[data-gen-live]')) return
  runs.set(popup, { finished: Promise.resolve(), cancel: () => {}, seek: () => {} })
  // let it finish opening, so the build reads where it rests; unseen meanwhile, so it doesn't show whole and then go
  // (visibility: its opening animation runs on opacity and transform, untouched)
  const shown = popup.style.getPropertyValue('visibility')
  popup.style.setProperty('visibility', 'hidden')
  const show = () => (shown ? popup.style.setProperty('visibility', shown) : popup.style.removeProperty('visibility'))
  const opening = popup.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {}))
  await Promise.race([Promise.all(opening), new Promise((r) => setTimeout(r, 700))])
  await ready(popup)
  if (!popup.isConnected) return runs.delete(popup)
  // (seen again just before it's read; the build clips it to nothing in the same task, so it never paints whole)
  show()
  const run = generate(popup)
  runs.set(popup, run)
  void run.finished.then(() => runs.delete(popup))
}

export function watchOverlays() {
  users++
  if (!watcher) {
    watcher = new MutationObserver((records) => {
      for (const r of records) {
        // a demo starting to arrive: a popup already open (a sheet open from the first paint) builds in with it
        if (r.type === 'attributes') for (const p of document.querySelectorAll<HTMLElement>(POPUP)) void play(p)
        for (const n of r.addedNodes) {
          if (!(n instanceof HTMLElement)) continue
          for (const p of n.matches(POPUP) ? [n] : n.querySelectorAll<HTMLElement>(POPUP)) void play(p)
        }
        for (const n of r.removedNodes) for (const [p, run] of runs) if (n === p || n.contains(p)) run.cancel()
      }
    })
    watcher.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-gen-live'] })
    for (const p of document.querySelectorAll<HTMLElement>(POPUP)) void play(p)
  }
  return () => {
    if (--users > 0) return
    watcher?.disconnect()
    watcher = null
    for (const run of runs.values()) run.cancel()
    runs.clear()
  }
}
