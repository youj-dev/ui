import { forwardRef, type ComponentProps } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { MarketingCta } from './cta'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('MarketingCta', () => {
  test('copy and the CTAs drive the text and links', () => {
    reduced(
      <MarketingCta
        illustration={null}
        copy={{ title: 'A table is still open', description: 'Book in a minute.' }}
        primaryCta={{ label: 'Reserve a table', href: '/reserve' }}
        secondaryCta={{ label: 'See the menu', href: '/menu' }}
      />,
    )
    expect(screen.getByRole('region', { name: 'A table is still open' })).toHaveTextContent('Book in a minute.')
    expect(screen.getByRole('link', { name: /Reserve a table/ })).toHaveAttribute('href', '/reserve')
    expect(screen.getByRole('link', { name: 'See the menu' })).toHaveAttribute('href', '/menu')
  })

  test('the title prop still wins over copy; secondaryCta={null} hides the second link', () => {
    reduced(<MarketingCta illustration={null} title="Ship it" copy={{ title: 'Ignored' }} secondaryCta={null} />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Ship it')
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  test('a CTA onClick fires', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault())
    reduced(<MarketingCta illustration={null} primaryCta={{ label: 'Go', href: '/go', onClick }} />)
    await user.click(screen.getByRole('link', { name: /Go/ }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  test('linkComponent, headingLevel and extra props', () => {
    const Link = forwardRef<HTMLAnchorElement, ComponentProps<'a'>>((props, ref) => <a ref={ref} data-router="" {...props} />)
    reduced(<MarketingCta illustration={null} linkComponent={Link} headingLevel={3} id="closing" />)
    for (const link of screen.getAllByRole('link')) expect(link).toHaveAttribute('data-router')
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Your next deploy could be your first one here')
    expect(screen.getByRole('region')).toHaveAttribute('id', 'closing')
  })
})
