import { act, fireEvent, render } from '@testing-library/react'
import { useRef } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SEEN, useHeroBuild } from './hero-build'

const cancel = vi.fn()
const build = vi.fn()
let finish: () => void = () => {}
vi.mock('@youj/motion/components/youj/effects/blueprint/engine', () => ({
  blueprint: (...args: unknown[]) => build(...args),
}))
vi.mock('@youj/motion/components/youj/effects/entrance/ready', () => ({ ready: async () => {} }))
vi.mock('@/components/landing/hero-elements', () => ({}))

let replay!: () => void
function Harness() {
  const ref = useRef<HTMLDivElement>(null)
  replay = useHeroBuild(ref)
  return (
    <div>
      <div ref={ref} />
    </div>
  )
}

const html = document.documentElement
const flush = (ms = 20) =>
  act(async () => {
    // youj-allow: sleep the mocked build resolves through a lazy import and idle callbacks with no observable signal to wait on
    await new Promise((r) => setTimeout(r, ms))
  })

/** Waits for the build to start (it waits for the card's DOM to go quiet first). */
const started = () => act(() => vi.waitFor(() => expect(build).toHaveBeenCalledTimes(1), { timeout: 2000 }))

beforeEach(() => {
  vi.clearAllMocks()
  for (const name of ['data-hero-build', 'data-hero-intro', 'data-hero-intro-out', 'data-hero-building']) html.removeAttribute(name)
  sessionStorage.clear()
  build.mockImplementation(() => ({
    cancel: () => {
      cancel()
      finish()
    },
    finished: new Promise<void>((r) => {
      finish = r
    }),
  }))
  Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true })
})

describe('replay in place', () => {
  it('builds the card where it is, without the veil or the lock', async () => {
    render(<Harness />)
    await act(async () => replay())
    await started()
    expect(html.hasAttribute('data-hero-intro')).toBe(false)
    fireEvent.pointerDown(window) // a click does not end a replay
    expect(cancel).not.toHaveBeenCalled()
    expect(html.hasAttribute('data-hero-building')).toBe(true)
    await act(async () => finish())
    await flush()
    expect(html.hasAttribute('data-hero-building')).toBe(false)
  })

  it('finishes at once on any scroll and hands straight back to the hero, with no catch-up', async () => {
    const built = vi.fn()
    window.addEventListener('youj:hero-built', built)
    render(<Harness />)
    await act(async () => replay())
    await started()
    expect(cancel).not.toHaveBeenCalled()
    fireEvent.wheel(window)
    expect(cancel).toHaveBeenCalledTimes(1)
    await flush()
    expect(html.hasAttribute('data-hero-building')).toBe(false)
    expect(built).not.toHaveBeenCalled()
    window.removeEventListener('youj:hero-built', built)
  })

  it('ignores a second click while it builds', async () => {
    render(<Harness />)
    await act(async () => replay())
    await started()
    await act(async () => replay())
    expect(build).toHaveBeenCalledTimes(1)
  })
})

describe('the intro', () => {
  const intro = () => {
    html.setAttribute('data-hero-build', '')
    html.setAttribute('data-hero-intro', '')
  }

  it('marks the session and builds on the veil', async () => {
    intro()
    render(<Harness />)
    await started()
    expect(sessionStorage.getItem(SEEN)).toBe('1')
  })

  it('skips to the finished page on a wheel, never leaving a half-built card', async () => {
    intro()
    render(<Harness />)
    await started()
    fireEvent.wheel(window)
    await flush()
    expect(cancel).toHaveBeenCalledTimes(1)
    expect(html.hasAttribute('data-hero-intro')).toBe(false)
    expect(html.hasAttribute('data-hero-build')).toBe(false)
  })

  it('skips on a key before the build has started', async () => {
    intro()
    render(<Harness />)
    fireEvent.keyDown(window, { key: 'Escape' })
    await flush()
    expect(html.hasAttribute('data-hero-intro')).toBe(false)
    expect(build).not.toHaveBeenCalled()
  })

  it('plays no intro without the mark (reduced motion, narrow screen, played, back/forward)', async () => {
    render(<Harness />)
    await flush(450)
    expect(build).not.toHaveBeenCalled()
  })
})
