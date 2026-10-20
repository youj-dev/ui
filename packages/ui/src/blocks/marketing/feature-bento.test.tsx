import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { graphite } from '@youj/core'
import { BellIcon, ReceiptIcon } from '@youj/icons'
import { FeatureBento } from './feature-bento'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('feature bento', () => {
  test('a named section with six titled tiles', () => {
    reduced(<FeatureBento />)
    const section = screen.getByRole('region', { name: 'The whole release, in one place' })
    const titles = within(section).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(titles).toEqual(['A preview for every push', '38 regions, zero config', 'Review the real thing', 'Builds that remember', 'A keystroke away', 'Speed you can see'])
  })

  test('the preview’s switch really password-protects it, and says so', async () => {
    const user = userEvent.setup()
    reduced(<FeatureBento />)
    const toggle = screen.getByRole('switch', { name: 'Password protection' })
    expect(toggle).toHaveAccessibleDescription('Anyone with the link can open it')
    await user.click(toggle)
    expect(toggle).toBeChecked()
    expect(toggle).toHaveAccessibleDescription('Only people with the password can open it')
    await user.keyboard(' ')
    expect(toggle).not.toBeChecked()
  })

  test('the ambient demos are pictures: hidden from assistive tech and inert', () => {
    const { container } = reduced(<FeatureBento />)
    const pictures = container.querySelectorAll('[inert]')
    expect(pictures.length).toBeGreaterThanOrEqual(6)
    for (const picture of pictures) expect(picture).toHaveAttribute('aria-hidden', 'true')
    // The only control in the grid is the switch.
    expect(screen.getAllByRole('switch')).toHaveLength(1)
  })

  test('under reduced motion the demos hold their finished frame and never tick', () => {
    vi.useFakeTimers()
    try {
      reduced(<FeatureBento />)
      expect(screen.getByText('Built in 3.7 s', { selector: 'span' })).toBeInTheDocument()
      act(() => vi.advanceTimersByTime(10_000))
      expect(screen.getByText('Built in 3.7 s', { selector: 'span' })).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  test('embedded: a section laid out by the host; theme: rendered in a ThemeScope', () => {
    const { container, unmount } = reduced(<FeatureBento embedded />)
    const section = screen.getByRole('region', { name: 'The whole release, in one place' })
    expect(section).not.toHaveClass('bg-canvas')
    expect(section.className).not.toMatch(/\bpy-/)
    expect(container.querySelector('[data-yj-theme]')).toBeNull()
    unmount()
    const themed = reduced(<FeatureBento theme={graphite} />)
    expect(themed.container.querySelector('[data-yj-theme]')).toContainElement(screen.getByRole('region'))
  })

  test('features and copy replace the demo tiles; rest props and headingLevel reach the section', () => {
    reduced(
      <FeatureBento
        id="bento"
        headingLevel={3}
        copy={{ title: 'Getting paid, end to end', eyebrow: '' }}
        features={[
          { icon: ReceiptIcon, title: 'Invoices in a minute', description: 'From a template.', className: 'lg:col-span-4', media: <p>invoice picture</p> },
          { icon: BellIcon, title: 'Polite reminders', description: 'On the due date.', className: 'lg:col-span-2' },
        ]}
      />,
    )
    const section = screen.getByRole('region', { name: 'Getting paid, end to end' })
    expect(section).toHaveAttribute('id', 'bento')
    expect(within(section).getByRole('heading', { level: 3, name: 'Getting paid, end to end' })).toBeInTheDocument()
    expect(screen.queryByText('Platform')).not.toBeInTheDocument()
    const tiles = within(section).getAllByRole('article')
    expect(tiles).toHaveLength(2)
    expect(tiles[0]).toHaveTextContent('invoice picture')
    expect(tiles[0]!.parentElement).toHaveClass('lg:col-span-4')
  })
})
