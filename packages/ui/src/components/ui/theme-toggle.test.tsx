import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { ModeScript, YoujProvider } from '@youj/core'
import { ThemeScript, ThemeToggle } from './theme-toggle'

const html = document.documentElement
const scheme = () => html.getAttribute('data-theme')

/** A matchMedia whose dark-scheme answer the test can flip, firing `change`. */
function mockSystem(dark: boolean) {
  const original = window.matchMedia
  const listeners = new Set<() => void>()
  const media = {
    get matches() {
      return dark
    },
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  }
  window.matchMedia = ((query: string) => (query.includes('prefers-color-scheme') ? media : original(query))) as typeof window.matchMedia
  return {
    set(next: boolean) {
      dark = next
      listeners.forEach((fn) => fn())
    },
    listeners,
    restore: () => (window.matchMedia = original),
  }
}

/** Server-renders `server`, hydrates it with `client`, and collects every hydration complaint. */
function hydrate(server: ReactNode, client: ReactNode = server) {
  const container = document.body.appendChild(document.createElement('div'))
  container.innerHTML = renderToString(server)
  const errors: unknown[] = []
  const consoleError = vi.spyOn(console, 'error').mockImplementation((...args) => errors.push(args))
  let root: ReturnType<typeof hydrateRoot> | undefined
  try {
    act(() => {
      root = hydrateRoot(container, client, { onRecoverableError: (error) => errors.push(error) })
    })
  } finally {
    consoleError.mockRestore()
  }
  onTestFinished(() => {
    act(() => root?.unmount())
    container.remove()
  })
  return { container, errors }
}

beforeEach(() => {
  localStorage.clear()
  html.removeAttribute('data-theme')
  html.style.colorScheme = ''
})

describe('ThemeToggle', () => {
  test('uncontrolled, the button flips <html> between dark and light and remembers it', async () => {
    const user = userEvent.setup()
    localStorage.setItem('theme', 'dark')
    render(<ThemeToggle />)
    const toggle = screen.getByRole('button', { name: 'Dark' })
    expect(scheme()).toBe('dark')
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await user.click(toggle)
    expect(scheme()).toBe('light')
    expect(html.style.colorScheme).toBe('light')
    expect(localStorage.getItem('theme')).toBe('light')
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await user.keyboard('{Enter}')
    expect(scheme()).toBe('dark')
  })

  test('in system mode it follows the system, and a press picks the opposite of what is shown', async () => {
    const user = userEvent.setup()
    const system = mockSystem(true)
    try {
      render(<ThemeToggle />)
      expect(scheme()).toBe('dark')
      act(() => system.set(false))
      expect(scheme()).toBe('light')
      // The attribute's MutationObserver reports in a microtask.
      await act(async () => {})
      expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'false')
      await user.click(screen.getByRole('button', { name: 'Dark' }))
      expect(localStorage.getItem('theme')).toBe('dark')
      expect(scheme()).toBe('dark')
      // An explicit choice no longer follows the system.
      act(() => system.set(false))
      expect(scheme()).toBe('dark')
    } finally {
      system.restore()
    }
  })

  test('the segmented variant offers Light, Dark and System', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle variant="segmented" />)
    expect(screen.getByRole('group', { name: 'Theme' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'System' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: 'Light' }))
    expect(scheme()).toBe('light')
    expect(localStorage.getItem('theme')).toBe('light')
    expect(screen.getByRole('button', { name: 'Light' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'System' })).toHaveAttribute('aria-pressed', 'false')
  })

  test('controlled (next-themes), it reports the choice and leaves <html> and storage to the owner', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    html.setAttribute('data-theme', 'dark')
    render(<ThemeToggle value="system" onValueChange={onValueChange} />)
    await user.click(screen.getByRole('button', { name: 'Dark' }))
    expect(onValueChange).toHaveBeenCalledWith('light')
    expect(scheme()).toBe('dark')
    expect(localStorage.getItem('theme')).toBeNull()
    // The owner writes the attribute; the toggle follows it.
    act(() => html.setAttribute('data-theme', 'light'))
    await act(async () => {})
    expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'false')
  })

  test('a controlled explicit mode is what it shows, whatever <html> says (a scoped preview)', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    html.setAttribute('data-theme', 'dark')
    render(<ThemeToggle value="light" onValueChange={onValueChange} />)
    expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'false')
    await user.click(screen.getByRole('button', { name: 'Dark' }))
    expect(onValueChange).toHaveBeenCalledWith('dark')
  })

  test('while the mode is unknown (next-themes before mount) it shows no state and ignores presses', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<ThemeToggle value={undefined} onValueChange={onValueChange} />)
    const toggle = screen.getByRole('button', { name: 'Dark' })
    expect(toggle).not.toHaveAttribute('aria-pressed')
    await user.click(toggle)
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test('the server render shows no choice, so hydration matches whatever the client stored', () => {
    const markup = renderToString(
      <>
        <ThemeToggle />
        <ThemeToggle variant="segmented" />
      </>,
    )
    expect(markup).not.toContain('aria-pressed="true"')
  })

  describe('hydration', () => {
    // next-themes gives `undefined` on the server but the stored theme (or defaultTheme) on the client's first render.
    test.each([
      ['dark', 'dark', 'true'],
      ['light', 'light', 'false'],
      ['system', 'light', 'false'],
    ] as const)('controlled by a stored %s theme, it hydrates without a mismatch', (value, onHtml, pressed) => {
      html.setAttribute('data-theme', onHtml)
      const onValueChange = vi.fn()
      const { container, errors } = hydrate(
        <ThemeToggle value={undefined} onValueChange={onValueChange} />,
        <ThemeToggle value={value} onValueChange={onValueChange} />,
      )
      expect(errors).toEqual([])
      // After mount it reflects the value.
      expect(container.querySelector('button')).toHaveAttribute('aria-pressed', pressed)
    })

    test('uncontrolled with a stored choice, both variants hydrate without a mismatch', () => {
      localStorage.setItem('theme', 'light')
      html.setAttribute('data-theme', 'light')
      const tree = (
        <>
          <ThemeToggle />
          <ThemeToggle variant="segmented" />
        </>
      )
      const { container, errors } = hydrate(tree)
      expect(errors).toEqual([])
      expect(container.querySelector('[data-slot="theme-toggle"]')).toHaveAttribute('aria-pressed', 'false')
      expect(container.querySelector('button[aria-label="Light"]')).toHaveAttribute('aria-pressed', 'true')
    })

    test('the segmented variant hydrates under a controlled stored value', () => {
      const { container, errors } = hydrate(
        <ThemeToggle variant="segmented" value={undefined} onValueChange={() => {}} />,
        <ThemeToggle variant="segmented" value="dark" onValueChange={() => {}} />,
      )
      expect(errors).toEqual([])
      expect(container.querySelector('button[aria-label="Dark"]')).toHaveAttribute('aria-pressed', 'true')
    })

    test('before mount the button draws both marks for CSS to pick from <html>, in one icon box', () => {
      const doc = document.createElement('div')
      doc.innerHTML = renderToString(<ThemeToggle value="dark" onValueChange={() => {}} />)
      const placeholder = doc.querySelector('[data-slot="theme-toggle-placeholder"]')!
      expect(placeholder).toHaveAttribute('aria-hidden', 'true')
      expect(placeholder.querySelectorAll('svg')).toHaveLength(2)
      expect(doc.querySelector('button')).not.toHaveAttribute('aria-pressed')
    })
  })

  test('another tab’s choice arrives through the storage event', async () => {
    render(<ThemeToggle variant="segmented" />)
    localStorage.setItem('theme', 'dark')
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'theme' })))
    expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true')
    expect(scheme()).toBe('dark')
  })

  test('unmounting removes its listeners', () => {
    const system = mockSystem(false)
    const remove = vi.spyOn(window, 'removeEventListener')
    try {
      const { unmount } = render(<ThemeToggle />)
      unmount()
      expect(system.listeners.size).toBe(0)
      expect(remove).toHaveBeenCalledWith('storage', expect.any(Function))
    } finally {
      remove.mockRestore()
      system.restore()
    }
  })
})

describe('with ModeScript and YoujProvider mode="system", as the Theming page sets it up', () => {
  const runScript = (markup: string) => new Function(new DOMParser().parseFromString(markup, 'text/html').querySelector('script')!.textContent!)()
  const app = (
    <YoujProvider mode="system">
      <ThemeToggle />
      <ThemeToggle variant="segmented" />
    </YoujProvider>
  )

  test('the toggle wins over the provider, and the choice survives a remount and a reload', async () => {
    const user = userEvent.setup()
    const system = mockSystem(false)
    try {
      runScript(renderToString(<ModeScript mode="system" />))
      expect(scheme()).toBe('light')
      const first = render(app)
      const toggle = () => document.querySelector('button[data-slot="theme-toggle"]')!
      expect(toggle()).toHaveAttribute('aria-pressed', 'false')
      expect(screen.getByRole('button', { name: 'System' })).toHaveAttribute('aria-pressed', 'true')

      await user.click(toggle())
      expect(scheme()).toBe('dark')
      expect(localStorage.getItem('theme')).toBe('dark')
      expect(toggle()).toHaveAttribute('aria-pressed', 'true')
      // The provider follows the choice, not the OS.
      act(() => system.set(false))
      expect(scheme()).toBe('dark')
      expect(first.container.querySelector('[data-theme="light"]')).toBeNull()

      first.unmount()
      render(app)
      expect(scheme()).toBe('dark')
      expect(toggle()).toHaveAttribute('aria-pressed', 'true')
      cleanup()

      // A reload: a fresh document, ModeScript before paint, then hydration.
      html.removeAttribute('data-theme')
      runScript(renderToString(<ModeScript mode="system" />))
      expect(scheme()).toBe('dark')
      const { container, errors } = hydrate(app)
      expect(errors).toEqual([])
      expect(scheme()).toBe('dark')
      expect(container.querySelector('button[data-slot="theme-toggle"]')).toHaveAttribute('aria-pressed', 'true')
      expect(container.querySelector('[data-slot="segmented-control"] button[aria-label="Dark"]')).toHaveAttribute('aria-pressed', 'true')

      await user.click(container.querySelector('button[aria-label="Light"]')!)
      expect(scheme()).toBe('light')
      expect(localStorage.getItem('theme')).toBe('light')
    } finally {
      system.restore()
    }
  })

  test('with nothing stored, the toggles default to the provider’s mode', () => {
    render(
      <YoujProvider mode="light">
        <ThemeToggle variant="segmented" />
      </YoujProvider>,
    )
    expect(scheme()).toBe('light')
    expect(screen.getByRole('button', { name: 'Light' })).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('ThemeScript', () => {
  const run = (markup: string) => {
    const code = new DOMParser().parseFromString(markup, 'text/html').querySelector('script')!.textContent!
    new Function(code)()
  }

  test('sets data-theme from the stored choice before paint', () => {
    localStorage.setItem('my-theme', 'light')
    run(renderToString(<ThemeScript storageKey="my-theme" />))
    expect(scheme()).toBe('light')
    expect(html.style.colorScheme).toBe('light')
  })

  test('falls back to the default, resolving system through the media query', () => {
    const system = mockSystem(true)
    try {
      run(renderToString(<ThemeScript />))
      expect(scheme()).toBe('dark')
    } finally {
      system.restore()
    }
  })

  test('a key cannot close the script', () => {
    const markup = renderToString(<ThemeScript storageKey="</script><script>alert(1)//" />)
    expect(markup.match(/<script/g)).toHaveLength(1)
  })
})
