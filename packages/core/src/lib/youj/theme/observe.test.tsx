import { act } from '@testing-library/react'
import { observeThemeChange } from './observe'

/* Canvas, WebGL and Lottie code re-reads token colors when these fire, so
 * every way a theme can change has to reach them, and animated inline styles
 * must not. MutationObserver callbacks run as microtasks. */

const flush = () => act(async () => {})

function tree() {
  const html = document.documentElement
  const scope = document.createElement('div')
  scope.setAttribute('data-yj-theme', '')
  const plain = document.createElement('div')
  const host = document.createElement('div')
  scope.append(plain)
  plain.append(host)
  document.body.append(scope)
  return { html, scope, plain, host }
}

afterEach(() => {
  document.body.innerHTML = ''
  for (const name of ['data-theme', 'data-yj-theme', 'data-yj-motion', 'style', 'class']) document.documentElement.removeAttribute(name)
})

describe('observeThemeChange', () => {
  test.each([
    ['a light/dark flip on <html>', ({ html }: ReturnType<typeof tree>) => html.setAttribute('data-theme', 'dark')],
    ['a preset on <html>', ({ html }: ReturnType<typeof tree>) => html.setAttribute('data-yj-theme', 'brutal')],
    ['a motion personality on <html>', ({ html }: ReturnType<typeof tree>) => html.setAttribute('data-yj-motion', 'calm')],
    ['a contract on <html> (themeProps)', ({ html }: ReturnType<typeof tree>) => html.style.setProperty('--yj-accent', 'red')],
    ['a new contract on a scope', ({ scope }: ReturnType<typeof tree>) => scope.style.setProperty('--yj-accent', 'red')],
    ['a class switch on an ancestor', ({ plain }: ReturnType<typeof tree>) => plain.classList.add('theme-b')],
    ['an ancestor becoming a scope', ({ plain }: ReturnType<typeof tree>) => plain.setAttribute('data-yj-theme', 'hero')],
  ])('fires for %s', async (_, change) => {
    const t = tree()
    const onChange = vi.fn()
    const stop = observeThemeChange(t.host, onChange)
    change(t)
    await flush()
    expect(onChange).toHaveBeenCalledTimes(1)
    stop()
  })

  test('ignores inline style changes on ancestors that are not scopes (animations)', async () => {
    const t = tree()
    const onChange = vi.fn()
    const stop = observeThemeChange(t.host, onChange)
    t.plain.style.transform = 'translateX(4px)'
    t.host.style.opacity = '0.5'
    await flush()
    expect(onChange).not.toHaveBeenCalled()
    stop()
  })

  test('stops when disposed', async () => {
    const t = tree()
    const onChange = vi.fn()
    observeThemeChange(t.host, onChange)()
    t.html.setAttribute('data-yj-theme', 'terminal')
    t.scope.style.setProperty('--yj-accent', 'red')
    await flush()
    expect(onChange).not.toHaveBeenCalled()
  })
})
