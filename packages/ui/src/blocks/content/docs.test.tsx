import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Docs, type DocsEntry } from './docs'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

beforeAll(() => {
  window.scrollTo = () => {}
  Element.prototype.scrollIntoView ??= () => {}
})

describe('docs block', () => {
  test('names the nav, article and contents, and marks the current page', async () => {
    const user = userEvent.setup()
    reduced(<Docs />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Installation' })).toBeInTheDocument()
    const nav = screen.getAllByRole('navigation', { name: 'Documentation' })[0]!
    expect(within(nav).getByRole('link', { name: 'Installation' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getAllByRole('navigation', { name: 'On this page' }).length).toBeGreaterThan(0)
    expect(screen.getByRole('tablist', { name: 'Package manager' })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'yarn' }))
    expect(screen.getByText('yarn add @northstar/sdk')).toBeInTheDocument()

    await user.click(within(screen.getByRole('navigation', { name: 'Pagination' })).getByRole('link', { name: /Quickstart/ }))
    expect(screen.getByRole('heading', { level: 1, name: 'Quickstart' })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Quickstart' })).toHaveAttribute('aria-current', 'page')
  })

  test('the search palette jumps to a page, and feedback says thanks', async () => {
    const user = userEvent.setup()
    reduced(<Docs />)
    await user.click(screen.getByRole('button', { name: /Search docs/ }))
    const palette = await screen.findByRole('dialog')
    await user.click(within(palette).getByRole('option', { name: /Retries/ }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Retries' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Yes' }))
    expect(screen.getByText('Thanks, glad it helped.')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Feedback sent')
  })
})

const PAGES: DocsEntry[] = [
  { id: 'overview', group: 'Start here', title: 'Overview', lead: 'One API.', sections: [{ id: 'keys', title: 'API keys', body: <p>Test keys first.</p> }] },
  { id: 'charges', group: 'Payments', title: 'Charges', lead: 'Take money.', updated: 'Sep 28', sections: [{ id: 'create', title: 'Create a charge', body: <p>POST it.</p> }] },
]

describe('docs block with your data', () => {
  test('your pages, brand and version drive the docs', () => {
    reduced(<Docs pages={PAGES} defaultPage="charges" brand={{ name: 'Tollgate' }} version={null} getEditHref={(p) => `/edit/${p.id}`} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Charges' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Tollgate' })).toBeInTheDocument()
    expect(screen.queryByText('v2.4')).not.toBeInTheDocument()
    expect(screen.getByText('Updated Sep 28')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Edit this page' })).toHaveAttribute('href', '/edit/charges')
    const nav = screen.getAllByRole('navigation', { name: 'Documentation' })[0]!
    expect(within(nav).getAllByRole('link').map((a) => a.textContent)).toEqual(['Overview', 'Charges'])
  })

  test('controlled page: navigation is reported and the prop decides the page; routes come from getHref', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    const RouterLink = (props: React.ComponentProps<'a'>) => <a data-router="" {...props} onClick={(e) => (e.preventDefault(), props.onClick?.(e))} />
    reduced(<Docs pages={PAGES} page="charges" onPageChange={onPageChange} getHref={(p) => `/docs/${p.id}`} linkComponent={RouterLink} />)
    const nav = screen.getAllByRole('navigation', { name: 'Documentation' })[0]!
    const overview = within(nav).getByRole('link', { name: 'Overview' })
    expect(overview).toHaveAttribute('href', '/docs/overview')
    expect(overview).toHaveAttribute('data-router')
    await user.click(overview)
    expect(onPageChange).toHaveBeenCalledWith('overview')
    expect(screen.getByRole('heading', { level: 1, name: 'Charges' })).toBeInTheDocument()
  })

  test('onFeedback hears the page and the vote; copy rewrites the question', async () => {
    const user = userEvent.setup()
    const onFeedback = vi.fn()
    reduced(<Docs pages={PAGES} defaultPage="overview" onFeedback={onFeedback} copy={{ helpful: 'Did this help?' }} />)
    expect(screen.getByText('Did this help?')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'No' }))
    expect(onFeedback).toHaveBeenCalledWith('overview', 'no')
  })
})
