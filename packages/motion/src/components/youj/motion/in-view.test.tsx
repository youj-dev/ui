import { render, screen, waitFor } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Counter } from './counter'
import { Reveal } from './reveal'
import { Stagger } from './stagger'
import { TextSplit } from './text-split'

/* An observer that never reports the element as visible. */
class NeverVisible {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}
beforeAll(() => {
  globalThis.IntersectionObserver = NeverVisible as never
})

/* `inView` is the one prop for "when does it play". The observers here never
 * report an element as visible, so a component waiting for the viewport stays
 * hidden and one that plays on mount shows at once. The old spellings keep
 * working until 0.2. */

const fast = (node: React.ReactNode) => (
  <YoujProvider reducedMotion="never" timeScale={0.05}>
    {node}
  </YoujProvider>
)

describe('Reveal', () => {
  test('waits for the viewport by default, and plays on mount with inView={false}', async () => {
    render(fast(<><Reveal variant="fade" data-testid="waits">A</Reveal><Reveal variant="fade" inView={false} data-testid="mounts">B</Reveal></>))
    await waitFor(() => expect(screen.getByTestId('mounts').style.opacity).toBe('1'))
    expect(screen.getByTestId('waits').style.opacity).toBe('0')
  })
})

describe('Stagger', () => {
  test('inView={false} plays on mount', async () => {
    render(fast(<Stagger inView={false} variant="fade"><span data-testid="new">A</span></Stagger>))
    await waitFor(() => expect(screen.getByTestId('new').parentElement!.style.opacity).toBe('1'))
  })
})

describe('TextSplit', () => {
  const firstUnit = (container: HTMLElement) => container.querySelector<HTMLElement>('[aria-hidden] [data-word], [aria-hidden] > span')!

  test('waits for the viewport by default; inView={false} reveals on mount', async () => {
    const waiting = render(fast(<TextSplit variant="fade">waits</TextSplit>))
    const fresh = render(fast(<TextSplit inView={false} variant="fade">new</TextSplit>))
    await waitFor(() => expect(firstUnit(fresh.container).style.opacity).toBe('1'))
    expect(firstUnit(waiting.container).style.opacity).toBe('0')
  })
})

describe('Counter', () => {
  const shown = (container: HTMLElement) => container.querySelector('[aria-hidden]')!.textContent

  test('waits for the viewport by default, and starts at once with inView={false}', async () => {
    const waiting = render(fast(<Counter value={50} from={0} locale="en-US" />))
    const starting = render(fast(<Counter value={50} from={0} locale="en-US" inView={false} />))
    await waitFor(() => expect(shown(starting.container)).toBe('50'))
    expect(shown(waiting.container)).toBe('0')
  })
})
