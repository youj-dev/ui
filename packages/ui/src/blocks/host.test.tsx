/// <reference types="vite/client" />
import type { ComponentType } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, vi } from 'vitest'
import { brutal, graphite, ThemeScope } from '@youj/core'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { NAV } from './frame/shell/data'
import { PercentileTrend } from './app/percentile-trend'

/* Blocks are copied into apps, so they follow the app they land in
 * (packages/ui/CLAUDE.md, Blocks): the theme of the provider or ThemeScope
 * around them, unless `theme` forces one; the provider's locale, unless
 * `locale` overrides it; and an action the app hasn't wired plays its demo
 * but says so, once, in development. scripts/check-blocks.mjs keeps the
 * source from regressing; these prove the behaviour. */

const modules = import.meta.glob<Record<string, unknown>>(['./*/*.tsx', '!./**/*.stories.tsx', '!./**/*.test.tsx'])
const sources = import.meta.glob<string>(['./*/*.tsx', '!./**/*.stories.tsx', '!./**/*.test.tsx'], { query: '?raw', import: 'default', eager: true })

/* Blocks with a required prop. */
const PROPS: Record<string, Record<string, unknown>> = { 'frame/shell': { nav: NAV } }
/* Entries that export more than one component name the block's own. */
const PICK: Record<string, string> = {
  'frame/shell': 'AppFrame',
  'commerce/product-card': 'ProductCard',
  'app/sound-settings': 'SoundSettings',
  'app/empty-states': 'EmptyStates',
  'app/integrations': 'Integrations',
  'app/settings': 'Settings',
}
/* Its own theme is the point: the playground themes its preview from the recipe being edited. */
const OWN_THEME = ['marketing/theme-playground']

function component(name: string, mod: Record<string, unknown>) {
  if (PICK[name]) return mod[PICK[name]] as ComponentType<Record<string, unknown>>
  const found = Object.entries(mod).filter(([key, value]) => /^[A-Z][a-z]/.test(key) && typeof value === 'function')
  if (found.length !== 1) throw new Error(`${name}: pick its component in PICK (${found.map(([key]) => key).join(', ')})`)
  return found[0]![1] as ComponentType<Record<string, unknown>>
}

/* Every block that could set a theme: one that renders a ThemeScope or writes data-yj-theme. (Frame parts render inside AppFrame and set none.) */
const names = Object.keys(modules)
  .map((path) => path.slice(2, -4))
  .filter((name) => !OWN_THEME.includes(name) && /ThemeScope|data-yj-theme/.test(sources[`./${name}.tsx`]!))
  .sort()
const themed = names.filter((name) => /\btheme\?:\s*ThemeInput\b/.test(sources[`./${name}.tsx`]!))

/** Every theme scope on the page, portals included: the attribute each ThemeScope with a theme writes. */
const scopes = () => [...document.body.querySelectorAll('[data-yj-theme]')].map((el) => el.getAttribute('data-yj-theme'))

describe('blocks inherit the app', () => {
  beforeAll(() => {
    // jsdom has no element scrolling; chat and log blocks pin their scroll on mount.
    Element.prototype.scrollTo ??= () => {}
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterAll(() => vi.restoreAllMocks())

  test.each(names)("%s takes the theme of the ThemeScope around it", async (name) => {
    const Block = component(name, await modules[`./${name}.tsx`]!())
    const view = render(
      <YoujProvider reducedMotion="always">
        <ThemeScope theme={brutal}>
          <Block {...PROPS[name]} />
        </ThemeScope>
      </YoujProvider>,
    )
    expect(new Set(scopes()), `${name} forces no theme of its own`).toEqual(new Set(['brutal']))
    view.unmount()
  })

  test.each(themed)('%s still wears a theme passed as `theme`', async (name) => {
    const Block = component(name, await modules[`./${name}.tsx`]!())
    const view = render(
      <YoujProvider reducedMotion="always">
        <ThemeScope theme={brutal}>
          <Block {...PROPS[name]} theme={graphite} />
        </ThemeScope>
      </YoujProvider>,
    )
    expect(scopes(), name).toContain('graphite')
    view.unmount()
  })
})

describe('blocks format in the app’s locale', () => {
  const footer = () => screen.getByText(/^Sampled .* of /)

  test('the provider’s locale reaches the block', () => {
    render(
      <YoujProvider reducedMotion="always" locale="de-DE">
        <PercentileTrend />
      </YoujProvider>,
    )
    expect(footer().textContent).toMatch(/Mio\./)
  })

  test('`locale` overrides the provider’s, and `copy.locale` still works', () => {
    const { rerender } = render(
      <YoujProvider reducedMotion="always" locale="de-DE">
        <PercentileTrend locale="en-US" />
      </YoujProvider>,
    )
    expect(footer().textContent).toMatch(/\dM\b/)
    rerender(
      <YoujProvider reducedMotion="always" locale="de-DE">
        <PercentileTrend copy={{ locale: 'fr-FR' }} />
      </YoujProvider>,
    )
    expect(footer().textContent).toMatch(/M de|\sM\b/)
  })

  test('without a provider locale, en-US', () => {
    render(<PercentileTrend />)
    expect(footer().textContent).toMatch(/\dM\b/)
  })
})

describe('an unwired action', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  test('stays quiet in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const user = userEvent.setup()
    render(<PercentileTrend />)
    await user.click(screen.getByRole('button', { name: 'Set alert' }))
    await screen.findByRole('button', { name: /Alert set/ })
    expect(warn).not.toHaveBeenCalled()
  })

  test('plays its demo and warns once, in development', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const user = userEvent.setup()
    render(<PercentileTrend />)
    const button = screen.getByRole('button', { name: 'Set alert' })
    await user.click(button)
    await screen.findByRole('button', { name: /Alert set/ })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Set alert' })).toBeEnabled(), { timeout: 4000 })
    await user.click(screen.getByRole('button', { name: 'Set alert' }))
    await screen.findByRole('button', { name: /Alert set/ })
    const calls = warn.mock.calls.filter(([message]) => String(message).startsWith('PercentileTrend: onSetAlert'))
    expect(calls).toEqual([["PercentileTrend: onSetAlert isn't wired; showing demo behaviour"]])
  })

  test('a wired one stays quiet', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const onSetAlert = vi.fn()
    const user = userEvent.setup()
    render(<PercentileTrend onSetAlert={onSetAlert} />)
    await user.click(screen.getByRole('button', { name: 'Set alert' }))
    await waitFor(() => expect(onSetAlert).toHaveBeenCalledWith('24h'))
    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('onSetAlert'))
  })
})
