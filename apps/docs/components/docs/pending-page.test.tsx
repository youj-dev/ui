import { act, fireEvent, render, screen } from '@testing-library/react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { IntentLink } from '@/components/site/intent-link'
import { PendingPage } from './pending-page'

const route = vi.hoisted(() => ({ pathname: '/' }))
vi.mock('next/navigation', () => ({ usePathname: () => route.pathname, useRouter: () => ({ prefetch: () => {} }) }))

const Page = () => (
  <PendingPage>
    <IntentLink href="/docs/next">Next page</IntentLink>
    <IntentLink href="/blocks">Blocks</IntentLink>
    <IntentLink href="/">Here</IntentLink>
  </PendingPage>
)

describe('PendingPage', () => {
  beforeEach(() => {
    route.pathname = '/'
  })

  it('marks the page busy from the click on a docs link until the next one arrives', () => {
    const { rerender } = render(<Page />)
    expect(screen.queryByRole('status')).toBeNull()
    act(() => void fireEvent.click(screen.getByRole('link', { name: 'Next page' })))
    expect(screen.getByRole('status')).toHaveTextContent('Loading page')
    expect(screen.getByRole('status').parentElement).toHaveAttribute('aria-busy', 'true')
    route.pathname = '/docs/next'
    rerender(<Page />)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('lets each page mounted in the browser arrive, and a hash change on it never', () => {
    route.pathname = '/docs/a'
    const { container, rerender } = render(<Page />)
    const first = container.querySelector('.docs-page')!
    expect(first).toHaveAttribute('data-arrive')
    route.pathname = '/docs/b'
    rerender(<Page />)
    const next = container.querySelector('.docs-page')!
    expect(next).not.toBe(first)
    expect(next).toHaveAttribute('data-arrive')
    rerender(<Page />)
    expect(container.querySelector('.docs-page')).toBe(next)
  })

  it('paints the page a visit lands on as the server sent it', async () => {
    const host = document.createElement('div')
    host.innerHTML = renderToString(<Page />)
    document.body.append(host)
    await act(async () => void hydrateRoot(host, <Page />))
    expect(host.querySelector('.docs-page')).not.toHaveAttribute('data-arrive')
    host.remove()
  })

  it('stays out of the way for the current page, other sections and modified clicks', () => {
    render(<Page />)
    act(() => void fireEvent.click(screen.getByRole('link', { name: 'Here' })))
    act(() => void fireEvent.click(screen.getByRole('link', { name: 'Blocks' })))
    act(() => void fireEvent.click(screen.getByRole('link', { name: 'Next page' }), { metaKey: true }))
    expect(screen.queryByRole('status')).toBeNull()
  })
})
