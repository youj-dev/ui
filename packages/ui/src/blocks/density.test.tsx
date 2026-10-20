/// <reference types="vite/client" />
import type { ComponentType } from 'react'
import { render } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { NAV } from './frame/shell/data'

/* A block takes its layout density (data-yj-density, ui.css) from the page
 * around it, never from its own root: an app's root YoujProvider sets
 * compact, the provider's default is roomy, and the docs preview each kind at
 * its own (app, lifestyle, commerce and the frame compact; marketing, auth
 * and content roomy), so the preview's Size control reaches every block. An
 * app sets one block's density with a ThemeScope around it, or
 * `data-yj-density` on its root. Embedded, a block wears no floating shadow,
 * and one with a natural width (a form, a panel, a card: it declares `fill`)
 * stops at it, start-aligned in the cell, unless `fill` takes the whole cell;
 * a wide one (a dashboard, a table) fills the cell and reflows, and the
 * page's own width bounds it. */

const modules = import.meta.glob<Record<string, unknown>>(['./*/*.tsx', '!./**/*.stories.tsx', '!./**/*.test.tsx'])
const sources = import.meta.glob<string>(['./*/*.tsx', '!./**/*.stories.tsx', '!./**/*.test.tsx'], { query: '?raw', import: 'default', eager: true })

/* The page each kind is shown on (the docs' default for it). */
const COMPACT = ['app/', 'lifestyle/', 'commerce/', 'frame/shell', 'frame/screen-']
const ROOMY = ['marketing/', 'auth/', 'content/', 'forms/', 'media/', 'surveys/']
/* Not pages: parts other blocks compose, which take the density of the page around them. */
const PARTS = ['auth/shell', 'commerce/product-render']
/* Embedded, a floating widget rather than a panel in a grid cell. */
const FLOATS = ['app/support-chat']
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

/** Renders inside a page at `density`, as an app's root provider would set it. */
const reduced = (ui: React.ReactNode, density?: 'compact' | 'roomy') =>
  render(
    <YoujProvider reducedMotion="always" density={density}>
      {ui}
    </YoujProvider>,
  )

function component(name: string, mod: Record<string, unknown>) {
  if (PICK[name]) return mod[PICK[name]] as ComponentType<Record<string, unknown>>
  const found = Object.entries(mod).filter(([key, value]) => /^[A-Z][a-z]/.test(key) && typeof value === 'function')
  if (found.length !== 1) throw new Error(`${name}: pick its component in PICK (${found.map(([key]) => key).join(', ')})`)
  return found[0]![1] as ComponentType<Record<string, unknown>>
}

/** The provider's scope: what the block renders sits inside it. */
const page = (container: Element) => container.querySelector('[data-yj-reduced]')!
const blockRoot = (container: Element) => page(container).firstElementChild
const CAP = /(?:^|\s)(?:[a-z0-9-]+:)*max-w-(?!full\b|none\b)\S+/
const FLOATING = /(?:^|\s)shadow-(?:lg|xl|2xl)\b/

const cases = Object.keys(modules)
  .map((path) => path.slice(2, -4))
  .filter((name) => !PARTS.includes(name))
  .map((name) => ({
    name,
    density: COMPACT.some((g) => name.startsWith(g)) ? 'compact' : ROOMY.some((g) => name.startsWith(g)) ? 'roomy' : null,
  }))
  .filter((c): c is { name: string; density: 'compact' | 'roomy' } => c.density !== null)
  .sort((a, b) => a.name.localeCompare(b.name))

describe('block layout density', () => {
  // jsdom has no element scrolling; chat and log blocks pin their scroll on mount.
  beforeAll(() => {
    Element.prototype.scrollTo ??= () => {}
  })

  test.each(cases)('$name takes the $density page\'s density, and an app can set its own', async ({ name, density }) => {
    const Block = component(name, await modules[`./${name}.tsx`]!())
    const first = reduced(<Block {...PROPS[name]} />, density)
    expect(page(first.container).querySelector('[data-yj-density]'), `${name} sets no density of its own`).toBeNull()
    first.unmount()
    const other = density === 'compact' ? 'roomy' : 'compact'
    const set = reduced(<Block {...PROPS[name]} data-yj-density={other} />, density)
    expect(page(set.container).querySelector('[data-yj-density]'), name).toHaveAttribute('data-yj-density', other)
    set.unmount()
  })

  // The forms and media cards are shown roomy: they stop at their natural width too.
  const embeddable = cases.filter(({ name, density }) => (density === 'compact' || name.startsWith('forms/') || name.startsWith('media/')) && !FLOATS.includes(name) && /\bembedded\??:/.test(sources[`./${name}.tsx`]!))
  /** The outer panel's classes: the root's or one of its first two descendants'. */
  const outer = (container: Element) => {
    const root = blockRoot(container)!
    return [root, root.firstElementChild, root.firstElementChild?.firstElementChild].filter((el): el is Element => !!el).map((el) => el.getAttribute('class') ?? '')
  }
  test.each(embeddable)('$name, embedded, stops at its natural width unless `fill`, without a floating shadow', async ({ name }) => {
    const Block = component(name, await modules[`./${name}.tsx`]!())
    const natural = /\bfill\?: boolean/.test(sources[`./${name}.tsx`]!)
    const embedded = reduced(<Block {...PROPS[name]} embedded />, 'compact')
    expect(page(embedded.container).querySelector('[data-yj-density]'), `${name} takes the page's density`).toBeNull()
    const classes = outer(embedded.container)
    for (const c of classes) expect(c, name).not.toMatch(FLOATING)
    if (natural) expect(classes.some((c) => CAP.test(c)), `${name} stops at its natural width`).toBe(true)
    else for (const c of classes) expect(c, `${name} is wide: it fills its cell`).not.toMatch(CAP)
    embedded.unmount()
    if (!natural) return
    const filled = reduced(<Block {...PROPS[name]} embedded fill />, 'compact')
    for (const c of outer(filled.container)) expect(c, `${name} with fill`).not.toMatch(CAP)
  })
})
