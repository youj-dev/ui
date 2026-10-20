import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { act } from 'react'
import { hydrateRoot, type Root } from 'react-dom/client'
import { cases, HOUR } from './ssr-cases'

/* Server HTML comes from a real server render (a separate Node process with no
 * DOM, in another locale and time zone, see scripts/ssr-render.mjs), then
 * hydrates here with the clock 90 minutes on. A reduced-motion OS must not
 * change the hydration render: it applies straight after. */

const script = join(import.meta.dirname, '../../../../scripts/ssr-render.mjs')
const casesFile = join(import.meta.dirname, 'ssr-cases.tsx')
let serverHtml: Record<string, string>

beforeAll(() => {
  serverHtml = JSON.parse(execFileSync(process.execPath, [script, casesFile], { encoding: 'utf8' }))
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  // The server render is a separate Node process, which a busy machine has kept past a minute.
}, 180_000)

/** Matches `(prefers-reduced-motion: reduce)` and the boolean `(prefers-reduced-motion)`, as a browser does. */
function osReducedMotion(reduce: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query) =>
      ({
        matches: reduce && query.includes('prefers-reduced-motion') && !query.includes('no-preference'),
        media: query,
        onchange: null,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
        dispatchEvent: () => false,
      }) as MediaQueryList,
  )
}

async function hydrate(name: string) {
  const container = document.createElement('div')
  container.innerHTML = serverHtml[name]!
  document.body.append(container)
  const recoverable: unknown[] = []
  const logged = vi.spyOn(console, 'error')
  let root: Root
  vi.useFakeTimers({ toFake: ['Date'], now: HOUR + 90 * 60_000 })
  try {
    await act(async () => {
      root = hydrateRoot(container, cases[name]!(), { onRecoverableError: (error) => recoverable.push(error) })
    })
  } finally {
    vi.useRealTimers()
  }
  const errors = [...recoverable.map(String), ...logged.mock.calls.map((args) => args.map(String).join(' '))]
  logged.mockRestore()
  return {
    container,
    errors,
    unmount: () => {
      act(() => root.unmount())
      container.remove()
    },
  }
}

// Reduced first: Motion caches the OS preference on first read, so this order
// is the one that exposes a provider reading it during hydration.
describe.each([
  ['with an OS reduced-motion preference', true],
  ['without reduced motion', false],
])('hydrating server HTML %s', (_, reduce) => {
  beforeEach(() => osReducedMotion(reduce))

  test.each(Object.keys(cases))('%s', async (name) => {
    const { errors, unmount } = await hydrate(name)
    expect(errors).toEqual([])
    unmount()
  })
})

test('components pick up an OS reduced-motion preference right after hydration', async () => {
  osReducedMotion(true)
  const { container, unmount } = await hydrate('Switch')
  expect(serverHtml.Switch).not.toContain('data-reduced-motion')
  expect(container.querySelector('[data-slot="switch"]')).toHaveAttribute('data-reduced-motion')
  unmount()
})

test('times are UTC on the server and local and relative right after hydration', async () => {
  const { container, unmount } = await hydrate('Timeline')
  expect(serverHtml.Timeline).toContain('UTC')
  expect(serverHtml.Timeline).not.toContain('Today')
  expect(container.textContent).toContain('Today')
  expect(container.textContent).not.toContain('UTC')
  unmount()
})

test('components format in the provider locale, en-US without one', () => {
  expect(serverHtml.StatCard).toContain('$1,234,567.89')
  expect(serverHtml['Provider locale']).toContain('1.234.567,89')
})
