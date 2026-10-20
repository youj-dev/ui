import { act, render, screen } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { prism, type PrismPhases } from './engine'
import { PrismEntrance } from './prism'

/* jsdom has no layout, canvas or Web Animations: the look, its 60 fps and its pixel-identical end are checked in
 * Chromium (the stories' play functions and the measurements in the docs). These hold its contract: what it adds,
 * that cancel takes all of it away, and that reduced motion adds nothing. */

interface FakeAnimation {
  el: Element
  frames: Keyframe[]
  opts: KeyframeAnimationOptions
  cancelled: boolean
  startTime: number | null
  cancel(): void
}
let animations: FakeAnimation[] = []
let frames: FrameRequestCallback[] = []

beforeEach(() => {
  animations = []
  frames = []
  Element.prototype.animate = function (this: Element, frames: Keyframe[], opts: KeyframeAnimationOptions) {
    const a: FakeAnimation = {
      el: this,
      frames,
      opts,
      cancelled: false,
      startTime: null,
      cancel() {
        this.cancelled = true
      },
    }
    animations.push(a)
    return a as unknown as Animation
  }
  Element.prototype.getAnimations = () => []
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => frames.push(cb))
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})
afterEach(() => {
  delete (Element.prototype as Partial<Element>).animate
  delete (Element.prototype as Partial<Element>).getAnimations
  vi.restoreAllMocks()
  document.body.innerHTML = ''
  document.head.querySelectorAll('style').forEach((s) => s.remove())
})

function card() {
  const host = document.createElement('div')
  host.innerHTML =
    '<form style="padding:24px"><h2>Sign in</h2><p>Welcome back.</p><input aria-label="Email"><button type="submit">Sign in</button></form>'
  document.body.append(host)
  return { host, node: host.firstElementChild as HTMLElement }
}

test('adds one aria-hidden overlay beside the demo and fades the demo in with the frame', () => {
  const { host, node } = card()
  const run = prism(node, { reduced: false })
  const overlay = host.querySelector('[data-yj-prism]')!
  expect(overlay).toHaveAttribute('aria-hidden', 'true')
  expect(overlay.previousElementSibling).toBe(node)
  // the demo itself is faded in by an animation, never restyled
  expect(node.getAttribute('style')).toBe('padding:24px')
  expect(animations.some((a) => a.el === node && a.frames[0]!.opacity === 0)).toBe(true)
  run.cancel()
})

test('cancel restores the demo at once: animations cancelled, holds released, overlay and stylesheet gone', async () => {
  const { host, node } = card()
  const before = host.innerHTML
  const styles = document.head.querySelectorAll('style').length
  const run = prism(node, { reduced: false })
  expect(document.head.querySelectorAll('style').length).toBe(styles + 1)
  run.cancel()
  expect(animations.length).toBeGreaterThan(0)
  expect(animations.every((a) => a.cancelled)).toBe(true)
  expect(host.innerHTML).toBe(before)
  expect(document.head.querySelectorAll('style').length).toBe(styles)
  await expect(run.finished).resolves.toBeUndefined()
  run.cancel() // a second cancel is harmless
})

test('an aborted signal cancels the run, and focus moving into the demo ends it early', () => {
  const { host, node } = card()
  const before = host.innerHTML
  const controller = new AbortController()
  prism(node, { reduced: false, signal: controller.signal })
  controller.abort()
  expect(host.querySelector('[data-yj-prism]')).toBeNull()

  prism(node, { reduced: false })
  node.querySelector('input')!.focus()
  expect(host.querySelector('[data-yj-prism]')).toBeNull()
  expect(host.innerHTML).toBe(before)
})

test('phases share out the same run: a longer frame stage brings the demo in later, the total stays', () => {
  const frameAt = (phases?: PrismPhases) => {
    animations = []
    const { node } = card()
    const run = prism(node, { reduced: false, duration: 2000, phases })
    const fade = animations.find((a) => a.el === node)!
    run.cancel()
    return Number(fade.opts.delay)
  }
  const usual = frameAt()
  expect(frameAt({ frame: 40 })).toBeGreaterThan(usual)
  // weights are normalized: doubling every share changes nothing
  expect(frameAt({ frame: 32, build: 144, settle: 24 })).toBeCloseTo(usual)
  expect(usual).toBeLessThan(2000 * 0.16)
})

test('reduced motion adds nothing: no overlay, no animation, already finished', async () => {
  const { host, node } = card()
  const before = host.innerHTML
  const run = prism(node, { reduced: true })
  expect(host.innerHTML).toBe(before)
  expect(animations).toHaveLength(0)
  await expect(run.finished).resolves.toBeUndefined()
})

test('the run ends on its own clock and leaves nothing behind', async () => {
  const { host, node } = card()
  const before = host.innerHTML
  const run = prism(node, { reduced: false, duration: 1000 })
  frames.shift()!(0)
  frames.shift()!(400)
  expect(host.querySelector('[data-yj-prism]')).not.toBeNull()
  frames.shift()!(5000)
  expect(host.innerHTML).toBe(before)
  await expect(run.finished).resolves.toBeUndefined()
})

test('<PrismEntrance> plays around its first child and cancels on unmount', async () => {
  const { unmount, container } = render(
    <YoujProvider reducedMotion="never">
      <PrismEntrance data-testid="pm">
        <section aria-label="Plan">Pro plan</section>
      </PrismEntrance>
    </YoujProvider>,
  )
  // it waits for the demo to be at rest (two still frames) before reading it
  await vi.waitFor(() => {
    for (const f of frames.splice(0)) f(performance.now())
    expect(container.querySelector('[data-yj-prism]')).not.toBeNull()
  })
  expect(screen.getByRole('region', { name: 'Plan' })).toBeInTheDocument()
  expect(screen.getByTestId('pm').style.opacity).toBe('')
  unmount()
  expect(animations.every((a) => a.cancelled)).toBe(true)
})

test('<PrismEntrance> under reduced motion just shows its children', async () => {
  const { container } = render(
    <YoujProvider reducedMotion="always">
      <PrismEntrance>
        <section aria-label="Plan">Pro plan</section>
      </PrismEntrance>
    </YoujProvider>,
  )
  await act(async () => {})
  expect(container.querySelector('[data-yj-prism]')).toBeNull()
  expect(animations).toHaveLength(0)
})
