'use client'

import { useSyncExternalStore } from 'react'
import { FRAME_CHANNEL, readFrameMessage, type FrameMessage, type FrameState } from '@/lib/frame-sync'

/* The item viewer's one live frame. A /view document is a whole Next app, so
 * the frame is made once and kept: a new item or story is a client-side
 * replace inside it (a 'go' message, components/showcase/showcase-view), which
 * loads only that item's code, and leaves no entry in the tab's history (Back
 * still closes the viewer). Between opens it's parked off screen, out of
 * reach (inert), and moved into the next viewer's stage with `moveBefore`,
 * which keeps a frame's document alive; a card pointed at for a moment warms
 * it with that card's item, so the viewer opens on a frame that has already
 * painted. A browser without `moveBefore` would reload a moved frame, so
 * there it isn't parked: each open makes a new one, and only the moves
 * within an open viewer are in place. */

type MovingNode = Node & { moveBefore?: (node: Node, child: Node | null) => void }

let frame: HTMLIFrameElement | null = null
let park: HTMLDivElement | null = null
/** The page the frame should show, and the last one it said it had painted. */
let wanted: string | null = null
let painted: string | null = null
/** The frame's document has said hello: its runtime is up and takes 'go'. */
let booted = false
/** The page a document still loading was asked for. */
let requested: string | null = null
/** The look sent to the frame: the open viewer's, else the list's. */
let look: FrameState | null = null
let base: FrameState | null = null
let dir: 'ltr' | 'rtl' = 'ltr'

const listeners = new Set<() => void>()
const notify = () => listeners.forEach((listener) => listener())

const canMove = () => typeof (Element.prototype as MovingNode).moveBefore === 'function'

/** The /view page the frame is on, as `viewerSrc` names it. */
function shown(): string | null {
  try {
    const at = frame?.contentWindow?.location
    return at && at.pathname.startsWith('/view/') ? at.pathname + at.search : null
  } catch {
    return null
  }
}

const same = (a: string | null, b: string | null) => a !== null && b !== null && decodeURIComponent(a) === decodeURIComponent(b)

function post() {
  const state = look ?? base
  if (!frame?.contentWindow || !state) return
  const message: FrameMessage = { channel: FRAME_CHANNEL, kind: 'state', state }
  frame.contentWindow.postMessage(message, window.location.origin)
}

function applyDir() {
  try {
    const html = frame?.contentDocument?.documentElement
    if (html && html.dir !== dir) html.dir = dir
  } catch {
    // Not ours yet.
  }
}

function onMessage(event: MessageEvent) {
  if (event.origin !== window.location.origin || !frame || event.source !== frame.contentWindow) return
  const message = readFrameMessage(event.data)
  if (message?.kind === 'hello') {
    booted = true
    requested = null
    post()
    applyDir()
    // A document that came up on another page than the one now named (a click moved on while it loaded).
    if (wanted && !same(shown(), wanted)) send(wanted)
  } else if (message?.kind === 'ready') {
    applyDir()
    const at = message.href ?? shown()
    if (same(at, wanted)) {
      if (painted !== wanted) {
        painted = wanted
        notify()
      }
    } else if (wanted) {
      // It painted a page it was sent away from (the arrows outran it): what it shows isn't what's named, so it goes on.
      if (painted !== null) {
        painted = null
        notify()
      }
      send(wanted)
    }
  }
}

function make(src: string) {
  const el = document.createElement('iframe')
  el.src = src
  el.dataset.viewerFrame = ''
  el.className = 'block size-full border-0 bg-canvas'
  el.addEventListener('load', applyDir)
  booted = false
  requested = src
  painted = null
  frame = el
  return el
}

function parking() {
  if (park?.isConnected) return park
  park = document.createElement('div')
  park.setAttribute('aria-hidden', 'true')
  park.inert = true
  park.dataset.viewerPark = ''
  // Off screen but laid out, at about the stage's size, so the item paints (and says so) before it's shown.
  Object.assign(park.style, { position: 'fixed', top: '0', left: '-200vw', width: '1280px', height: '800px', visibility: 'hidden', pointerEvents: 'none', contain: 'strict' })
  document.body.appendChild(park)
  return park
}

/** Shows `src` in the frame: in place once its runtime is up, else by replacing the page it's loading (no history entry either way). */
export function go(src: string) {
  wanted = src
  notify()
  // On it already, or on its way: it says when it has painted.
  if (!frame || same(shown(), src) || (!booted && requested === src)) return
  send(src)
}

function send(src: string) {
  if (!frame) return
  if (booted) {
    const message: FrameMessage = { channel: FRAME_CHANNEL, kind: 'go', href: src }
    frame.contentWindow?.postMessage(message, window.location.origin)
    return
  }
  requested = src
  try {
    frame.contentWindow?.location.replace(src)
  } catch {
    frame.src = src
  }
}

/**
 * Loads `src` into the parked frame ahead of an open, at `size` (the stage
 * it will be shown in). Nothing where a frame can't be moved without a
 * reload, or while the viewer has it.
 */
export function warm(src: string, size: { width: number; height: number }) {
  if (!canMove() || (frame && frame.parentElement !== park)) return
  const lot = parking()
  lot.style.width = `${Math.round(size.width)}px`
  lot.style.height = `${Math.round(size.height)}px`
  if (!frame) lot.appendChild(make(src))
  go(src)
}

/** Puts the frame on a viewer's stage, showing `src`: the warm one moved in, else a new one. */
export function attach(host: HTMLElement, src: string, title: string) {
  wanted = src
  if (!(frame && frame.parentElement === park && move(host, frame))) {
    frame?.remove()
    host.appendChild(make(src))
  }
  frame!.title = title
  go(src)
}

/** Moves a frame without reloading it, where the browser can (both places in the document). */
function move(to: HTMLElement, el: HTMLIFrameElement) {
  if (!canMove() || !el.isConnected || !to.isConnected) return false
  try {
    ;(to as MovingNode).moveBefore!(el, null)
    return true
  } catch {
    return false
  }
}

/** Takes the frame off a closing viewer's stage (`host`, or wherever it is): parked, still alive, where it can be moved; else dropped. */
export function detach(host?: HTMLElement) {
  if (!frame || frame.parentElement === park || (host && frame.parentElement !== host)) return
  look = null
  if (move(parking(), frame)) return
  frame.remove()
  frame = null
  booted = false
  requested = null
  painted = null
}

/** Loads the page on show again from scratch (Reload): it says when it has painted, as a new frame does. */
export function reload() {
  if (!frame || !wanted) return
  booted = false
  requested = wanted
  painted = null
  notify()
  try {
    frame.contentWindow?.location.replace(wanted)
  } catch {
    frame.src = wanted
  }
}

export function setTitle(title: string) {
  if (frame) frame.title = title
}

/** The open viewer's look (null when it closes: the list's again). */
export function setLook(state: FrameState | null) {
  look = state
  post()
}

/** The look a warmed frame is painted in: what the viewer opens with. */
export function setBase(state: FrameState | null) {
  base = state
  if (!look) post()
}

export function setDir(next: 'ltr' | 'rtl') {
  dir = next
  applyDir()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Whether the frame has painted `src`. */
export function useFramePainted(src: string) {
  return useSyncExternalStore(
    subscribe,
    () => painted !== null && same(painted, src) && same(wanted, src),
    () => false,
  )
}

if (typeof window !== 'undefined') window.addEventListener('message', onMessage)
