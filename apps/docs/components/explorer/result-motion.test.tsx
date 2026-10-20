import { render } from '@testing-library/react'
import { useRef, type ReactNode } from 'react'
import { YoujProvider, type ReducedMotionSetting } from '@youj/core/lib/youj/provider'
import { useResultMotion } from './result-motion'

/* The explorers' result changes: leavers fade away as clones where they stood,
 * stayers slide from where they were, arrivals rise in; reduced motion and a
 * change hard on the last one swap at once. jsdom has no layout and no Web
 * Animations, so cards sit where their data-x/-y say and animate() is a spy. */

type Item = { id: string }
const items = (...ids: string[]): Item[] => ids.map((id) => ({ id }))

/** Three to a row, 100px apart. */
function Grid({ list }: { list: Item[] }) {
  const grid = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const shown = useResultMotion(list, grid, scroller)
  return (
    <div ref={scroller}>
      <div ref={grid}>
        {shown.map((item, i) => (
          <div key={item.id} data-id={item.id} data-x={(i % 3) * 100} data-y={Math.floor(i / 3) * 100} />
        ))}
      </div>
    </div>
  )
}

const original = HTMLElement.prototype.getBoundingClientRect
const animate = vi.fn()
beforeEach(() => {
  HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
    const x = Number(this.dataset.x ?? 0)
    const y = Number(this.dataset.y ?? 0)
    const size = this.dataset.x === undefined ? 1000 : 90
    return { x, y, left: x, top: y, width: size, height: size, right: x + size, bottom: y + size, toJSON: () => ({}) } as DOMRect
  }
  animate.mockReset()
  animate.mockImplementation(() => ({ finished: new Promise(() => {}), finish: vi.fn() }))
  ;(Element.prototype as unknown as { animate: unknown }).animate = animate
})
afterEach(() => {
  HTMLElement.prototype.getBoundingClientRect = original
  delete (Element.prototype as unknown as { animate?: unknown }).animate
})

function mount(list: Item[], reduced: ReducedMotionSetting = 'never') {
  const wrapper = ({ children }: { children: ReactNode }) => <YoujProvider reducedMotion={reduced}>{children}</YoujProvider>
  return render(<Grid list={list} />, { wrapper })
}

/** Each animate() call as the element's id (a clone has none) and its keyframes' properties. */
const calls = () =>
  animate.mock.calls.map(([frames], i) => {
    const el = animate.mock.contexts[i] as HTMLElement
    return { id: el.dataset.id ?? 'clone', frames: frames as Record<string, unknown>[] }
  })

test('leavers fade where they stood, stayers slide from where they were, arrivals rise in', async () => {
  const { rerender } = mount(items('a', 'b', 'c', 'd'))
  // Past the "typing" window since the first render.
  await new Promise((r) => setTimeout(r, 250))
  rerender(<Grid list={items('a', 'c', 'e')} />)
  const all = calls()
  // b and d leave: two clones fade out.
  expect(all.filter((c) => c.id === 'clone').map((c) => c.frames.at(-1)!.opacity)).toEqual([0, 0])
  // c moved from the third place to the second: it slides 100px back along the row.
  expect(all.find((c) => c.id === 'c')!.frames[0]).toEqual({ translate: '100px 0px' })
  // a stayed put: nothing moves it.
  expect(all.some((c) => c.id === 'a')).toBe(false)
  // e arrives: from transparent, a step low.
  expect(all.find((c) => c.id === 'e')!.frames[0]).toMatchObject({ opacity: 0, translate: '0 8px' })
})

test('reduced motion swaps the results at once', async () => {
  const { rerender, container } = mount(items('a', 'b', 'c'), 'always')
  await new Promise((r) => setTimeout(r, 250))
  rerender(<Grid list={items('c', 'd')} />)
  expect(animate).not.toHaveBeenCalled()
  expect([...container.querySelectorAll('[data-id]')].map((el) => (el as HTMLElement).dataset.id)).toEqual(['c', 'd'])
})

test('a change hard on the last one (typing) lands at once', async () => {
  const { rerender } = mount(items('a', 'b', 'c'))
  await new Promise((r) => setTimeout(r, 250))
  rerender(<Grid list={items('b', 'c')} />)
  animate.mockClear()
  rerender(<Grid list={items('c')} />)
  expect(animate).not.toHaveBeenCalled()
})

test('the same cards in a new list change nothing', async () => {
  const { rerender } = mount(items('a', 'b'))
  await new Promise((r) => setTimeout(r, 250))
  rerender(<Grid list={items('a', 'b')} />)
  expect(animate).not.toHaveBeenCalled()
})
