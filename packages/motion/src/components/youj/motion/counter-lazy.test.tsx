import { render, waitFor } from '@testing-library/react'
import { installObservers } from '@youj/core/test-utils'

beforeAll(installObservers)

/* A fresh copy of the modules shows what an app sees: Motion's features arrive
 * after the first render. A Counter inside ContentSwap (StatCard) or Collapse
 * sits under AnimatePresence initial={false}, which tells Motion to skip the
 * first animation of everything below it. The digits that exist at `from`
 * receive their real target before the features load, so an `m` element that
 * owns that animation would swallow it and stay put. */
async function fresh() {
  vi.resetModules()
  const [{ Counter }, { YoujProvider }, { AnimatePresence }] = await Promise.all([
    import('./counter'),
    import('@youj/core/lib/youj/provider'),
    import('motion/react'),
  ])
  return { Counter, YoujProvider, AnimatePresence }
}

/** The digit each column shows: the glyph at full opacity on its wheel. */
const rolledDigits = (root: HTMLElement) =>
  [...root.querySelectorAll<HTMLElement>('[data-wheel]')].map((wheel) => [...wheel.children].find((g) => (g as HTMLElement).style.opacity === '1')?.textContent ?? '?').join('')

test.each([0, 3, 15, 60])('rolled digits that existed at `from` still land on the value when the features load late (value after %ims)', async (delay) => {
  const { Counter, YoujProvider, AnimatePresence } = await fresh()
  const ui = (value: number) => (
    <YoujProvider reducedMotion="never">
      <AnimatePresence initial={false}>
        <Counter key="figure" mode="roll" from={0} value={value} locale="en-US" duration="instant" />
      </AnimatePresence>
    </YoujProvider>
  )
  const { container, rerender } = render(ui(0))
  // The value arrives before the chunk does: the first digit already exists at `from`.
  await new Promise((resolve) => setTimeout(resolve, delay))
  rerender(ui(12842))
  const root = container.querySelector('[data-slot="counter"]') as HTMLElement
  expect(root.querySelector('.sr-only')!.textContent).toBe('12,842')
  await waitFor(() => expect(rolledDigits(root)).toBe('12842'), { timeout: 3000 })
})
