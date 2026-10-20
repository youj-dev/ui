import { useId } from 'react'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PreviewLive } from './preview-live'

const engine = vi.hoisted(() => ({ runs: 0, cancels: 0, blueprints: 0 }))

vi.mock('@/examples', () => ({ examples: { 'test/probe': () => <p data-testid="probe">demo</p> } }))
// The engine is mocked: only that it plays, and when, is under test.
vi.mock('@/components/site/ui-generation/entrances', () => ({
  ENTRANCES: [
    { id: 'none', label: 'None', description: 'The demo is just there.' },
    {
      id: 'generate',
      label: 'Generate',
      description: 'The demo builds itself in, part by part.',
      run: async () => {
        engine.runs++
        return { cancel: () => engine.cancels++ }
      },
    },
    {
      id: 'blueprint',
      label: 'Blueprint',
      description: 'The demo is drafted as a blueprint, with its measurements, then inked in.',
      run: async () => {
        engine.blueprints++
        return { cancel: () => engine.cancels++ }
      },
    },
  ],
}))

/** An IntersectionObserver that sees everything it observes, at once. */
class SeesAll {
  constructor(private callback: IntersectionObserverCallback) {}
  observe(target: Element) {
    this.callback([{ isIntersecting: true, intersectionRatio: 1, target, intersectionRect: { height: 400 } } as unknown as IntersectionObserverEntry], this as unknown as IntersectionObserver)
  }
  unobserve() {}
  disconnect() {}
}

function Frame() {
  const id = useId()
  return <PreviewLive name="test/probe" file="probe.tsx" id={id} />
}

const entrance = () => screen.getByRole('button', { name: /^Entrance:/ })
async function pick(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(entrance())
  await user.click(await screen.findByRole('menuitemradio', { name: new RegExp(name) }))
}

describe('Entrance menu', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', SeesAll)
    engine.runs = 0
    engine.cancels = 0
    engine.blueprints = 0
  })
  afterEach(() => {
    cleanup()
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('offers None, Generate and Blueprint, each with its description, and starts on None', async () => {
    const user = userEvent.setup()
    render(<Frame />)
    expect(entrance()).toHaveAccessibleName('Entrance: None')
    await user.click(entrance())
    const menu = await screen.findByRole('menu')
    expect(within(menu).getByRole('menuitemradio', { name: /^None/ })).toHaveAttribute('aria-checked', 'true')
    expect(within(menu).getByRole('menuitemradio', { name: /^Generate/ })).toHaveTextContent('builds itself in')
    expect(within(menu).getByRole('menuitemradio', { name: /^Blueprint/ })).toHaveTextContent('drafted as a blueprint')
    expect(engine.runs).toBe(0)
  })

  it('plays Blueprint, not Generate, when Blueprint is picked', async () => {
    const user = userEvent.setup()
    render(<Frame />)
    await pick(user, 'Blueprint')
    await waitFor(() => expect(engine.blueprints).toBe(1))
    expect(engine.runs).toBe(0)
    expect(localStorage.getItem('youj-entrance')).toBe('blueprint')
  })

  it('plays the effect when Generate is picked, remembers the pick, and plays again on Replay', async () => {
    const user = userEvent.setup()
    render(<Frame />)
    await pick(user, 'Generate')
    await waitFor(() => expect(engine.runs).toBe(1))
    expect(entrance()).toHaveAccessibleName('Entrance: Generate')
    expect(localStorage.getItem('youj-entrance')).toBe('generate')
    fireEvent.click(screen.getByRole('button', { name: 'Replay' }))
    await waitFor(() => expect(engine.runs).toBe(2))
    expect(engine.cancels).toBeGreaterThan(0)
  })

  it('remembers the pick but plays it only when asked for (Replay), and None stops playing it', async () => {
    const user = userEvent.setup()
    localStorage.setItem('youj-entrance', 'generate')
    render(<Frame />)
    expect(entrance()).toHaveAccessibleName('Entrance: Generate')
    expect(engine.runs).toBe(0) // arriving on a demo shows it plainly
    fireEvent.click(screen.getByRole('button', { name: 'Replay' }))
    await waitFor(() => expect(engine.runs).toBe(1))
    await pick(user, 'None')
    expect(localStorage.getItem('youj-entrance')).toBe('none')
    expect(entrance()).toHaveAccessibleName('Entrance: None')
    fireEvent.click(screen.getByRole('button', { name: 'Replay' }))
    expect(engine.runs).toBe(1)
  })
})
