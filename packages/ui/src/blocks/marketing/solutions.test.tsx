import { forwardRef } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { brutal } from '@youj/core'
import { Solutions, type SolutionsIndustry, type SolutionsRole } from './solutions'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const TITLE = 'Built for the way your team works'

describe('Solutions', () => {
  test('a labelled section with a tab per role and a segment per industry; the first of each is shown', () => {
    reduced(<Solutions />)
    expect(screen.getByRole('region', { name: TITLE })).toBeInTheDocument()
    const roles = screen.getByRole('tablist', { name: 'Who are you?' })
    expect(within(roles).getAllByRole('tab').map((t) => t.textContent)).toEqual(['Engineers', 'Designers', 'Product managers'])
    expect(within(roles).getByRole('tab', { name: 'Engineers' })).toHaveAttribute('aria-selected', 'true')
    const industries = screen.getByRole('group', { name: 'What do you build?' })
    expect(within(industries).getByRole('button', { name: 'Commerce' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('heading', { level: 3, name: 'Ship without the Friday dread' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Showing Engineers in Commerce')
  })

  test('the industry changes the numbers, the feed, the quote and the call to action, not the role’s pitch', async () => {
    const user = userEvent.setup()
    const onIndustryChange = vi.fn()
    reduced(<Solutions onIndustryChange={onIndustryChange} />)
    expect(screen.getAllByRole('term')).toHaveLength(3)
    expect(screen.getAllByRole('definition')[0]).toHaveTextContent('24')
    expect(screen.getByText('Checkout promoted to 100% after a clean canary')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'See how Commerce engineers do it' })).toBeInTheDocument()
    await user.click(within(screen.getByRole('group', { name: 'What do you build?' })).getByRole('button', { name: 'Fintech' }))
    expect(onIndustryChange).toHaveBeenCalledWith('fintech')
    await waitFor(() => expect(screen.getByText('Ledger service rolled back in 1.1 s')).toBeInTheDocument())
    expect(screen.queryByText('Checkout promoted to 100% after a clean canary')).not.toBeInTheDocument()
    expect(screen.getByText(/Audit logs and approvals were a setting/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'See how Fintech engineers do it' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Ship without the Friday dread' })).toBeInTheDocument()
    expect(screen.getAllByRole('definition')[0]).toHaveTextContent('9')
    expect(screen.getByRole('status')).toHaveTextContent('Showing Engineers in Fintech')
  })

  test('the role changes the pitch and keeps the industry; arrow keys move between role tabs', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    reduced(<Solutions defaultIndustry="media" onValueChange={onValueChange} />)
    screen.getByRole('tab', { name: 'Engineers' }).focus()
    await user.keyboard('{ArrowRight}')
    expect(onValueChange).toHaveBeenCalledWith('design')
    expect(screen.getByRole('heading', { level: 3, name: 'Review the real thing, not a screenshot' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'See how Media designers do it' })).toBeInTheDocument()
    expect(screen.getByText('Kenji pinned a comment on the article header')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Showing Designers in Media')
  })

  test('numbers are written in the given locale', () => {
    const roles: SolutionsRole[] = [
      { id: 'a', label: 'Ops', headline: 'H', description: 'D', points: [], stats: [{ label: 'Orders', values: { x: { value: 1234.5, format: { minimumFractionDigits: 1 } } } }], feed: { x: [] } },
    ]
    const industries: SolutionsIndustry[] = [{ id: 'x', label: 'X', quote: { text: 'T', name: 'N', role: 'R' } }]
    reduced(<Solutions roles={roles} industries={industries} locale="de-DE" />)
    expect(screen.getByText('1.234,5')).toBeInTheDocument()
  })

  test('a stat with no value for the industry shows a dash', () => {
    const roles: SolutionsRole[] = [{ id: 'a', label: 'Ops', headline: 'H', description: 'D', points: [], stats: [{ label: 'Orders', values: {} }], feed: {} }]
    const industries: SolutionsIndustry[] = [{ id: 'x', label: 'X', quote: { text: 'T', name: 'N', role: 'R' } }]
    reduced(<Solutions roles={roles} industries={industries} />)
    expect(screen.getByRole('definition')).toHaveTextContent('–')
  })

  test('controlled role and industry drive the shown content', () => {
    reduced(<Solutions value="product" industry="fintech" />)
    expect(screen.getByRole('heading', { level: 3, name: 'Know what shipped, and what it did' })).toBeInTheDocument()
    expect(screen.getByText('Instant transfers are live for business accounts')).toBeInTheDocument()
  })

  test('the call to action renders through linkComponent and fires onClick', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn((e: React.MouseEvent) => e.preventDefault())
    const RouterLink = forwardRef<HTMLAnchorElement, React.ComponentProps<'a'>>((props, ref) => <a ref={ref} data-router="" {...props} />)
    const roles: SolutionsRole[] = [
      { id: 'a', label: 'Ops', headline: 'Run it', description: 'D', points: ['One'], stats: [], feed: {}, cta: { href: '/ops', onClick } },
    ]
    const industries: SolutionsIndustry[] = [{ id: 'x', label: 'Retail', quote: { text: 'T', name: 'N', role: 'R' } }]
    reduced(<Solutions roles={roles} industries={industries} linkComponent={RouterLink} />)
    const link = screen.getByRole('link', { name: 'See how Retail ops do it' })
    expect(link).toHaveAttribute('data-router')
    expect(link).toHaveAttribute('href', '/ops')
    await user.click(link)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  test('copy rewrites the strings; headingLevel and rest props apply; embedded and theme', () => {
    reduced(<Solutions embedded theme={brutal} headingLevel={1} id="solutions" copy={{ title: 'For everyone', roleLabel: 'Role' }} />)
    const section = screen.getByRole('region', { name: 'For everyone' })
    expect(section).toHaveAttribute('id', 'solutions')
    expect(section.className).not.toMatch(/py-20/)
    expect(section.closest('[data-yj-theme]')).not.toBeNull()
    expect(screen.getByRole('heading', { level: 1, name: 'For everyone' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Ship without the Friday dread' })).toBeInTheDocument()
    expect(screen.getByRole('tablist', { name: 'Role' })).toBeInTheDocument()
  })
})
