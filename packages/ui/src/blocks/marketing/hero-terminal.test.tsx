import { forwardRef } from 'react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { brutal } from '@youj/core'
import { HeroTerminal } from './hero-terminal'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('HeroTerminal', () => {
  test('names the section by its h1 and leads with the install call to action', () => {
    reduced(<HeroTerminal />)
    const title = screen.getByRole('heading', { level: 1, name: 'One command from commit to production' })
    expect(screen.getByRole('region', { name: title.textContent! })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Install the CLI' })).toHaveAttribute('href', '#install')
  })

  test('the transcript is a picture: hidden from assistive tech, complete under reduced motion, with no Replay', () => {
    const { container } = reduced(<HeroTerminal />)
    const transcript = container.querySelector('[inert]')!
    expect(transcript).toHaveAttribute('aria-hidden', 'true')
    expect(transcript).toHaveTextContent('npx northwind deploy')
    expect(transcript).toHaveTextContent('https://acme.shop')
    expect(screen.queryByRole('button', { name: /Replay/ })).not.toBeInTheDocument()
  })

  test('the site it deploys is decoration, there at once under reduced motion; preview replaces it or null leaves it out', () => {
    const { container, unmount } = reduced(<HeroTerminal />)
    const site = container.querySelector('[data-slot="terminal-site"]')!
    expect(site).toHaveAttribute('data-state', 'live')
    expect(site).toHaveAttribute('aria-hidden', 'true')
    expect(site).toHaveAttribute('inert')
    expect(site).toHaveTextContent('acme.shop')
    unmount()
    const custom = reduced(<HeroTerminal preview={<span>ledgerly.app</span>} />)
    expect(custom.container.querySelector('[data-slot="terminal-site"]')).toHaveTextContent('ledgerly.app')
    custom.unmount()
    const none = reduced(<HeroTerminal preview={null} />)
    expect(none.container.querySelector('[data-slot="terminal-site"]')).toBeNull()
  })

  test('copying the install command morphs the button to Copied', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn(() => Promise.resolve())
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    reduced(<HeroTerminal />)
    await user.click(screen.getByRole('button', { name: 'Copy install command' }))
    expect(writeText).toHaveBeenCalledWith('npm i -g northwind')
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()
  })

  test('with motion, Replay restarts the transcript, and unmounting clears its timers', () => {
    vi.useFakeTimers()
    const observe = vi.fn()
    // Report every observed element as in view, so the transcript starts.
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(private cb: IntersectionObserverCallback) {}
        observe = (el: Element) => {
          observe(el)
          this.cb([{ isIntersecting: true, target: el, intersectionRatio: 1 } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
        }
        unobserve() {}
        disconnect() {}
      },
    )
    const { container, unmount } = render(
      <YoujProvider reducedMotion="never">
        <HeroTerminal />
      </YoujProvider>,
    )
    const transcript = () => container.querySelector('[inert]')!.textContent
    const site = () => container.querySelector('[data-slot="terminal-site"]')!
    expect(site()).toHaveAttribute('data-state', 'pending')
    act(() => vi.advanceTimersByTime(20_000))
    expect(transcript()).toContain('https://acme.shop')
    // Once it's live, the site it deployed lands on the terminal.
    expect(site()).toHaveAttribute('data-state', 'live')
    act(() => screen.getByRole('button', { name: /Replay/ }).click())
    act(() => vi.advanceTimersByTime(1))
    expect(transcript()).not.toContain('acme.shop')
    expect(site()).toHaveAttribute('data-state', 'pending')
    unmount()
    expect(vi.getTimerCount()).toBe(0)
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  test('embedded, the title is an h2 and the host lays it out; a theme wraps it in a ThemeScope', () => {
    const { container } = reduced(<HeroTerminal embedded theme={brutal} />)
    expect(screen.getByRole('heading', { level: 2, name: 'One command from commit to production' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument()
    expect(container.querySelector('section')).not.toHaveClass('bg-canvas')
    expect(container.querySelector('[data-yj-theme] > section')).toBeInTheDocument()
  })

  test('command, transcript, install, copy and calls to action replace the demo', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn(() => Promise.resolve())
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    const onCopyCommand = vi.fn()
    const onClick = vi.fn((e: React.MouseEvent) => e.preventDefault())
    const RouterLink = forwardRef<HTMLAnchorElement, React.ComponentProps<'a'>>((props, ref) => <a ref={ref} data-router="" {...props} />)
    const { container } = reduced(
      <HeroTerminal
        id="cli"
        copy={{ headline: 'Reconcile from your terminal', description: 'Run ledgerly sync.', cwd: '~/fernhill', copyAria: 'Copy the install line' }}
        command="ledgerly sync"
        transcript={[
          { tone: 'muted', text: 'Ledgerly CLI 1.0' },
          { tone: 'ok', text: 'Matched 214 payments' },
        ]}
        install="brew install ledgerly"
        onCopyCommand={onCopyCommand}
        primaryCta={{ label: 'Get the CLI', href: '/cli', onClick }}
        secondaryCta={null}
        linkComponent={RouterLink}
      />,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Reconcile from your terminal' })).toBeInTheDocument()
    expect(container.querySelector('section')).toHaveAttribute('id', 'cli')
    const transcript = container.querySelector('[inert]')!
    expect(transcript).toHaveTextContent('ledgerly sync')
    expect(transcript).toHaveTextContent('✓Matched 214 payments')
    expect(transcript).not.toHaveTextContent('acme')
    expect(container).toHaveTextContent('~/fernhill')
    await user.click(screen.getByRole('button', { name: 'Copy the install line' }))
    expect(writeText).toHaveBeenCalledWith('brew install ledgerly')
    expect(onCopyCommand).toHaveBeenCalledWith('brew install ledgerly')
    expect(screen.getAllByRole('link')).toHaveLength(1)
    await user.click(screen.getByRole('link', { name: 'Get the CLI' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  test('install null hides the install command', () => {
    reduced(<HeroTerminal install={null} />)
    expect(screen.queryByRole('button', { name: 'Copy install command' })).not.toBeInTheDocument()
  })
})
