import { useState } from 'react'
import { renderToString } from 'react-dom/server'
import { hydrateRoot } from 'react-dom/client'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import {
  Sidebar,
  SidebarCard,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from './sidebar'

function App({
  provider,
  children,
}: {
  provider?: Partial<Parameters<typeof SidebarProvider>[0]>
  children?: React.ReactNode
}) {
  return (
    <SidebarProvider {...provider}>
      <Sidebar collapsible="icon">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive tooltip="Deployments" render={<a href="#deployments" aria-current="page" />}>
                  <svg aria-hidden />
                  <span>Deployments</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Logs" render={<a href="#logs" />}>
                  <svg aria-hidden />
                  <span>Logs</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <SidebarTrigger />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}

const sidebar = () => document.querySelector('[data-slot=sidebar]')!
// `hidden`: while the mobile sheet is open, the modal hides the page (and the trigger) from AT.
const trigger = () => screen.getByRole('button', { name: 'Toggle sidebar', hidden: true })

describe('Sidebar', () => {
  test('the trigger collapses it to icons and reports the state', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(sidebar()).toHaveAttribute('data-state', 'expanded')
    expect(trigger()).toHaveAttribute('aria-expanded', 'true')
    expect(trigger()).toHaveAttribute('aria-keyshortcuts', 'Meta+B Control+B')

    await user.click(trigger())
    expect(sidebar()).toHaveAttribute('data-state', 'collapsed')
    expect(sidebar()).toHaveAttribute('data-collapsible', 'icon')
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
  })

  test('⌘B and Ctrl+B toggle it', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.keyboard('{Meta>}b{/Meta}')
    expect(sidebar()).toHaveAttribute('data-state', 'collapsed')
    await user.keyboard('{Control>}b{/Control}')
    expect(sidebar()).toHaveAttribute('data-state', 'expanded')
  })

  test('with several sidebars on a page, ⌘B toggles only the one last pressed or focused in', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <>
        <App key="a" />
        <App key="b" />
      </>,
    )
    const states = () => [...document.querySelectorAll('[data-slot=sidebar]')].map((el) => el.getAttribute('data-state'))
    const [, secondTrigger] = screen.getAllByRole('button', { name: 'Toggle sidebar' })

    // Nobody has been touched yet: the first one on the page owns it.
    await user.keyboard('{Meta>}b{/Meta}')
    expect(states()).toEqual(['collapsed', 'expanded'])

    // A press inside the second hands it over (the trigger toggles it once itself).
    await user.click(secondTrigger!)
    expect(states()).toEqual(['collapsed', 'collapsed'])
    await user.keyboard('{Meta>}b{/Meta}')
    expect(states()).toEqual(['collapsed', 'expanded'])

    // Focus moving into the first hands it back.
    act(() => screen.getAllByRole('link', { name: 'Logs' })[0]!.focus())
    await user.keyboard('{Control>}b{/Control}')
    expect(states()).toEqual(['expanded', 'expanded'])

    // Unmounting the owner falls back to the first remaining sidebar.
    rerender(<App key="b" />)
    await user.keyboard('{Meta>}b{/Meta}')
    expect(states()).toEqual(['collapsed'])
  })

  test('the shortcut is left alone while typing, on repeat and with other modifiers', async () => {
    const user = userEvent.setup()
    render(
      <App>
        <input aria-label="Title" />
      </App>,
    )
    await user.click(screen.getByRole('textbox', { name: 'Title' }))
    await user.keyboard('{Control>}b{/Control}')
    expect(sidebar()).toHaveAttribute('data-state', 'expanded')

    fireEvent.keyDown(window, { key: 'b', metaKey: true, repeat: true })
    fireEvent.keyDown(window, { key: 'b', metaKey: true, shiftKey: true })
    expect(sidebar()).toHaveAttribute('data-state', 'expanded')
  })

  test('a widget that handles ⌘B itself keeps it; a disabled control cancelling keys does not', async () => {
    const user = userEvent.setup()
    render(
      <App>
        <div role="application" aria-label="Canvas" tabIndex={0} onKeyDown={(event) => event.preventDefault()} />
        {/* What Base UI does for a pending button or a disabled tab: cancel every key but Tab. */}
        <button type="button" aria-disabled="true" onKeyDown={(event) => event.key !== 'Tab' && event.preventDefault()}>
          Saving…
        </button>
      </App>,
    )
    screen.getByRole('application', { name: 'Canvas' }).focus()
    await user.keyboard('{Meta>}b{/Meta}')
    expect(sidebar()).toHaveAttribute('data-state', 'expanded')

    screen.getByRole('button', { name: 'Saving…' }).focus()
    await user.keyboard('{Meta>}b{/Meta}')
    expect(sidebar()).toHaveAttribute('data-state', 'collapsed')
  })

  test('uncontrolled with a listener: it still toggles, and reports each change', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<App provider={{ onOpenChange }} />)
    await user.click(trigger())
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(sidebar()).toHaveAttribute('data-state', 'collapsed')
    expect(document.cookie).toContain('sidebar_state=false')
  })

  test('controlled: open decides, onOpenChange asks', async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [open, setOpen] = useState(false)
      return <App provider={{ open, onOpenChange: setOpen }} />
    }
    render(<Controlled />)
    expect(sidebar()).toHaveAttribute('data-state', 'collapsed')
    await user.click(trigger())
    expect(sidebar()).toHaveAttribute('data-state', 'expanded')
  })

  test('the current page is marked, and one decorative key sits in the content', () => {
    render(<App />)
    expect(screen.getByRole('link', { name: 'Deployments' })).toHaveAttribute('data-active')
    expect(screen.getByRole('link', { name: 'Deployments' })).toHaveAttribute('aria-current', 'page')
    const keys = document.querySelectorAll('[data-slot=sidebar-indicator]')
    expect(keys).toHaveLength(1)
    expect(keys[0]).toHaveAttribute('aria-hidden', 'true')
  })

  test('collapsing never remounts an item, so keyboard focus survives ⌘B', async () => {
    const user = userEvent.setup()
    render(<App />)
    const logs = screen.getByRole('link', { name: 'Logs' })
    logs.focus()
    await user.keyboard('{Meta>}b{/Meta}')
    expect(sidebar()).toHaveAttribute('data-state', 'collapsed')
    expect(screen.getByRole('link', { name: 'Logs' })).toBe(logs)
    expect(logs).toHaveFocus()
  })

  test('collapsed items show their label in the shared tooltip; expanded ones do not', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App provider={{ defaultOpen: false }} />)
    await user.tab()
    expect(screen.getByRole('link', { name: 'Deployments' })).toHaveFocus()
    await waitFor(() => expect(document.querySelector('[data-slot=tooltip-content]')).toHaveTextContent('Deployments'))
    expect(document.querySelector('[data-slot=tooltip-content]')).toHaveClass('yj-tooltip')
    expect(document.querySelector('[data-slot=tooltip-content]')).toHaveAttribute('data-side', 'inline-end')
    unmount()

    render(<App />)
    await user.tab()
    expect(screen.getByRole('link', { name: 'Deployments' })).toHaveFocus()
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(document.querySelector('[data-slot=tooltip-content]')).toBeNull()
  })

  test('a collapsed item tooltip closes when the pointer leaves toward it, and never takes a click', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(<App provider={{ defaultOpen: false }} />)
    const logs = screen.getByRole('link', { name: 'Logs' })
    await user.hover(logs)
    await waitFor(() => expect(document.querySelector('[data-slot=tooltip-content]')).toHaveTextContent('Logs'), { timeout: 2000 })
    const popup = document.querySelector<HTMLElement>('[data-slot=tooltip-content]')!
    expect(popup).toHaveClass('pointer-events-none')
    // Moving straight onto the popup (as on the way to the trigger beside it) still closes it.
    await user.hover(popup)
    await waitFor(() => expect(document.querySelector('[data-slot=tooltip-content]')).toBeNull())
  })

  test('menu skeletons vary their width but hydrate without a mismatch', async () => {
    const rows = (
      <SidebarProvider>
        {Array.from({ length: 6 }, (_, i) => (
          <SidebarMenuSkeleton key={i} />
        ))}
      </SidebarProvider>
    )
    const container = document.createElement('div')
    container.innerHTML = renderToString(rows)
    document.body.append(container)
    const widths = () =>
      [...container.querySelectorAll<HTMLElement>('[data-sidebar=menu-skeleton-text]')].map((el) => el.style.getPropertyValue('--skeleton-width'))
    const server = widths()
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    let root: ReturnType<typeof hydrateRoot> | undefined
    await act(async () => {
      root = hydrateRoot(container, rows, { onRecoverableError: (error) => console.error(error) })
    })
    expect(errors).not.toHaveBeenCalled()
    errors.mockRestore()
    expect(widths()).toEqual(server)
    expect(new Set(server).size).toBeGreaterThan(1)
    for (const w of server) expect(parseInt(w, 10)).toBeGreaterThanOrEqual(50)
    for (const w of server) expect(parseInt(w, 10)).toBeLessThanOrEqual(90)
    act(() => root!.unmount())
    container.remove()
  })

  test('the rail is a pointer affordance, hidden from assistive tech', () => {
    render(<App />)
    const rail = document.querySelector('[data-slot=sidebar-rail]')!
    expect(rail).toHaveAttribute('aria-hidden', 'true')
    expect(rail).toHaveAttribute('tabindex', '-1')
    expect(screen.getAllByRole('button', { name: 'Toggle sidebar' })).toHaveLength(1)
  })

  test('marks itself for reduced motion', () => {
    render(
      <YoujProvider reducedMotion="always">
        <App />
      </YoujProvider>,
    )
    expect(sidebar()).toHaveAttribute('data-reduced-motion')
  })

  describe('below md', () => {
    const matchMedia = window.matchMedia
    beforeEach(() => {
      window.matchMedia = (query: string) =>
        ({
          matches: query.includes('max-width: 767px'),
          media: query,
          addEventListener: () => {},
          removeEventListener: () => {},
        }) as unknown as MediaQueryList
    })
    afterEach(() => {
      window.matchMedia = matchMedia
    })

    test('it is a sheet: a modal dialog the trigger opens, Escape closes, focus returns', async () => {
      const user = userEvent.setup()
      render(<App />)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(trigger()).toHaveAttribute('aria-expanded', 'false')

      await user.click(trigger())
      const dialog = await screen.findByRole('dialog', { name: 'Sidebar' })
      expect(dialog).toContainElement(screen.getByRole('link', { name: 'Logs' }))
      expect(trigger()).toHaveAttribute('aria-expanded', 'true')

      await user.keyboard('{Escape}')
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      expect(trigger()).toHaveFocus()
    })

    test('the sheet is the shared Sheet from the sidebar edge, without a close button over the header', async () => {
      const user = userEvent.setup()
      render(<App />)
      await user.click(trigger())
      const dialog = await screen.findByRole('dialog', { name: 'Sidebar' })
      expect(dialog).toHaveAttribute('data-slot', 'sidebar')
      expect(dialog).toHaveAttribute('data-mobile', 'true')
      expect(dialog).toHaveClass('yj-sheet-start')
      expect(document.querySelector('[data-slot=dialog-overlay]')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
      // Items never show tooltips in the sheet.
      await user.hover(screen.getByRole('link', { name: 'Logs' }))
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(document.querySelector('[data-slot=tooltip-content]')).toBeNull()
    })

    test('following a link in the sheet closes it', async () => {
      const user = userEvent.setup()
      function Navigating() {
        const { setOpenMobile } = useSidebar()
        return (
          <a href="#billing" onClick={() => setOpenMobile(false)}>
            Billing
          </a>
        )
      }
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarContent>
              <Navigating />
            </SidebarContent>
          </Sidebar>
          <SidebarInset>
            <SidebarTrigger />
          </SidebarInset>
        </SidebarProvider>,
      )
      await user.click(trigger())
      await user.click(await screen.findByRole('link', { name: 'Billing' }))
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      expect(trigger()).toHaveAttribute('aria-expanded', 'false')
    })

    test('the shortcut opens the sheet too', async () => {
      const user = userEvent.setup()
      render(<App />)
      await user.keyboard('{Control>}b{/Control}')
      expect(await screen.findByRole('dialog', { name: 'Sidebar' })).toBeInTheDocument()
    })
  })
})

describe('the current page’s look, counts, the card and the surface', () => {
  function Parts({ indicator, surface }: { indicator?: 'raised' | 'fill' | 'mark' | 'none'; surface?: 'solid' | 'glass' }) {
    return (
      <SidebarProvider>
        <Sidebar collapsible="icon" surface={surface}>
          <SidebarContent indicator={indicator}>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive variant="raised">
                  <span>Inbox</span>
                </SidebarMenuButton>
                <SidebarMenuBadge tone="danger">3</SidebarMenuBadge>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <span>Deals</span>
                </SidebarMenuButton>
                <SidebarMenuBadge variant="pill">24</SidebarMenuBadge>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarCard aria-label="Credits">810 of 3,100</SidebarCard>
        </Sidebar>
      </SidebarProvider>
    )
  }

  test('the content says how it marks the page, and draws no key for none', () => {
    const { rerender } = render(<Parts />)
    expect(document.querySelector('[data-slot=sidebar-content]')).toHaveAttribute('data-yj-indicator', 'raised')
    expect(document.querySelector('[data-slot=sidebar-indicator]')).toBeInTheDocument()
    rerender(<Parts indicator="fill" />)
    expect(document.querySelector('[data-slot=sidebar-indicator]')).toHaveClass('own:bg-selected')
    rerender(<Parts indicator="none" />)
    expect(document.querySelector('[data-slot=sidebar-indicator]')).not.toBeInTheDocument()
  })

  test('counts carry their tone and variant, and a raised tile says so', () => {
    render(<Parts />)
    const [alert, count] = document.querySelectorAll('[data-slot=sidebar-menu-badge]')
    expect(alert).toHaveAttribute('data-tone', 'danger')
    expect(count).toHaveAttribute('data-variant', 'pill')
    expect(screen.getByRole('button', { name: 'Inbox' })).toHaveClass('own:bg-key')
  })

  test('the card sits in the sidebar, and glass reaches the sidebar’s plane', () => {
    render(<Parts surface="glass" />)
    expect(screen.getByLabelText('Credits')).toHaveAttribute('data-slot', 'sidebar-card')
    expect(document.querySelector('[data-slot=sidebar]')).toHaveAttribute('data-yj-surface', 'glass')
    expect(document.querySelector('[data-slot=sidebar-inner]')).toHaveClass('yj-glass')
  })
})
