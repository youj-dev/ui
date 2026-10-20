import { act, render } from '@testing-library/react'
import { YoujProvider } from '@youj/core'
import type { MenuWave } from '@/lib/nav'
import { HeroElement } from './hero-elements'

const WAVES: MenuWave[] = [
  { label: 'Tap', ms: 50, peaks: [100, 60, 30, 10] },
  { label: 'Success', ms: 309, peaks: [80, 40, 100, 50] },
]

/* The setup's IntersectionObserver never reports a view; these elements are on screen. */
class InView {
  constructor(private callback: IntersectionObserverCallback) {}
  observe(target: Element) {
    this.callback([{ isIntersecting: true, intersectionRatio: 1, target } as unknown as IntersectionObserverEntry], this as unknown as IntersectionObserver)
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

describe('the hero’s elements', () => {
  const original = window.IntersectionObserver
  beforeEach(() => {
    window.IntersectionObserver = InView as unknown as typeof IntersectionObserver
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    window.IntersectionObserver = original
  })

  const draw = (id: Parameters<typeof HeroElement>[0]['id'], reducedMotion: 'always' | 'never' = 'never') =>
    render(
      <YoujProvider reducedMotion={reducedMotion}>
        <HeroElement id={id} waves={WAVES} />
      </YoujProvider>,
    )

  it('sounds the release’s notification as the Success cue, drawn and never played', () => {
    const { container } = draw('sound')
    expect(container).toHaveTextContent('v2.4 is live')
    expect(container).toHaveTextContent('Success · 309 ms')
    expect(container.querySelector('audio')).toBeNull()
  })

  it('keeps every element moving while it’s on screen: the notification through the cues, the switcher through the presets', () => {
    const sound = draw('sound')
    act(() => vi.advanceTimersByTime(560 * 3 + 50))
    expect(sound.container).toHaveTextContent('Tap · 50 ms')
    // The cue plays through: a sweep of the accent, on the compositor.
    expect(sound.container.querySelector('.ho-sweep')).not.toBeNull()
    sound.unmount()

    const themes = draw('themes')
    expect(themes.container).toHaveTextContent('Youj')
    act(() => vi.advanceTimersByTime(560 * 3 + 50))
    expect(themes.container).toHaveTextContent('Sandstone')
    themes.unmount()

    const curve = draw('motion')
    expect(curve.container.querySelector('.ho-run')).not.toHaveAttribute('data-still')
  })

  it('holds still in a hidden tab and under reduced motion', () => {
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    const sound = draw('sound')
    act(() => vi.advanceTimersByTime(5000))
    expect(sound.container).toHaveTextContent('Success · 309 ms')
    sound.unmount()
    hidden.mockRestore()

    const still = draw('motion', 'always')
    expect(still.container.querySelector('.ho-run')).toHaveAttribute('data-still')
    still.unmount()
    const quiet = draw('sound', 'always')
    act(() => vi.advanceTimersByTime(5000))
    expect(quiet.container).toHaveTextContent('Success · 309 ms')
    expect(quiet.container.querySelector('.ho-sweep')).toBeNull()
  })
})
