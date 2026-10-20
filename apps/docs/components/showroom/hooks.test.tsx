import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { RootProvider, useTheme } from 'fumadocs-ui/provider/base'
import { YoujProvider, type ReducedMotionSetting } from '@youj/core/lib/youj/provider'
import { pick, useArrowStepping, useRevealHero, useShowroomSelection, useStageScheme, writeParam } from './hooks'

const ITEMS = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]

const youj =
  (reduced: ReducedMotionSetting = 'never') =>
  ({ children }: { children: ReactNode }) => <YoujProvider reducedMotion={reduced}>{children}</YoujProvider>

beforeEach(() => {
  localStorage.clear()
  window.history.replaceState(null, '', '/lab/specimens')
})
afterEach(() => document.documentElement.removeAttribute('dir'))

describe('pick and writeParam', () => {
  it('picks the named item, else the fallback, else the first, else none', () => {
    expect(pick(ITEMS, 'b', 'c')).toBe('b')
    expect(pick(ITEMS, 'x', 'c')).toBe('c')
    expect(pick(ITEMS, null)).toBe('a')
    expect(pick([], 'a')).toBeNull()
  })

  it('names the item in the address under its own param, keeping the rest, and drops it', () => {
    window.history.replaceState(null, '', '/lab/specimens?theme=dark')
    writeParam('specimen', 'b')
    expect(window.location.search).toBe('?theme=dark&specimen=b')
    writeParam('specimen', null)
    expect(window.location.search).toBe('?theme=dark')
  })
})

describe('useShowroomSelection', () => {
  it('starts on the item the address named and steps round from it, writing the address', () => {
    const { result } = renderHook(() => useShowroomSelection({ items: ITEMS, param: 'specimen', initial: 'a', fallback: 'b' }))
    expect(result.current).toMatchObject({ selected: 'a', index: 0, item: ITEMS[0], prev: ITEMS[2], next: ITEMS[1] })
    act(() => result.current.select('c'))
    expect(result.current).toMatchObject({ selected: 'c', prev: ITEMS[1], next: ITEMS[0] })
    expect(window.location.search).toBe('?specimen=c')
  })

  it('falls back for an unknown name and drops it from the address', () => {
    window.history.replaceState(null, '', '/lab/specimens?specimen=x')
    const { result } = renderHook(() => useShowroomSelection({ items: ITEMS, param: 'specimen', initial: 'x', fallback: 'b' }))
    expect(result.current.selected).toBe('b')
    expect(window.location.search).toBe('')
  })

  it('has nowhere to step with a single item, and nothing selected with none', () => {
    expect(renderHook(() => useShowroomSelection({ items: [ITEMS[0]!], param: 'p', initial: null })).result.current).toMatchObject({ prev: undefined, next: undefined })
    expect(renderHook(() => useShowroomSelection({ items: [], param: 'p', initial: null })).result.current).toMatchObject({ selected: null, item: undefined })
  })
})

describe('useArrowStepping', () => {
  function Page({ onStep }: { onStep: (id: string) => void }) {
    useArrowStepping({ prev: ITEMS[0], next: ITEMS[2], onStep })
    return (
      <>
        <input aria-label="Search" />
        <ul data-showroom-grid="">
          <li>
            <a href="#b">Card</a>
          </li>
        </ul>
      </>
    )
  }

  it('steps with ← and → from the page, but not from a field, the grid or with a modifier', () => {
    const onStep = vi.fn()
    render(<Page onStep={onStep} />, { wrapper: youj() })
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    fireEvent.keyDown(document.body, { key: 'ArrowLeft' })
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'ArrowRight' })
    fireEvent.keyDown(screen.getByRole('link'), { key: 'ArrowRight' })
    fireEvent.keyDown(document.body, { key: 'ArrowRight', shiftKey: true })
    expect(onStep.mock.calls.map(([id]) => id)).toEqual(['c', 'a'])
  })

  it('mirrors right to left, and lets go on unmount', () => {
    document.documentElement.dir = 'rtl'
    const onStep = vi.fn()
    const { unmount } = render(<Page onStep={onStep} />, { wrapper: youj() })
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    expect(onStep).toHaveBeenCalledWith('a')
    unmount()
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    expect(onStep).toHaveBeenCalledTimes(1)
  })
})

describe('useRevealHero', () => {
  function Page() {
    const hero = { current: document.getElementById('hero') }
    const reveal = useRevealHero(hero, 'name')
    return <button onClick={reveal}>Reveal</button>
  }

  it.each([
    ['never', 'smooth'],
    ['always', 'instant'],
  ] as const)('with reduced motion %s, scrolls the hero in (%s) and lands focus on the name', (reduced, behavior) => {
    document.body.innerHTML = '<section id="hero"><h2 id="name" tabindex="-1">Fern</h2></section>'
    const scroll = vi.fn()
    document.getElementById('hero')!.scrollIntoView = scroll
    render(<Page />, { wrapper: youj(reduced) })
    fireEvent.click(screen.getByRole('button', { name: 'Reveal' }))
    expect(scroll).toHaveBeenCalledWith({ behavior, block: 'start' })
    expect(document.activeElement).toBe(document.getElementById('name'))
  })
})

describe('useStageScheme', () => {
  function Stage({ id }: { id: string }) {
    const { scheme, setScheme, mounted } = useStageScheme(id)
    const { setTheme } = useTheme()
    return (
      <>
        <output>{mounted ? scheme : 'unknown'}</output>
        <button onClick={() => setScheme(scheme === 'dark' ? 'light' : 'dark')}>Flip</button>
        <button onClick={() => setTheme('light')}>Site light</button>
      </>
    )
  }
  const site = ({ children }: { children: ReactNode }) => (
    <RootProvider theme={{ defaultTheme: 'dark', enableSystem: false }} search={{ enabled: false }}>
      {children}
    </RootProvider>
  )

  it('follows the site’s theme; an override holds until the item or the site’s theme changes', () => {
    const { rerender } = render(<Stage id="a" />, { wrapper: site })
    const scheme = () => screen.getByRole('status').textContent
    expect(scheme()).toBe('dark')
    fireEvent.click(screen.getByRole('button', { name: 'Flip' }))
    expect(scheme()).toBe('light')
    rerender(<Stage id="b" />)
    expect(scheme()).toBe('dark')
    fireEvent.click(screen.getByRole('button', { name: 'Flip' }))
    expect(scheme()).toBe('light')
    fireEvent.click(screen.getByRole('button', { name: 'Site light' }))
    fireEvent.click(screen.getByRole('button', { name: 'Flip' }))
    expect(scheme()).toBe('dark')
    rerender(<Stage id="b" />)
    expect(scheme()).toBe('dark')
  })
})
