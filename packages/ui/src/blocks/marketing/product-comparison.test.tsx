import { forwardRef } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { brutal } from '@youj/core'
import { ProductComparison, type ComparisonGroup, type ComparisonProduct } from './product-comparison'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const TITLE = 'How Northwind stacks up'

const products: ComparisonProduct[] = [
  { id: 'us', name: 'Fernhill', price: '€9', cta: { label: 'Open a shop', href: '/signup' } },
  { id: 'a', name: 'Marketstall', price: '€29' },
  { id: 'b', name: 'Shopbox' },
]
const groups: ComparisonGroup[] = [
  {
    name: 'Selling',
    rows: [
      { feature: 'Discount codes', tip: 'Percent or fixed.', values: [true, true, true] },
      { feature: 'Wholesale prices', values: [true, false, 'partial'] },
      { feature: 'Card fee', values: [{ text: '1.9%' }, { text: '2.9%' }, { text: '2.4%' }] },
    ],
  },
]

describe('Comparison', () => {
  test('one table: a head naming each product, group headings, and a row per feature with spoken values', () => {
    reduced(<ProductComparison />)
    expect(screen.getByRole('region', { name: TITLE })).toBeInTheDocument()
    const table = screen.getByRole('table')
    const heads = within(table).getAllByRole('columnheader').filter((th) => th.getAttribute('scope') === 'col')
    expect(heads).toHaveLength(5)
    expect(heads[0]).toHaveTextContent('Feature')
    ;['Northwind', 'Cumulus', 'Relay', 'Self-hosted'].forEach((name, i) => expect(heads[i + 1]).toHaveTextContent(new RegExp(`^${name}`)))
    expect(within(table).getByRole('rowheader', { name: 'Security and compliance' })).toHaveAttribute('scope', 'rowgroup')
    const sso = within(table).getByRole('rowheader', { name: /SSO with SAML/ }).closest('tr')!
    expect(within(sso).getAllByRole('cell').map((td) => td.textContent!.replace(/–|−/g, '').trim())).toEqual(['Included', 'Included', 'Not included', 'Partly'])
  })

  test('the head shows each product’s coverage, counting partial as half and leaving figures out', () => {
    reduced(<ProductComparison products={products} groups={groups} />)
    expect(screen.getByText('2 of 2 features')).toBeInTheDocument()
    expect(screen.getByText('1 of 2 features')).toBeInTheDocument()
    expect(screen.getByText('1.5 of 2 features')).toBeInTheDocument()
  })

  test('only differences hides the rows every product agrees on, and says when nothing is left', async () => {
    const user = userEvent.setup()
    const onDifferencesOnlyChange = vi.fn()
    reduced(<ProductComparison products={products} groups={groups} onDifferencesOnlyChange={onDifferencesOnlyChange} />)
    expect(screen.getByRole('rowheader', { name: /Discount codes/ })).toBeInTheDocument()
    await user.click(screen.getByRole('switch', { name: 'Only show differences' }))
    expect(onDifferencesOnlyChange).toHaveBeenCalledWith(true)
    expect(screen.queryByRole('rowheader', { name: /Discount codes/ })).not.toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: /Wholesale prices/ })).toBeInTheDocument()
  })

  test('with every row agreed, only differences explains the empty table', () => {
    const { container } = reduced(<ProductComparison products={products} groups={[{ name: 'Same', rows: [{ feature: 'Hosting', values: [true, true, true] }] }]} defaultDifferencesOnly />)
    expect(screen.getByText('Every product does the same on these features.')).toBeInTheDocument()
    // No column left to lift.
    expect(container.querySelector('[data-slot="comparison-ours"]')).toBeNull()
  })

  test('yours stands on a raised panel sized to its column, not a tinted band', () => {
    const { container } = reduced(<ProductComparison products={products} groups={groups} />)
    const panel = container.querySelector<HTMLElement>('[data-slot="comparison-ours"]')!
    expect(panel).toHaveAttribute('aria-hidden', 'true')
    expect(panel.style.getPropertyValue('--ui--products')).toBe(String(products.length))
    for (const cell of screen.getAllByRole('cell')) expect(cell.className).not.toMatch(/accent-subtle/)
  })

  test('every feature with a tip explains itself in a tooltip on hover or focus; a row without one has no button', async () => {
    const user = userEvent.setup()
    reduced(<ProductComparison products={products} groups={groups} />)
    await user.hover(screen.getByRole('button', { name: 'About Discount codes' }))
    expect(await screen.findByText('Percent or fixed.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'About Wholesale prices' })).not.toBeInTheDocument()
  })

  test('the phone picker chooses the one alternative shown beside yours', async () => {
    const user = userEvent.setup()
    const onAlternativeChange = vi.fn()
    const { container } = reduced(<ProductComparison products={products} groups={groups} onAlternativeChange={onAlternativeChange} />)
    const hidden = () => [...container.querySelectorAll('thead th')].slice(1).map((th) => th.className.includes('max-md:hidden'))
    expect(hidden()).toEqual([false, false, true])
    await user.click(within(screen.getByRole('group', { name: 'Compare Northwind with' })).getByRole('button', { name: 'Shopbox' }))
    expect(onAlternativeChange).toHaveBeenCalledWith('b')
    expect(hidden()).toEqual([false, true, false])
  })

  test('a call to action names its product, fires onClick and onChoose, and renders through linkComponent', async () => {
    const user = userEvent.setup()
    const onChoose = vi.fn()
    const onClick = vi.fn((e: React.MouseEvent) => e.preventDefault())
    const Link = forwardRef<HTMLAnchorElement, React.ComponentProps<'a'>>((props, ref) => <a ref={ref} data-router="" {...props} />)
    const withClick = [{ ...products[0]!, cta: { ...products[0]!.cta!, onClick } }, ...products.slice(1)]
    reduced(<ProductComparison products={withClick} groups={groups} onChoose={onChoose} linkComponent={Link} />)
    const link = screen.getByRole('link', { name: 'Open a shop, Fernhill' })
    expect(link).toHaveAttribute('data-router')
    expect(link).toHaveAttribute('href', '/signup')
    await user.click(link)
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onChoose).toHaveBeenCalledWith(withClick[0])
  })

  test('copy rewrites the strings; the correction link can go; headingLevel and rest props apply', () => {
    reduced(<ProductComparison products={products} groups={groups} correctionHref={null} headingLevel={3} id="vs" copy={{ title: 'Us vs them', partial: 'Some', ours: 'Mine' }} />)
    expect(screen.getByRole('heading', { level: 3, name: 'Us vs them' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Us vs them' })).toHaveAttribute('id', 'vs')
    expect(screen.getByText('Some')).toBeInTheDocument()
    expect(screen.getByText('Mine')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Spot a mistake? Tell us.' })).not.toBeInTheDocument()
  })

  test('the demo links to corrections', () => {
    reduced(<ProductComparison />)
    expect(screen.getByRole('link', { name: 'Spot a mistake? Tell us.' })).toHaveAttribute('href', '#corrections')
  })

  test('embedded: no page padding; a theme renders it inside a ThemeScope', () => {
    reduced(<ProductComparison embedded theme={brutal} />)
    const section = screen.getByRole('region', { name: TITLE })
    expect(section.className).not.toMatch(/py-20/)
    expect(section.closest('[data-yj-theme]')).not.toBeNull()
  })
})
