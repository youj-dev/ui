import { renderToString } from 'react-dom/server'
import { act, render, screen } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import { ModeScript } from './mode'
import { ThemeScope, useMode, YoujProvider } from './provider'
import { setThemeMode } from './theme-mode'

/* The colour mode: dark unless the app says otherwise, `system` following the
 * operating system live, written to <html> by the top-level provider. */

/** A controllable `prefers-color-scheme: dark`: `set(false)` is the OS going light, firing `change` like a browser. */
function mockOsDark(initial: boolean) {
  let matches = initial
  const listeners = new Set<() => void>()
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query) =>
      ({
        get matches() {
          return query.includes('prefers-color-scheme: dark') ? matches : false
        },
        media: query,
        addEventListener: (_: string, listener: () => void) => listeners.add(listener),
        removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
      }) as unknown as MediaQueryList,
  )
  return {
    listeners,
    set(next: boolean) {
      matches = next
      act(() => listeners.forEach((listener) => listener()))
    },
  }
}

function Mode() {
  const { mode, scheme } = useMode()
  return <output>{`${mode}|${scheme}`}</output>
}

const html = document.documentElement

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
  html.removeAttribute('data-theme')
  html.style.colorScheme = ''
})

test('the default mode is dark: with no provider, and with a provider that sets none, which leaves data-theme alone', () => {
  const { unmount } = render(<Mode />)
  expect(screen.getByRole('status')).toHaveTextContent('dark|dark')
  unmount()
  const { container } = render(
    <YoujProvider>
      <Mode />
    </YoujProvider>,
  )
  expect(screen.getByRole('status')).toHaveTextContent('dark|dark')
  expect(html).not.toHaveAttribute('data-theme')
  expect(container.querySelector('[data-theme]')).toBeNull()
})

test('a provider with no mode reports what another tool wrote on <html>', () => {
  html.setAttribute('data-theme', 'light')
  render(
    <YoujProvider>
      <Mode />
    </YoujProvider>,
  )
  expect(screen.getByRole('status')).toHaveTextContent('dark|light')
  act(() => html.setAttribute('data-theme', 'dark'))
  return vi.waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('dark|dark'))
})

test('`light` and `dark` write data-theme and color-scheme on <html> and put them back on unmount', () => {
  html.setAttribute('data-theme', 'dark')
  const { unmount } = render(
    <YoujProvider mode="light">
      <Mode />
    </YoujProvider>,
  )
  expect(screen.getByRole('status')).toHaveTextContent('light|light')
  expect(html).toHaveAttribute('data-theme', 'light')
  expect(html.style.colorScheme).toBe('light')
  unmount()
  expect(html).toHaveAttribute('data-theme', 'dark')
})

test('`system` follows the operating system, live', () => {
  const os = mockOsDark(false)
  const { unmount } = render(
    <YoujProvider mode="system">
      <Mode />
    </YoujProvider>,
  )
  expect(screen.getByRole('status')).toHaveTextContent('system|light')
  expect(html).toHaveAttribute('data-theme', 'light')
  os.set(true)
  expect(screen.getByRole('status')).toHaveTextContent('system|dark')
  expect(html).toHaveAttribute('data-theme', 'dark')
  expect(html.style.colorScheme).toBe('dark')
  os.set(false)
  expect(html).toHaveAttribute('data-theme', 'light')
  unmount()
  expect(os.listeners.size).toBe(0)
})

test('on the server `system` renders dark, the palette’s default, and leaves data-theme to ModeScript so its scheme shows', () => {
  mockOsDark(false)
  const markup = renderToString(
    <YoujProvider mode="system">
      <Mode />
    </YoujProvider>,
  )
  expect(markup).toContain('system|dark')
  expect(markup).not.toContain('data-theme')
})

test('a nested provider or ThemeScope sets its own mode on its subtree, and leaves <html> to the top-level one', () => {
  const { container } = render(
    <YoujProvider mode="light">
      <ThemeScope mode="dark">
        <Mode />
      </ThemeScope>
      <Mode />
    </YoujProvider>,
  )
  expect(screen.getAllByRole('status').map((el) => el.textContent)).toEqual(['dark|dark', 'light|light'])
  expect(html).toHaveAttribute('data-theme', 'light')
  expect(container.querySelector('[data-theme="dark"] output')).not.toBeNull()
})

test('the top-level mode is a default: a stored choice (ThemeToggle, setThemeMode) wins over it, live', () => {
  localStorage.setItem('theme', 'dark')
  const { container } = render(
    <YoujProvider mode="light">
      <Mode />
    </YoujProvider>,
  )
  expect(screen.getByRole('status')).toHaveTextContent('dark|dark')
  expect(html).toHaveAttribute('data-theme', 'dark')
  act(() => setThemeMode('light'))
  expect(screen.getByRole('status')).toHaveTextContent('light|light')
  expect(html).toHaveAttribute('data-theme', 'light')
  expect(container.querySelector('[data-theme="dark"]')).toBeNull()
})

describe('ModeScript', () => {
  const run = (markup: string) => {
    // Parsed, not matched: the DOM hands back the script's text the way a browser would read it (jsdom does not run it).
    const host = document.createElement('div')
    host.innerHTML = markup
    new Function(host.querySelector('script')!.textContent!)()
  }

  test('sets data-theme and color-scheme before paint: a fixed mode as given, `system` from the OS', () => {
    run(renderToString(<ModeScript mode="light" />))
    expect(html).toHaveAttribute('data-theme', 'light')
    mockOsDark(true)
    run(renderToString(<ModeScript />))
    expect(html).toHaveAttribute('data-theme', 'dark')
    expect(html.style.colorScheme).toBe('dark')
    mockOsDark(false)
    run(renderToString(<ModeScript mode="system" />))
    expect(html).toHaveAttribute('data-theme', 'light')
  })

  test('a stored choice wins over `mode`, as it does in the provider', () => {
    localStorage.setItem('theme', 'dark')
    run(renderToString(<ModeScript mode="light" />))
    expect(html).toHaveAttribute('data-theme', 'dark')
    localStorage.setItem('theme', 'nonsense')
    run(renderToString(<ModeScript mode="light" />))
    expect(html).toHaveAttribute('data-theme', 'light')
  })

  test('carries the nonce, and cannot be closed early by what it is given', () => {
    expect(renderToString(<ModeScript nonce="abc" />)).toContain('nonce="abc"')
    // @ts-expect-error: not a mode
    expect(renderToString(<ModeScript mode="</script><script>alert(1)//" />)).not.toContain('</script><script>')
  })
})
