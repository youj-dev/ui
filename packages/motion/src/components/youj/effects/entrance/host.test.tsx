import { act, render, screen } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { InspectorEntrance } from '../inspector/inspector'
import { LayersEntrance } from '../layers/layers'
import { RenderPassesEntrance } from '../passes/passes'

/* The wrappers on EntranceHost (jsdom has no layout, canvas or Web Animations; the looks are checked in Chromium):
 * each plays its look around its first child once the look's code has loaded, cancels on unmount, and under reduced
 * motion just shows the children. */

let animations: { cancelled: boolean }[] = []
beforeEach(() => {
  animations = []
  Element.prototype.animate = function () {
    const a = {
      cancelled: false,
      startTime: null,
      cancel() {
        this.cancelled = true
      },
    }
    animations.push(a)
    return a as unknown as Animation
  }
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 0)
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})
afterEach(() => {
  delete (Element.prototype as Partial<Element>).animate
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

const wrappers = [
  ['InspectorEntrance', InspectorEntrance, 'inspector'],
  ['LayersEntrance', LayersEntrance, 'layers'],
  ['RenderPassesEntrance', RenderPassesEntrance, 'passes'],
] as const

describe.each(wrappers)('<%s>', (_, Look, attr) => {
  it('plays around its first child and cancels on unmount', async () => {
    const { unmount, container } = render(
      <YoujProvider reducedMotion="never">
        <Look data-testid="host">
          <section aria-label="Plan">Pro plan</section>
        </Look>
      </YoujProvider>,
    )
    await vi.waitFor(() => expect(container.querySelector(`[data-yj-${attr}]`)).not.toBeNull())
    expect(screen.getByRole('region', { name: 'Plan' })).toBeInTheDocument()
    expect(screen.getByTestId('host').style.opacity).toBe('')
    unmount()
    expect(animations.every((a) => a.cancelled)).toBe(true)
  })

  it('under reduced motion just shows its children', async () => {
    const { container } = render(
      <YoujProvider reducedMotion="always">
        <Look>
          <section aria-label="Plan">Pro plan</section>
        </Look>
      </YoujProvider>,
    )
    await act(async () => {})
    expect(container.querySelector(`[data-yj-${attr}]`)).toBeNull()
    expect(animations).toHaveLength(0)
  })
})
