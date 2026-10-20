import { afterEach, describe, expect, it, vi } from 'vitest'
import { HERO_BUILD_SCRIPT, introPlace, playsOnLoad, SEEN, skipsIntro } from './hero-build'

const html = document.documentElement

/** Runs the inline script as the page would, for a navigation type and a screen that does or doesn't qualify. */
function runScript(navigationType: string | undefined, wide = true) {
  html.removeAttribute('data-hero-build')
  html.removeAttribute('data-hero-intro')
  vi.spyOn(performance, 'getEntriesByType').mockReturnValue(navigationType ? ([{ type: navigationType }] as unknown as PerformanceEntryList) : [])
  vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: wide } as MediaQueryList)
  new Function(HERO_BUILD_SCRIPT)()
  return html.hasAttribute('data-hero-intro')
}

afterEach(() => {
  vi.restoreAllMocks()
  html.removeAttribute('data-hero-build')
  html.removeAttribute('data-hero-intro')
  sessionStorage.clear()
})

describe('when the hero intro plays', () => {
  it('plays on a fresh load and on a reload, the first of the session', () => {
    expect(runScript('navigate')).toBe(true)
    expect(html.hasAttribute('data-hero-build')).toBe(true)
    expect(runScript('reload')).toBe(true)
    expect(playsOnLoad('reload')).toBe(true)
  })

  it('does not play when the page is restored by back or forward', () => {
    expect(runScript('back_forward')).toBe(false)
    expect(playsOnLoad('back_forward')).toBe(false)
  })

  it('plays when the browser reports no navigation entry', () => {
    expect(runScript(undefined)).toBe(true)
  })

  it('does not play on a narrow screen or under reduced motion', () => {
    expect(runScript('reload', false)).toBe(false)
  })

  it('plays once a session', () => {
    expect(runScript('navigate')).toBe(true)
    sessionStorage.setItem(SEEN, '1')
    expect(runScript('navigate')).toBe(false)
    expect(runScript('reload')).toBe(false)
  })
})

describe('what skips the intro', () => {
  const key = (init: Partial<KeyboardEvent> = {}) => ({ type: 'keydown', metaKey: false, ctrlKey: false, altKey: false, ...init })

  it('skips on any key, wheel, touch or click', () => {
    expect(skipsIntro(key())).toBe(true)
    for (const type of ['wheel', 'touchmove', 'pointerdown']) expect(skipsIntro({ ...key(), type })).toBe(true)
  })

  it('leaves browser shortcuts alone', () => {
    expect(skipsIntro(key({ metaKey: true }))).toBe(false)
    expect(skipsIntro(key({ ctrlKey: true }))).toBe(false)
  })

  it('skips on a scroll away from the top but not on the return to it', () => {
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(40)
    expect(skipsIntro({ ...key(), type: 'scroll' })).toBe(true)
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(0)
    expect(skipsIntro({ ...key(), type: 'scroll' })).toBe(false)
  })
})

describe('where the intro builds the card', () => {
  // The card's box at home (720 by 340, centered) and the heading block's bottom edge, measured on the real page.
  const at = (below: number, width: number, height: number) => {
    const card = { left: (width - 720) / 2, top: below + 140, width: 720, height: 340 }
    const p = introPlace(card, below, width, height)
    return { ...p, top: card.top + p.y + (card.height * (1 - p.scale)) / 2, bottom: card.top + p.y + (card.height * (1 + p.scale)) / 2, center: card.left + p.x + 360 }
  }

  it('builds it centered under the heading, above the Skip pill, near whole on a 1440 by 900 screen', () => {
    const p = at(445, 1440, 900)
    expect(p.scale).toBeGreaterThan(0.8)
    expect(p.center).toBe(720)
    expect(p.top).toBeGreaterThanOrEqual(445 + 40 - 0.5)
    expect(p.bottom).toBeLessThanOrEqual(900 - 128 + 0.5)
  })

  it('builds it whole on a tall screen', () => {
    expect(at(470, 1920, 1080).scale).toBe(1)
  })

  it('never builds it over the heading: a short screen scales it into the room under it, the pill in the corner', () => {
    const p = at(473, 1280, 720)
    expect(p.scale).toBeGreaterThan(0.45)
    expect(p.top).toBeGreaterThanOrEqual(473 + 40 - 0.5)
    expect(p.bottom).toBeLessThanOrEqual(720 - 40 + 0.5)
  })
})
