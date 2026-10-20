import { act, render, screen } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { BlueprintEntrance } from './blueprint'
import { blueprint, type BlueprintPhases } from './engine'

/* jsdom has no layout, canvas or Web Animations: the engine's look and its 60 fps are checked in Chromium (the
 * stories' play functions and the measurements in the docs). These hold its contract: what it adds, that cancel
 * takes all of it away, and that reduced motion adds nothing. */

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
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => frames.push(cb))
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})
afterEach(() => {
  delete (Element.prototype as Partial<Element>).animate
  vi.restoreAllMocks()
})

function card() {
  const host = document.createElement('div')
  host.innerHTML =
    '<form style="padding:24px"><h2>Sign in</h2><p>Welcome back.</p><input aria-label="Email"><button type="submit">Sign in</button></form>'
  document.body.append(host)
  return { host, node: host.firstElementChild as HTMLElement }
}

afterEach(() => {
  document.body.innerHTML = ''
  document.head.querySelectorAll('style').forEach((s) => s.remove())
})

test('adds one aria-hidden overlay beside the demo and touches nothing on it', () => {
  const { host, node } = card()
  const before = host.innerHTML
  const run = blueprint(node, { reduced: false })
  const overlay = host.querySelector('[data-yj-blueprint]')!
  expect(overlay).toHaveAttribute('aria-hidden', 'true')
  expect(overlay.previousElementSibling).toBe(node)
  // the demo's own markup, attributes and inline styles are unchanged: everything on it is a Web Animation
  overlay.remove()
  expect(host.innerHTML).toBe(before)
  host.append(overlay)
  expect(animations.some((a) => a.el === node)).toBe(true)
  run.cancel()
})

test('cancel restores the demo at once: animations cancelled, overlay and stylesheet gone, finished settles', async () => {
  const { host, node } = card()
  const before = host.innerHTML
  const styles = document.head.querySelectorAll('style').length
  const run = blueprint(node, { reduced: false })
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
  const controller = new AbortController()
  blueprint(node, { reduced: false, signal: controller.signal })
  controller.abort()
  expect(host.querySelector('[data-yj-blueprint]')).toBeNull()

  blueprint(node, { reduced: false })
  node.querySelector('input')!.focus()
  expect(host.querySelector('[data-yj-blueprint]')).toBeNull()
  expect(animations.every((a) => a.cancelled)).toBe(true)
})

test('phases share out the same run: a longer finish starts earlier, the total stays', () => {
  const inkAt = (phases?: BlueprintPhases) => {
    animations = []
    const { node } = card()
    const run = blueprint(node, { reduced: false, duration: 2000, phases })
    const wipe = animations.find((a) => a.el === node && 'clipPath' in a.frames[0]!)!
    run.cancel()
    return { start: wipe.opts.delay!, end: Number(wipe.opts.delay) + Number(wipe.opts.duration) }
  }
  const usual = inkAt()
  const longFinish = inkAt({ finish: 44 })
  expect(longFinish.start).toBeLessThan(usual.start)
  expect(usual.start).toBeCloseTo(2000 * 0.78)
  // weights are normalized: doubling every share changes nothing
  expect(inkAt({ survey: 20, layout: 20, detail: 40, ink: 26, tone: 24, set: 26, finish: 44 }).start).toBeCloseTo(usual.start)
  expect(longFinish.end).toBeLessThanOrEqual(2000)
})

test('reduced motion adds nothing: no overlay, no animation, already finished', async () => {
  const { host, node } = card()
  const run = blueprint(node, { reduced: true })
  expect(host.querySelector('[data-yj-blueprint]')).toBeNull()
  expect(animations).toHaveLength(0)
  await expect(run.finished).resolves.toBeUndefined()
})

test('the run ends on its own clock and leaves nothing behind', async () => {
  const { host, node } = card()
  const run = blueprint(node, { reduced: false, duration: 1000 })
  frames.shift()!(0)
  frames.shift()!(400)
  expect(host.querySelector('[data-yj-blueprint]')).not.toBeNull()
  frames.shift()!(5000)
  expect(host.querySelector('[data-yj-blueprint]')).toBeNull()
  await expect(run.finished).resolves.toBeUndefined()
})

test('<BlueprintEntrance> plays around its first child and cancels on unmount', async () => {
  const { unmount, container } = render(
    <YoujProvider reducedMotion="never">
      <BlueprintEntrance data-testid="bp">
        <section aria-label="Plan">Pro plan</section>
      </BlueprintEntrance>
    </YoujProvider>,
  )
  await vi.waitFor(() => expect(container.querySelector('[data-yj-blueprint]')).not.toBeNull())
  expect(screen.getByRole('region', { name: 'Plan' })).toBeInTheDocument()
  expect(screen.getByTestId('bp').style.opacity).toBe('')
  unmount()
  expect(animations.every((a) => a.cancelled)).toBe(true)
})

test('<BlueprintEntrance> under reduced motion just shows its children', async () => {
  const { container } = render(
    <YoujProvider reducedMotion="always">
      <BlueprintEntrance>
        <section aria-label="Plan">Pro plan</section>
      </BlueprintEntrance>
    </YoujProvider>,
  )
  await act(async () => {})
  expect(container.querySelector('[data-yj-blueprint]')).toBeNull()
  expect(animations).toHaveLength(0)
})
