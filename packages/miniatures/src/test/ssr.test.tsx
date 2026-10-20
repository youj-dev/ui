import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { act } from 'react'
import { hydrateRoot, type Root } from 'react-dom/client'
import { setMedia } from './browser'
import { cases } from './ssr-cases'

/* Server HTML comes from a real server render (a separate Node process with no
 * DOM, scripts/ssr-render.mjs, which also proves nothing touches window on
 * import), then hydrates here without a mismatch, and draws once hydrated. A
 * reduced-motion or dark OS must not change the hydration render: both are
 * resolved after it, in the figure's own shadow root. */

const script = join(import.meta.dirname, '../../../../scripts/ssr-render.mjs')
const casesFile = join(import.meta.dirname, 'ssr-cases.tsx')
let serverHtml: Record<string, string>

beforeAll(() => {
  serverHtml = JSON.parse(execFileSync(process.execPath, [script, casesFile], { encoding: 'utf8' }))
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
}, 60_000)

async function hydrate(name: string) {
  const container = document.createElement('div')
  container.innerHTML = serverHtml[name]!
  document.body.append(container)
  const recoverable: unknown[] = []
  const logged = vi.spyOn(console, 'error')
  let root: Root
  await act(async () => {
    root = hydrateRoot(container, cases[name]!(), { onRecoverableError: (error) => recoverable.push(error) })
  })
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

describe.each([
  ['with a reduced-motion, dark OS', true],
  ['with a plain OS', false],
])('hydrating server HTML %s', (_, os) => {
  beforeEach(() => setMedia({ reduce: os, dark: os }))

  test.each(Object.keys(cases))('%s', async (name) => {
    expect(serverHtml[name]).toContain('class="yjm yjm-')
    const { errors, container, unmount } = await hydrate(name)
    expect(errors).toEqual([])
    const host = container.querySelector('.yjm')!
    expect(host.shadowRoot?.querySelector('svg g')).toBeTruthy()
    unmount()
  })
})
