import { act } from '@testing-library/react'
import { TextEffect, type TextEffectName } from './text-effect'
import { installObservers, renderFull, renderReduced } from '@youj/core/test-utils'

const EFFECTS: TextEffectName[] = ['split-flap', 'terminal', 'decode', 'blur-in', 'roll']

let now = 0
let queue: FrameRequestCallback[] = []

beforeAll(installObservers)
beforeEach(() => {
  now = 0
  queue = []
  vi.spyOn(performance, 'now').mockImplementation(() => now)
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => queue.push(cb))
})
afterEach(() => vi.restoreAllMocks())

/** Runs frames 16ms apart, for `ms` or until nothing is queued. */
async function advance(ms = Number.POSITIVE_INFINITY) {
  const end = now + ms
  await act(async () => {
    while (queue.length && now < end) {
      now += 16
      const frame = queue
      queue = []
      for (const cb of frame) cb(now)
    }
  })
}

const root = () => document.querySelector('[data-slot="text-effect"]') as HTMLElement
const visual = () => root().querySelector(':scope > [aria-hidden]') as HTMLElement
const srText = () => root().querySelector(':scope > .sr-only')!.textContent

test.each(EFFECTS)('%s: assistive tech reads the final text throughout, and the play lands on it', async (effect) => {
  const onComplete = vi.fn()
  renderFull(<TextEffect effect={effect} text="Gate 12 boarding" inView={false} onComplete={onComplete} />)
  expect(srText()).toBe('Gate 12 boarding')
  expect(root()).toHaveAttribute('data-state', 'playing')
  await advance()
  expect(root()).toHaveAttribute('data-state', 'done')
  expect(onComplete).toHaveBeenCalledTimes(1)
  expect(visual().textContent).toContain('Gate 12 boarding')
  // The hidden copy is the only one assistive tech can reach.
  expect(root().querySelectorAll('.sr-only:not([aria-hidden] .sr-only)')).toHaveLength(1)
})

test.each(EFFECTS)('%s: reduced motion shows the final text at once and completes', (effect) => {
  const onComplete = vi.fn()
  const { rerender } = renderReduced(<TextEffect effect={effect} text="Ready" inView={false} onComplete={onComplete} />)
  expect(root()).toHaveAttribute('data-state', 'done')
  expect(visual().textContent).toContain('Ready')
  expect(onComplete).toHaveBeenCalled()
  rerender(<TextEffect effect={effect} text="Shipped" inView={false} onComplete={onComplete} />)
  expect(srText()).toBe('Shipped')
  expect(visual().textContent).toContain('Shipped')
  expect(queue).toHaveLength(0)
})

test('split-flap gives every character a tile sized by its final character, and flips from the old text to the new', async () => {
  const { rerender } = renderFull(<TextEffect effect="split-flap" text="LDN" inView={false} />)
  await advance()
  const tiles = () => [...root().querySelectorAll('[data-yj-flap]')]
  expect(tiles().map((t) => t.firstElementChild!.textContent)).toEqual(['L', 'D', 'N'])

  rerender(<TextEffect effect="split-flap" text="PAR" inView={false} />)
  expect(root()).toHaveAttribute('data-state', 'playing')
  // The sizer already holds the new text (the box is the final one); the leaves start on the old.
  expect(tiles().map((t) => t.firstElementChild!.textContent)).toEqual(['P', 'A', 'R'])
  expect(tiles()[0]!.children[3]!.textContent).toBe('L')
  await advance()
  expect(root()).toHaveAttribute('data-state', 'done')
  expect(tiles()[0]!.children).toHaveLength(2) // the character and the hinge
})

test('roll turns each character on a reel that ends on it', async () => {
  renderFull(<TextEffect effect="roll" text="42" inView={false} />)
  const reels = [...root().querySelectorAll('[data-yj-reel]')]
  expect(reels.map((r) => r.lastElementChild!.textContent)).toEqual(['4', '2'])
  await advance()
  expect(root().querySelectorAll('[data-yj-reel]')).toHaveLength(0)
  expect(visual().textContent).toBe('42')
})

test('terminal types the text out behind its prompt, and the prompt is not read', async () => {
  renderFull(<TextEffect effect="terminal" text="pnpm build" prompt="$ " stagger="base" inView={false} />)
  const typed = () => root().querySelector('[data-yj-caret]')!.previousElementSibling!.textContent
  expect(typed()).toBe('')
  await advance(160)
  expect(typed()!.length).toBeGreaterThan(0)
  expect('pnpm build'.startsWith(typed()!)).toBe(true)
  expect(typed()).not.toBe('pnpm build')
  await advance()
  expect(typed()).toBe('pnpm build')
  expect(srText()).toBe('pnpm build')
})

test('terminal with erase deletes back to the shared start before typing the new text', async () => {
  const seen = new Set<string>()
  const { rerender } = renderFull(<TextEffect effect="terminal" text="deploy: building" erase inView={false} />)
  await advance()
  rerender(<TextEffect effect="terminal" text="deploy: ready" erase inView={false} />)
  const typed = () => root().querySelector('[data-yj-caret]')!.previousElementSibling!.textContent!
  while (root().getAttribute('data-state') === 'playing') {
    seen.add(typed())
    await advance(16)
  }
  expect(seen).toContain('deploy: build')
  expect(seen).toContain('deploy: ')
  expect(seen).not.toContain('')
  expect(typed()).toBe('deploy: ready')
})

test('blur-in starts every word hidden in its final place and sharpens them in order', async () => {
  renderFull(<TextEffect text="Ship it today" stagger="loose" inView={false} />)
  const units = [...root().querySelectorAll<HTMLElement>('[data-yj-unit]')]
  expect(units.map((u) => u.textContent)).toEqual(['Ship', 'it', 'today'])
  await advance(48)
  expect(Number(units[0]!.style.opacity)).toBeGreaterThan(Number(units[2]!.style.opacity))
  await advance()
  expect(visual().textContent).toBe('Ship it today')
})

test('decode is ScrambleText: its copy is hidden, so the text is read once', async () => {
  renderFull(<TextEffect effect="decode" text="SYSTEMS NOMINAL" inView={false} />)
  expect(root().querySelectorAll('.sr-only')).toHaveLength(2)
  expect(root().querySelector('[aria-hidden] .sr-only')).not.toBeNull()
  await advance()
  expect(root()).toHaveAttribute('data-state', 'done')
})

test('waits for the viewport by default', async () => {
  class Never {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  }
  vi.stubGlobal('IntersectionObserver', Never)
  renderFull(<TextEffect effect="split-flap" text="ON TIME" />)
  expect(root()).toHaveAttribute('data-state', 'idle')
  expect(srText()).toBe('ON TIME')
  expect(queue).toHaveLength(0)
  vi.unstubAllGlobals()
  installObservers()
})

test('cancels its frame on unmount', () => {
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 7)
  const cancel = vi.spyOn(window, 'cancelAnimationFrame')
  const { unmount } = renderFull(<TextEffect effect="roll" text="99" inView={false} />)
  unmount()
  expect(cancel).toHaveBeenCalledWith(7)
})
