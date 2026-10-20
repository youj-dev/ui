import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { prerender } from 'react-dom/static'
import { hydrateRoot } from 'react-dom/client'
import { createContext, useLayoutEffect, useState } from 'react'
import { deferHydration } from './defer-hydration'

/** Counts on the element itself what React delivered to it: its clicks and its keys. */
function Counter({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={(e) => ((e.currentTarget.dataset.pressed = 'yes'), (e.currentTarget.dataset.clicks = String(Number(e.currentTarget.dataset.clicks ?? 0) + 1)))}
      onKeyDown={(e) => (e.currentTarget.dataset.keys = `${e.currentTarget.dataset.keys ?? ''}${e.key};`)}
    >
      {label}
    </button>
  )
}

/** A deferred Counter for the browser, and how many times it asked for its code; the server's is its own, as in its own bundle. */
function setup(options: Parameters<typeof deferHydration>[1]) {
  const load = vi.fn(async () => Counter)
  return { load, Deferred: deferHydration(load, options), Server: deferHydration(async () => Counter, options) }
}

/** `ui` prerendered as the build does it (no window, Suspense awaited), then hydrated in a container like a page. */
async function hydrate(server: React.ReactElement, ui: React.ReactElement) {
  const container = document.createElement('div')
  const win = globalThis.window
  // @ts-expect-error: the server has no window
  delete globalThis.window
  let markup: string
  try {
    const { prelude } = await prerender(server)
    markup = await new Response(prelude).text()
  } finally {
    globalThis.window = win
  }
  container.innerHTML = markup
  document.body.append(container)
  const html = container.innerHTML
  // Outside act(), which would force a waiting boundary to settle: the browser leaves it waiting.
  hydrateRoot(container, ui)
  await settle()
  return { container, html }
}

/** Lets React's pending work and the loader's promises run: a few macrotasks, not a wall-clock wait. */
const settle = async () => {
  for (let i = 0; i < 5; i++) await new Promise((resolve) => setTimeout(resolve, 0))
}
const flush = settle

describe('deferHydration', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
  })

  it('renders in full on the server, and keeps that markup untouched until it is wanted', async () => {
    const { load, Deferred, Server } = setup({ intent: true })
    const { container, html } = await hydrate(<Server label="Copy page" />, <Deferred label="Copy page" />)
    expect(container.innerHTML).toBe(html)
    expect(screen.getByRole('button', { name: 'Copy page' })).toBeInTheDocument()
    expect(load).not.toHaveBeenCalled()
  })

  it('fetches its code when pointed at or focused, and hydrates in place', async () => {
    const { load, Deferred, Server } = setup({ intent: true })
    const { container } = await hydrate(<Server label="Copy page" />, <Deferred label="Copy page" />)
    fireEvent.focusIn(screen.getByRole('button'))
    await waitFor(() => expect(load).toHaveBeenCalledTimes(1))
    await flush()
    // Hydrated: React's handler is live on the server's button, which is still the same one.
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('button')).toHaveAttribute('data-pressed', 'yes')
    expect(container.querySelectorAll('button')).toHaveLength(1)
  })

  it('replays a press that lands before its code, once, on the same element', async () => {
    const { load, Deferred, Server } = setup({ view: true })
    const { container } = await hydrate(<Server label="Copy page" />, <Deferred label="Copy page" />)
    const button = screen.getByRole('button')
    fireEvent.pointerDown(button)
    const click = fireEvent.click(button)
    // React drops it (the markup isn't hydrated); its default waits for the replay.
    expect(click).toBe(false)
    expect(button).not.toHaveAttribute('data-pressed')
    await waitFor(() => expect(button).toHaveAttribute('data-clicks', '1'))
    expect(load).toHaveBeenCalledTimes(1)
    expect(container.querySelector('button')).toBe(button)
    // Live from here, and nothing replays twice.
    fireEvent.click(button)
    await waitFor(() => expect(button).toHaveAttribute('data-clicks', '2'))
  })

  it('replays a key that lands before its code, for a keyboard user', async () => {
    const { load, Deferred, Server } = setup({ view: true })
    await hydrate(<Server label="Components" />, <Deferred label="Components" />)
    const button = screen.getByRole('button')
    fireEvent.keyDown(button, { key: 'ArrowDown', code: 'ArrowDown' })
    fireEvent.keyDown(button, { key: 'Escape', code: 'Escape' })
    await waitFor(() => expect(button).toHaveAttribute('data-keys'))
    await flush()
    expect(load).toHaveBeenCalledTimes(1)
    // Only the first: the activation, not a queue of keys.
    expect(button).toHaveAttribute('data-keys', 'ArrowDown;')
    expect(button).not.toHaveAttribute('data-clicks')
  })

  it('replays a key that clicks (Enter on a button) as its click alone', async () => {
    const { Deferred, Server } = setup({ view: true })
    await hydrate(<Server label="Copy page" />, <Deferred label="Copy page" />)
    const button = screen.getByRole('button')
    fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' })
    fireEvent.click(button)
    await waitFor(() => expect(button).toHaveAttribute('data-clicks', '1'))
    await flush()
    expect(button).toHaveAttribute('data-clicks', '1')
    expect(button).not.toHaveAttribute('data-keys')
  })

  it('replays nothing once hydrated: a press after its code is delivered once, by React', async () => {
    const { load, Deferred, Server } = setup({ intent: true })
    await hydrate(<Server label="Copy page" />, <Deferred label="Copy page" />)
    const button = screen.getByRole('button')
    fireEvent.focusIn(button)
    await waitFor(() => expect(load).toHaveBeenCalledTimes(1))
    await flush()
    fireEvent.keyDown(button, { key: 'ArrowDown' })
    fireEvent.click(button)
    await waitFor(() => expect(button).toHaveAttribute('data-clicks', '1'))
    expect(button).toHaveAttribute('data-keys', 'ArrowDown;')
  })

  it('keeps its markup on screen when a context above it changes before its code is in', async () => {
    const { load, Deferred, Server } = setup({ intent: true })
    // A provider whose value settles after mount, as the site's root providers do (the theme, the motion personality).
    const Context = createContext(0)
    function Root({ children }: { children: React.ReactNode }) {
      const [value, setValue] = useState(0)
      useLayoutEffect(() => setValue(1), [])
      return <Context value={value}>{children}</Context>
    }
    const { container } = await hydrate(
      <Root>
        <Server label="Copy page" />
      </Root>,
      <Root>
        <Deferred label="Copy page" />
      </Root>,
    )
    expect(screen.getByRole('button', { name: 'Copy page' })).toBeInTheDocument()
    expect(load).not.toHaveBeenCalled()
    // Once it's wanted, it comes in live, still once.
    fireEvent.focusIn(screen.getByRole('button'))
    await waitFor(() => expect(load).toHaveBeenCalledTimes(1))
    await flush()
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('button')).toHaveAttribute('data-pressed', 'yes')
    expect(container.querySelectorAll('button')).toHaveLength(1)
  })

  it('replays a press on that kept markup on the fresh element', async () => {
    const { Deferred, Server } = setup({ intent: true })
    const Context = createContext(0)
    function Root({ children }: { children: React.ReactNode }) {
      const [value, setValue] = useState(0)
      useLayoutEffect(() => setValue(1), [])
      return <Context value={value}>{children}</Context>
    }
    await hydrate(
      <Root>
        <Server label="Copy page" />
      </Root>,
      <Root>
        <Deferred label="Copy page" />
      </Root>,
    )
    const kept = screen.getByRole('button')
    fireEvent.pointerDown(kept)
    fireEvent.click(kept)
    await waitFor(() => expect(screen.getByRole('button')).toHaveAttribute('data-clicks', '1'))
  })

  it('fetches its code once the page is idle', async () => {
    let idle: (() => void) | undefined
    vi.stubGlobal('requestIdleCallback', (callback: () => void) => ((idle = callback), 1))
    vi.stubGlobal('cancelIdleCallback', () => {})
    const { load, Deferred, Server } = setup({ idle: true })
    await hydrate(<Server label="Menu" />, <Deferred label="Menu" />)
    expect(load).not.toHaveBeenCalled()
    idle?.()
    await waitFor(() => expect(load).toHaveBeenCalledTimes(1))
  })

  it('never fetches while its media query does not match, the desktop menus on a phone', async () => {
    const { load, Deferred, Server } = setup({ intent: true, idle: true, media: '(min-width: 48rem)' })
    await hydrate(<Server label="Components" />, <Deferred label="Components" />)
    fireEvent.focusIn(screen.getByRole('button'))
    await flush()
    expect(load).not.toHaveBeenCalled()
  })

  it('loads straight away when there is no server markup to keep, after a client navigation', async () => {
    const { load, Deferred } = setup({ intent: true })
    render(<Deferred label="Copy page" />)
    expect(await screen.findByRole('button', { name: 'Copy page' })).toBeInTheDocument()
    expect(load).toHaveBeenCalledTimes(1)
  })
})
