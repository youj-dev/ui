import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { brutal, YoujProvider } from '@youj/core'
import { CtaHeadline } from './cta-headline'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('CTA type', () => {
  test('the big line is one heading naming the section, read once despite the split words', () => {
    reduced(<CtaHeadline />)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveAccessibleName('Ship it today.')
    expect(screen.getByRole('region', { name: 'Ship it today.' })).toBeInTheDocument()
    expect(screen.getAllByText('today.').length).toBeGreaterThan(0)
  })

  test('one call to action, marked so the outlined line fills while it is hovered or focused', () => {
    reduced(<CtaHeadline />)
    const cta = screen.getByRole('link', { name: /Start deploying/ })
    expect(cta).toHaveAttribute('href', '#signup')
    expect(cta).toHaveAttribute('data-cta')
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  test('the command and the fine print are there as text', () => {
    reduced(<CtaHeadline />)
    expect(screen.getByText('npx northwind deploy')).toBeInTheDocument()
    expect(screen.getByText(/No card required/)).toBeInTheDocument()
  })

  test('copy, cta, linkComponent, headingLevel and root props drive the block', async () => {
    const onClick = vi.fn()
    const Link = (p: React.ComponentProps<'a'>) => <a {...p} data-router="" />
    reduced(
      <CtaHeadline
        cta={{ label: 'Apply now', href: '#apply', onClick }}
        linkComponent={Link}
        headingLevel={1}
        id="closing"
        copy={{ title: 'Learn it', titleOutline: 'by doing.', command: '', finePrint: 'Pay after you are hired' }}
      />,
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveAccessibleName('Learn it by doing.')
    expect(screen.getByRole('region')).toHaveAttribute('id', 'closing')
    expect(screen.queryByText('npx northwind deploy')).not.toBeInTheDocument()
    expect(screen.getByText('Pay after you are hired')).toBeInTheDocument()
    const cta = screen.getByRole('link', { name: /Apply now/ })
    expect(cta).toHaveAttribute('href', '#apply')
    expect(cta).toHaveAttribute('data-router')
    expect(cta).toHaveAttribute('data-cta')
    await userEvent.setup().click(cta)
    expect(onClick).toHaveBeenCalledOnce()
  })

  test('embedded, it drops the page padding and container; a theme adds a ThemeScope', () => {
    const scopes = (ui: React.ReactNode) => {
      const view = reduced(ui)
      const n = view.container.querySelectorAll('[data-yj-theme]').length
      view.unmount()
      return n
    }
    expect(scopes(<CtaHeadline theme={brutal} />)).toBe(scopes(<CtaHeadline />) + 1)
    reduced(<CtaHeadline embedded />)
    const section = screen.getByRole('region')
    expect(section).not.toHaveClass('py-24')
    expect(section.querySelector('.max-w-6xl')).toBeNull()
  })
})
