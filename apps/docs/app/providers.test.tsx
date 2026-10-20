import { act, render } from '@testing-library/react'
import { useTheme as useColorScheme } from 'fumadocs-ui/provider/base'
import { brandHead, brandTags } from '@/lib/site-brand'
import { Providers } from './providers'

vi.mock('next/navigation', () => ({ usePathname: () => '/' }))
// Fumadocs' Next adapter only wires its router; the base provider holds the same theme.
vi.mock('fumadocs-ui/provider/next', async () => ({ RootProvider: (await import('fumadocs-ui/provider/base')).RootProvider }))

let setMode: (mode: string) => void = () => {}
function Toggle() {
  setMode = useColorScheme().setTheme
  return null
}

const color = () => document.head.querySelector('meta[name=theme-color]')!.getAttribute('content')
const icon = () => document.head.querySelector('link[type="image/svg+xml"]')!.getAttribute('href')

describe('Providers', () => {
  // A stored choice, as the header's toggle leaves; a first visit opens dark, whatever the OS (below).
  beforeEach(() => localStorage.setItem('theme', 'dark'))
  afterEach(() => localStorage.clear())

  it('opens dark on a first visit, with nothing stored, even when the OS is light', async () => {
    localStorage.clear()
    const matchMedia = window.matchMedia
    // An OS set to light: next-themes asks whether it prefers dark.
    window.matchMedia = ((query: string) => ({ ...matchMedia(query), matches: query.includes('light') })) as typeof window.matchMedia
    document.head.innerHTML = brandTags('dark')
    render(
      <Providers search={{ pillars: [], explorers: [], start: [], icons: [], install: '' } as never}>
        <Toggle />
      </Providers>,
    )
    await act(async () => {})
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(icon()).toBe(brandHead().dark.svg)
    window.matchMedia = matchMedia
  })

  it('swaps the tab icon and the browser bar’s color with every change of mode', async () => {
    const brand = brandHead()
    document.head.innerHTML = brandTags('dark')
    render(
      <Providers search={{ pillars: [], explorers: [], start: [], icons: [], install: '' } as never}>
        <Toggle />
      </Providers>,
    )
    await act(async () => {})
    expect(icon()).toBe(brand.dark.svg)
    await act(async () => setMode('light'))
    expect(icon()).toBe(brand.light.svg)
    expect(color()).toBe(brand.light.color)
    await act(async () => setMode('dark'))
    expect(icon()).toBe(brand.dark.svg)
    expect(color()).toBe(brand.dark.color)
    expect(document.documentElement).toHaveAttribute('data-yj-theme', 'basalt')
  })

  /* One style pass per switch: no transition-blocking stylesheet (two more
   * passes, adding and removing it); the mode and the preset marker are both
   * on <html> when the switch settles, and the transitions it started finish. */
  it('switches the mode in one settled pass, with the preset marker already written', async () => {
    const finish = vi.fn()
    const seen: string[] = []
    const transition = { transitionProperty: 'color', finish }
    Object.defineProperty(document, 'getAnimations', {
      configurable: true,
      value: () => {
        seen.push(`${document.documentElement.className}|${document.documentElement.getAttribute('data-yj-theme')}`)
        return [transition, { finish: vi.fn() }]
      },
    })
    render(
      <Providers search={{ pillars: [], explorers: [], start: [], icons: [], install: '' } as never}>
        <Toggle />
      </Providers>,
    )
    await act(async () => setMode('dark'))
    seen.length = 0
    const added: string[] = []
    const observer = new MutationObserver((records) => records.forEach((r) => r.addedNodes.forEach((n) => added.push(n.nodeName))))
    observer.observe(document.head, { childList: true })
    await act(async () => setMode('light'))
    await act(async () => {})
    observer.disconnect()
    expect(added).not.toContain('STYLE')
    expect(seen).toEqual(['light|graphite'])
    expect(finish).toHaveBeenCalledTimes(1)
    delete (document as { getAnimations?: unknown }).getAnimations
  })
})
