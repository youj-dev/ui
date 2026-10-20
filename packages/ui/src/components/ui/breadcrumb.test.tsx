import { Fragment } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from './breadcrumb'

const PATH = ['Acme', 'Engineering', 'Platform', 'Services', 'Billing API', 'Environments', 'Production']

function Path({ names = PATH, maxItems }: { names?: string[]; maxItems?: number }) {
  return (
    <Breadcrumb>
      <BreadcrumbList maxItems={maxItems}>
        {names.map((name, i) =>
          i === names.length - 1 ? (
            <BreadcrumbItem key={name}>
              <BreadcrumbPage>{name}</BreadcrumbPage>
            </BreadcrumbItem>
          ) : (
            <Fragment key={name}>
              <BreadcrumbItem>
                <BreadcrumbLink href={`#${name}`}>{name}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </Fragment>
          ),
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

const links = () => screen.queryAllByRole('link').map((a) => a.textContent)

describe('Breadcrumb', () => {
  test('a named nav around an ordered list; the page is current, separators are hidden', () => {
    render(<Path names={['Acme', 'web', 'Deployments']} />)
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' })
    const list = within(nav).getByRole('list')
    expect(list.tagName).toBe('OL')
    // Separators are presentational: only the three crumbs are list items.
    expect(within(list).getAllByRole('listitem')).toHaveLength(3)
    expect(links()).toEqual(['Acme', 'web'])
    const page = screen.getByText('Deployments').closest('[data-slot=breadcrumb-page]')
    expect(page).toHaveAttribute('aria-current', 'page')
    expect(page?.tagName).toBe('SPAN')
  })

  test('maxItems folds the middle crumbs into a named ellipsis button', () => {
    render(<Path maxItems={4} />)
    expect(links()).toEqual(['Acme', 'Environments'])
    expect(screen.getByText('Production')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Show 4 more' })).toBeInTheDocument()
    expect(screen.queryByText('Platform')).not.toBeInTheDocument()
  })

  test('the ellipsis unfolds the path in place and moves focus to the first revealed crumb', async () => {
    const user = userEvent.setup()
    render(<Path maxItems={4} />)
    await user.click(screen.getByRole('button', { name: 'Show 4 more' }))
    expect(links()).toEqual(['Acme', 'Engineering', 'Platform', 'Services', 'Billing API', 'Environments'])
    expect(screen.getByRole('link', { name: 'Engineering' })).toHaveFocus()
    expect(screen.queryByRole('button', { name: /Show/ })).not.toBeInTheDocument()
  })

  test('works from the keyboard', async () => {
    const user = userEvent.setup()
    render(<Path maxItems={4} />)
    await user.tab()
    expect(screen.getByRole('link', { name: 'Acme' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Show 4 more' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('link', { name: 'Engineering' })).toHaveFocus()
  })

  test('a new path starts folded again', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Path maxItems={4} />)
    await user.click(screen.getByRole('button', { name: 'Show 4 more' }))
    rerender(<Path maxItems={4} names={[...PATH.slice(0, -1), 'Staging', 'Logs']} />)
    expect(screen.getByRole('button', { name: 'Show 5 more' })).toBeInTheDocument()
  })

  test('a path within maxItems never folds', () => {
    render(<Path maxItems={8} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(links()).toHaveLength(6)
  })

  test('long labels keep their full text in the accessible name', () => {
    const long = 'marketing-site-redesign-2026-experiments'
    render(<Path names={[long, 'Preview']} />)
    expect(screen.getByRole('link', { name: long })).toBeInTheDocument()
  })

  test('under reduced motion the path unfolds without animating', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="always">
        <Path maxItems={4} />
      </YoujProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Show 4 more' }))
    for (const item of document.querySelectorAll<HTMLElement>('[data-slot=breadcrumb-item]')) {
      expect(item.style.width).toBe('')
      expect(item).not.toHaveClass('overflow-hidden')
    }
  })
})
