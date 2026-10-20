import { screen, waitFor } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { AnimatePresence } from 'motion/react'
import { Reveal, revealVariantNames } from './reveal'
import { Stagger, staggerRanks } from './stagger'
import { installObservers, liveObservers, renderFull, renderReduced } from '@youj/core/test-utils'

beforeAll(installObservers)

test.each(revealVariantNames)('reduced motion renders the %s variant in its final state', (variant) => {
  renderReduced(
    <Reveal variant={variant} data-testid="r">
      Hello
    </Reveal>,
  )
  const el = screen.getByTestId('r')
  expect(el).toHaveTextContent('Hello')
  expect(el.style.opacity === '' || el.style.opacity === '1').toBe(true)
  expect(el.style.transform === '' || el.style.transform === 'none').toBe(true)
  expect(el.style.clipPath === '' || el.style.clipPath === 'inset(0% 0% 0% 0%)').toBe(true)
})

test('starts hidden with full motion', () => {
  renderFull(
    <Reveal variant="fade" data-testid="r">
      Hello
    </Reveal>,
  )
  expect(screen.getByTestId('r').style.opacity).toBe('0')
})

test('reduced motion removes an exiting Reveal immediately', () => {
  const ui = (show: boolean) => <AnimatePresence>{show && <Reveal key="t">Toast</Reveal>}</AnimatePresence>
  const { rerender } = renderReduced(ui(true))
  expect(screen.getByText('Toast')).toBeInTheDocument()
  rerender(ui(false))
  expect(screen.queryByText('Toast')).toBeNull()
})

test('Stagger wraps plain children and keeps Reveal children, all final when reduced', () => {
  renderReduced(
    <Stagger as="ul" itemAs="li">
      <span>One</span>
      <Reveal as="li" data-testid="own">
        Two
      </Reveal>
    </Stagger>,
  )
  expect(screen.getByRole('list').children).toHaveLength(2)
  expect(screen.getByText('One').parentElement!.tagName).toBe('LI')
  expect(screen.getByTestId('own')).toHaveTextContent('Two')
})

test('blur-in settles with no filter left on the text, so it renders crisp', async () => {
  renderFull(
    <YoujProvider timeScale={0.05}>
      <Reveal variant="blur-in" inView={false} data-testid="r">
        Hello
      </Reveal>
    </YoujProvider>,
  )
  await waitFor(() => expect(screen.getByTestId('r').style.filter).toBe('none'))
})

test('stagger orders', () => {
  expect(staggerRanks(5, 'start')).toEqual([0, 1, 2, 3, 4])
  expect(staggerRanks(5, 'end')).toEqual([4, 3, 2, 1, 0])
  expect(staggerRanks(5, 'center')).toEqual([2, 1, 0, 1, 2])
  expect(staggerRanks(4, 'center')).toEqual([1, 0, 0, 1])
  const random = staggerRanks(8, 'random', 7)
  expect([...random].sort()).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
  expect(staggerRanks(8, 'random', 7)).toEqual(random)
})

test('view observers are released on unmount', () => {
  const before = liveObservers.size
  const { unmount } = renderFull(
    <Stagger>
      <Reveal>A</Reveal>
      <Reveal>B</Reveal>
    </Stagger>,
  )
  unmount()
  expect(liveObservers.size).toBe(before)
})
