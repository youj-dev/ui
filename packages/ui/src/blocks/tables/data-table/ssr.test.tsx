import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { act } from 'react'
import { hydrateRoot, type Root } from 'react-dom/client'
import { cases } from './table.ssr-cases'

/* The table renders on a real server (a DOM-less Node process, the same
 * script the package's hydration tests use) and hydrates here without a
 * mismatch, with and without an OS reduced-motion preference. */

const script = join(import.meta.dirname, '../../../../../../scripts/ssr-render.mjs')
const casesFile = join(import.meta.dirname, 'table.ssr-cases.tsx')
let serverHtml: Record<string, string>

beforeAll(() => {
  serverHtml = JSON.parse(execFileSync(process.execPath, [script, casesFile], { encoding: 'utf8' }))
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  // The server render is a separate Node process, which a busy machine has kept past a minute.
}, 180_000)

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

describe.each([
  ['with an OS reduced-motion preference', true],
  ['without reduced motion', false],
])('hydrating the server-rendered table %s', (_, reduce) => {
  beforeEach(() => osReducedMotion(reduce))

  test.each(Object.keys(cases))('%s', async (name) => {
    const container = document.createElement('div')
    container.innerHTML = serverHtml[name]!
    document.body.append(container)
    const recoverable: unknown[] = []
    const logged = vi.spyOn(console, 'error')
    let root!: Root
    await act(async () => {
      root = hydrateRoot(container, cases[name]!(), { onRecoverableError: (error) => recoverable.push(error) })
    })
    const errors = [...recoverable.map(String), ...logged.mock.calls.map((args) => args.map(String).join(' '))]
    logged.mockRestore()
    expect(errors).toEqual([])
    expect(container.querySelector('[data-slot=data-table]')).toBeTruthy()
    act(() => root.unmount())
    container.remove()
  })
})
