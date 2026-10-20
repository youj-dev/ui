import { forwardRef } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { HeroCentered } from './hero-centered'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const RouterLink = forwardRef<HTMLAnchorElement, React.ComponentProps<'a'>>((props, ref) => <a ref={ref} data-router="" {...props} />)

describe('HeroCentered', () => {
  test('the legacy headline and description props still set the copy', () => {
    reduced(<HeroCentered headline="Payroll in one click" description="Pay everyone on time." />)
    expect(screen.getByRole('heading', { level: 1, name: 'Payroll in one click' })).toBeInTheDocument()
    expect(screen.getByText('Pay everyone on time.')).toBeInTheDocument()
  })

  test('copy and the calls to action replace the demo; null hides the optional ones', () => {
    reduced(
      <HeroCentered
        copy={{ headline: 'Books that close themselves', note: '' }}
        primaryCta={{ label: 'Open an account', href: '/signup' }}
        secondaryCta={null}
        announcement={null}
        headingLevel={2}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Books that close themselves' })).toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Open an account' })).toHaveAttribute('href', '/signup')
    expect(screen.queryByText(/No card required/)).not.toBeInTheDocument()
  })

  test('each call to action fires its onClick, every link uses linkComponent, and rest props reach the root', async () => {
    const user = userEvent.setup()
    const onPrimary = vi.fn((e: React.MouseEvent) => e.preventDefault())
    const onAnnouncement = vi.fn((e: React.MouseEvent) => e.preventDefault())
    const { container } = reduced(
      <HeroCentered
        id="hero"
        data-section="top"
        className="extra"
        primaryCta={{ label: 'Open an account', href: '/signup', onClick: onPrimary }}
        announcement={{ label: 'Ledgerly 3 is here', href: '/changelog', onClick: onAnnouncement }}
        linkComponent={RouterLink}
      />,
    )
    await user.click(screen.getByRole('link', { name: 'Open an account' }))
    await user.click(screen.getByRole('link', { name: /Ledgerly 3 is here/ }))
    expect(onPrimary).toHaveBeenCalledTimes(1)
    expect(onAnnouncement).toHaveBeenCalledTimes(1)
    expect(screen.getAllByRole('link').every((link) => link.hasAttribute('data-router'))).toBe(true)
    const root = container.querySelector('section')!
    expect(root).toHaveAttribute('id', 'hero')
    expect(root).toHaveAttribute('data-section', 'top')
    expect(root).toHaveClass('extra', 'bg-canvas')
  })
})
