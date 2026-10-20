import { forwardRef, type ComponentProps, type ReactNode } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { NavbarStore, type NavbarStoreDepartment } from './navbar-store'

const reduced = (ui: ReactNode) =>
  render(
    <YoujProvider reducedMotion="always" locale="en-US">
      {ui}
    </YoujProvider>,
  )

function phone(matches: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query) =>
      ({
        matches: matches && query.includes('max-width'),
        media: query,
        onchange: null,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
        dispatchEvent: () => false,
      }) as MediaQueryList,
  )
}

afterEach(() => vi.restoreAllMocks())

const departments: NavbarStoreDepartment[] = [
  { label: 'Coffee', groups: [{ title: 'Beans', links: [{ label: 'Single origin', href: '/coffee/single-origin' }, { label: 'Blends', href: '/coffee/blends' }] }], collections: [{ label: 'The autumn roast', href: '/edit/autumn' }] },
  { label: 'Brewing', href: '/brewing' },
  { label: 'Offers', href: '/offers', highlight: true },
]

describe('NavbarStore', () => {
  test('renders the strip, the departments, the brand, the account and the bag with its count', () => {
    reduced(<NavbarStore departments={departments} current="/brewing" brand={{ name: 'Fernhill', href: '/' }} promo={{ label: 'Free delivery over 30.', href: '/delivery', cta: 'Details' }} bag={{ href: '/bag', count: 3 }} />)
    expect(screen.getByRole('link', { name: /Free delivery over 30/ })).toHaveAttribute('href', '/delivery')
    const banner = screen.getByRole('banner')
    const nav = within(banner).getByRole('navigation', { name: 'Departments' })
    expect(within(nav).getByRole('link', { name: 'Brewing' })).toHaveAttribute('aria-current', 'page')
    expect(within(banner).getByRole('link', { name: 'Fernhill' })).toHaveAttribute('href', '/')
    expect(within(banner).getByRole('link', { name: 'Account' })).toHaveAttribute('href', '#account')
    expect(within(banner).getByRole('link', { name: 'Bag (3)' })).toHaveAttribute('href', '/bag')
  })

  test('a department opens its columns and collection tiles', async () => {
    const user = userEvent.setup()
    reduced(<NavbarStore departments={departments} />)
    await user.click(screen.getByRole('button', { name: 'Coffee' }))
    expect(await screen.findByRole('link', { name: 'Single origin' })).toHaveAttribute('href', '/coffee/single-origin')
    expect(screen.getByRole('group', { name: 'Beans' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /The autumn roast/ })).toHaveAttribute('href', '/edit/autumn')
  })

  test('the region menu changes the currency prices are shown in, and reports it', async () => {
    const user = userEvent.setup()
    const onRegionChange = vi.fn()
    reduced(<NavbarStore onRegionChange={onRegionChange} />)
    await user.click(screen.getByRole('button', { name: 'United States USD, change region' }))
    await user.click(await screen.findByRole('menuitemradio', { name: /United Kingdom/ }))
    expect(onRegionChange).toHaveBeenCalledWith('gb')
    await waitFor(() => expect(screen.getByRole('button', { name: 'United Kingdom GBP, change region' })).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Search the store' }))
    const search = await screen.findByRole('dialog', { name: 'Search the store' })
    expect(within(search).getByRole('option', { name: /Washed linen shirt/ })).toHaveTextContent('£98.00')
  })

  test('search narrows the products as you type, offers every result, and reports the choice', async () => {
    const user = userEvent.setup()
    const onSearchSelect = vi.fn()
    reduced(<NavbarStore onSearchSelect={onSearchSelect} />)
    await user.click(screen.getByRole('button', { name: 'Search the store' }))
    const search = await screen.findByRole('dialog', { name: 'Search the store' })
    expect(within(search).getByRole('group', { name: 'Popular' })).toBeInTheDocument()
    await user.keyboard('mug')
    expect(within(search).getByRole('option', { name: /Stoneware mug/ })).toBeInTheDocument()
    expect(within(search).queryByRole('option', { name: /Merino crew knit/ })).not.toBeInTheDocument()
    await user.click(within(search).getByRole('option', { name: 'See all results for “mug”' }))
    expect(onSearchSelect).toHaveBeenCalledWith({ kind: 'query', query: 'mug', href: '#search?q=mug' })
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Search the store' })).not.toBeInTheDocument())
  })

  test('a popular search fills the field', async () => {
    const user = userEvent.setup()
    reduced(<NavbarStore />)
    await user.click(screen.getByRole('button', { name: 'Search the store' }))
    const search = await screen.findByRole('dialog', { name: 'Search the store' })
    await user.click(within(search).getByRole('option', { name: 'stoneware' }))
    expect(within(search).getByRole('combobox')).toHaveValue('stoneware')
  })

  test('on a phone the drawer folds the departments, and following a link closes it', async () => {
    phone(true)
    const user = userEvent.setup()
    reduced(<NavbarStore departments={departments} current="/coffee/blends" />)
    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    const drawer = await screen.findByRole('dialog')
    const coffee = within(drawer).getByRole('button', { name: 'Coffee' })
    expect(coffee).toHaveAttribute('aria-expanded', 'true')
    expect(within(drawer).getByRole('link', { name: 'Blends' })).toHaveAttribute('aria-current', 'page')
    await user.click(within(drawer).getByRole('link', { name: 'Brewing' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  test('null hides the promise, the account and the bag; copy and linkComponent reach the bar', () => {
    const Link = forwardRef<HTMLAnchorElement, ComponentProps<'a'>>((props, ref) => <a ref={ref} data-router="" {...props} />)
    reduced(<NavbarStore promo={null} accountHref={null} bag={null} departments={departments} linkComponent={Link} copy={{ navLabel: 'Shop' }} />)
    expect(screen.queryByRole('link', { name: /Free shipping/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Account' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /^Bag/ })).not.toBeInTheDocument()
    expect(within(screen.getByRole('navigation', { name: 'Shop' })).getByRole('link', { name: 'Brewing' })).toHaveAttribute('data-router')
  })
})
