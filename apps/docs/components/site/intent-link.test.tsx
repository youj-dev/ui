import { fireEvent, render, screen } from '@testing-library/react'
import { IntentLink } from './intent-link'

const prefetch = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({ useRouter: () => ({ prefetch }) }))

describe('IntentLink', () => {
  beforeEach(() => prefetch.mockClear())

  it('prefetches nothing until the reader shows intent', () => {
    render(<IntentLink href="/docs/a">A</IntentLink>)
    expect(prefetch).not.toHaveBeenCalled()
  })

  it('prefetches its route on hover, focus or press, once per href', () => {
    const onFocus = vi.fn()
    render(
      <>
        <IntentLink href="/docs/b" onFocus={onFocus}>B</IntentLink>
        <IntentLink href="/docs/b">B again</IntentLink>
      </>,
    )
    const link = screen.getByRole('link', { name: 'B' })
    fireEvent.pointerEnter(link)
    fireEvent.focus(link)
    fireEvent.pointerDown(screen.getByRole('link', { name: 'B again' }))
    expect(prefetch).toHaveBeenCalledTimes(1)
    expect(prefetch).toHaveBeenCalledWith('/docs/b')
    expect(onFocus).toHaveBeenCalledOnce()
  })

  it('prefetches on a press when nothing hovered first (touch)', () => {
    render(<IntentLink href="/docs/c">C</IntentLink>)
    fireEvent.pointerDown(screen.getByRole('link', { name: 'C' }))
    expect(prefetch).toHaveBeenCalledWith('/docs/c')
  })

  it('keeps a click on a rested-on page a client navigation, so the layout never reloads', () => {
    vi.useFakeTimers()
    Object.assign(HTMLScriptElement, { supports: () => true })
    render(<IntentLink href="/docs/d">D</IntentLink>)
    const d = screen.getByRole('link', { name: 'D' })
    fireEvent.pointerEnter(d, { pointerType: 'mouse' })
    vi.advanceTimersByTime(1000)
    // No prerender to take with a document load: the click is left to next/link's client routing.
    expect(document.querySelector('script[type=speculationrules]')).toBeNull()
    vi.useRealTimers()
    Reflect.deleteProperty(HTMLScriptElement, 'supports')
  })

  it('leaves external and hash links alone', () => {
    render(
      <>
        <IntentLink href="https://example.com">Out</IntentLink>
        <IntentLink href="#top">Top</IntentLink>
      </>,
    )
    fireEvent.pointerEnter(screen.getByRole('link', { name: 'Out' }))
    fireEvent.pointerEnter(screen.getByRole('link', { name: 'Top' }))
    expect(prefetch).not.toHaveBeenCalled()
  })
})
