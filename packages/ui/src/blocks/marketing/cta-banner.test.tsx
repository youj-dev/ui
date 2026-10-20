import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { graphite, YoujProvider } from '@youj/core'
import { CtaBanner } from './cta-banner'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('CTA banner', () => {
  test('a section named by its headline, with the primary action and the quickstart link', () => {
    reduced(<CtaBanner />)
    const section = screen.getByRole('region', { name: 'Your next deploy is sixty seconds away.' })
    expect(section.tagName).toBe('SECTION')
    expect(screen.getByRole('heading', { level: 2 })).toHaveAccessibleName('Your next deploy is sixty seconds away.')
    expect(screen.getByRole('link', { name: 'Import a repository' })).toHaveAttribute('href', '#signup')
    expect(screen.getByRole('link', { name: /Read the quickstart/ })).toHaveAttribute('href', '#quickstart')
  })

  test('reduced motion marks the band so the light sweep is hidden', () => {
    reduced(<CtaBanner />)
    expect(screen.getByRole('region')).toHaveAttribute('data-reduced-motion')
    expect(screen.getByRole('region').querySelector('.animate-shimmer')).toHaveClass('reduced:hidden')
  })

  test('embedded, the band is a rounded panel with no page container', () => {
    reduced(<CtaBanner embedded />)
    const section = screen.getByRole('region')
    expect(section).toHaveClass('rounded-xl')
    expect(section.querySelector('.max-w-6xl')).toBeNull()
  })

  test('copy, actions, linkComponent, headingLevel and root props drive the band', async () => {
    const onClick = vi.fn()
    const Link = (p: React.ComponentProps<'a'>) => <a {...p} data-router="" />
    reduced(
      <CtaBanner
        primaryCta={{ label: 'Choose recipes', href: '#trial', onClick }}
        secondaryCta={{ label: 'See the menu', href: '#menu' }}
        linkComponent={Link}
        headingLevel={3}
        copy={{ title: 'Your first box ships Friday.' }}
        className="my-band"
        id="band"
      />,
    )
    const section = screen.getByRole('region', { name: 'Your first box ships Friday.' })
    expect(section).toHaveClass('my-band')
    expect(section).toHaveAttribute('id', 'band')
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Your first box ships Friday.')
    const primary = screen.getByRole('link', { name: 'Choose recipes' })
    expect(primary).toHaveAttribute('href', '#trial')
    expect(primary).toHaveAttribute('data-router')
    expect(screen.getByRole('link', { name: /See the menu/ })).toHaveAttribute('href', '#menu')
    await userEvent.setup().click(primary)
    expect(onClick).toHaveBeenCalledOnce()
  })

  test('secondaryCta null hides the text link', () => {
    reduced(<CtaBanner secondaryCta={null} />)
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  test('a theme adds a ThemeScope around it; without one it follows the theme around it', () => {
    const scopes = (ui: React.ReactNode) => {
      const view = reduced(ui)
      const n = view.container.querySelectorAll('[data-yj-theme]').length
      view.unmount()
      return n
    }
    expect(scopes(<CtaBanner theme={graphite} />)).toBe(scopes(<CtaBanner />) + 1)
  })
})
