import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { LiquidGlass } from './liquid-glass'

const glass = () => document.querySelector<HTMLElement>('[data-slot=liquid-glass]')!
const pane = () => glass().querySelector<HTMLElement>('.yj-liquid__pane')!
const shine = () => glass().querySelector<HTMLElement>('.yj-liquid__shine')!

function setup(props: Parameters<typeof LiquidGlass>[0] = {}) {
  render(
    <YoujProvider reducedMotion="never">
      <LiquidGlass className="rounded-full" {...props}>
        <button type="button">Join</button>
      </LiquidGlass>
    </YoujProvider>,
  )
  // jsdom lays nothing out: give the glass a box to measure the pointer against.
  glass().getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 40, right: 200, bottom: 40, x: 0, y: 0, toJSON: () => ({}) })
}

const move = (x: number, y: number) => fireEvent.pointerMove(glass(), { clientX: x, clientY: y, pointerType: 'mouse' })

test('wraps its content, which keeps its role and name; the glass layers are hidden from assistive tech', () => {
  setup()
  expect(screen.getByRole('button', { name: 'Join' })).toBeInTheDocument()
  expect(pane()).toHaveAttribute('aria-hidden', 'true')
  expect(shine()).toHaveAttribute('aria-hidden', 'true')
  expect(glass()).toHaveClass('yj-liquid', 'rounded-full')
  expect(glass().style.getPropertyValue('--yj-liquid-blur')).toBe('12px')
})

test('leans toward the pointer and moves the highlight to it, then springs back on leave', async () => {
  setup({ bulge: 6 })
  move(200, 20)
  // The right edge is 0.5 across: the pane leans the full bulge and the highlight heads for 100%.
  await waitFor(() => expect(pane().style.transform).toMatch(/translateX\(([3-9]|1\d)(\.\d+)?px\)/))
  await waitFor(() => expect(parseFloat(shine().style.getPropertyValue('--yj-liquid-x'))).toBeGreaterThan(80))
  fireEvent.pointerLeave(glass())
  await waitFor(() => expect(parseFloat(shine().style.getPropertyValue('--yj-liquid-x'))).toBeCloseTo(30, 0), { timeout: 3000 })
})

test('a press squishes the whole glass: wider and shorter, then back', async () => {
  setup()
  fireEvent.pointerDown(glass(), { pointerType: 'mouse' })
  await waitFor(() => expect(glass().style.transform).toMatch(/scaleY\(0\.9/))
  fireEvent.pointerUp(glass(), { pointerType: 'mouse' })
  await waitFor(() => expect(glass().style.transform).not.toMatch(/scale/), { timeout: 3000 })
})

test('squish={false} keeps it from squishing', async () => {
  setup({ squish: false })
  fireEvent.pointerDown(glass(), { pointerType: 'mouse' })
  // youj-allow: sleep — proving the glass stays still has no condition to wait for, only time to give it.
  await new Promise((r) => setTimeout(r, 100))
  expect(glass().style.transform).toBe('')
})

test('touch neither leans nor moves the highlight', async () => {
  setup()
  fireEvent.pointerMove(glass(), { clientX: 200, clientY: 20, pointerType: 'touch' })
  // youj-allow: sleep — proving the glass stays still has no condition to wait for, only time to give it.
  await new Promise((r) => setTimeout(r, 100))
  expect(pane().style.transform).toBe('none')
})

test('reduced motion is static glass: no lean, no squish, the highlight at rest', async () => {
  render(
    <YoujProvider reducedMotion="always">
      <LiquidGlass>
        <button type="button">Join</button>
      </LiquidGlass>
    </YoujProvider>,
  )
  expect(glass()).toHaveAttribute('data-yj-reduced')
  move(200, 20)
  fireEvent.pointerDown(glass(), { pointerType: 'mouse' })
  // youj-allow: sleep — proving the glass stays still has no condition to wait for, only time to give it.
  await new Promise((r) => setTimeout(r, 100))
  expect(glass().style.transform).toBe('')
  expect(pane().getAttribute('style')).toBeNull()
  expect(shine().getAttribute('style')).toBeNull()
})

test('passes pointer handlers through', () => {
  const onPointerDown = vi.fn()
  const onPointerMove = vi.fn()
  setup({ onPointerDown, onPointerMove })
  fireEvent.pointerDown(glass(), { pointerType: 'mouse' })
  move(10, 10)
  expect(onPointerDown).toHaveBeenCalledOnce()
  expect(onPointerMove).toHaveBeenCalledOnce()
})
