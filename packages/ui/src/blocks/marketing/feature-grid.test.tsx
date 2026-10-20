import { forwardRef } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { graphite } from '@youj/core'
import { FeatureGrid } from './feature-grid'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const moving = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="never">{ui}</YoujProvider>)
const TITLE = 'Built in, not bolted on'
const cellOf = (name: string) => screen.getByRole('link', { name }).closest('article') as HTMLElement

describe('feature grid', () => {
  test('a named section of six features, each a titled link', () => {
    reduced(<FeatureGrid />)
    const section = screen.getByRole('region', { name: TITLE })
    const titles = within(section).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(titles).toEqual([
      'Roll out by percentage',
      'Cron without a server',
      'Functions at the edge',
      'Queues that absorb a spike',
      'Secrets that stay secret',
      'Images for every screen',
    ])
    expect(within(section).getByRole('link', { name: 'Cron without a server' })).toHaveAttribute('href', '#cron')
  })

  test('the instruments are pictures of the text beside them: hidden from assistive tech and inert', () => {
    const { container } = reduced(<FeatureGrid />)
    const pictures = container.querySelectorAll('article > [inert]')
    expect(pictures).toHaveLength(6)
    for (const picture of pictures) expect(picture).toHaveAttribute('aria-hidden', 'true')
    // The meters inside them don't reach the accessibility tree; the links are the only controls.
    expect(screen.queryAllByRole('meter')).toHaveLength(0)
    expect(screen.getAllByRole('link')).toHaveLength(6)
  })

  test('pointing at a cell takes a second reading, and leaving puts the first one back', () => {
    moving(<FeatureGrid />)
    const images = cellOf('Images for every screen')
    expect(images).toHaveTextContent('hero.jpg · 1440 px')
    fireEvent.pointerEnter(images)
    expect(images).toHaveAttribute('data-live')
    expect(images).toHaveTextContent('hero.jpg · 390 px')
    expect(images).toHaveTextContent('AVIF')
    fireEvent.pointerLeave(images)
    expect(images).not.toHaveAttribute('data-live')
    expect(images).toHaveTextContent('hero.jpg · 1440 px')
  })

  test('a touch doesn’t take a reading: the tap belongs to the link', () => {
    moving(<FeatureGrid />)
    const queues = cellOf('Queues that absorb a spike')
    fireEvent.pointerEnter(queues, { pointerType: 'touch' })
    expect(queues).not.toHaveAttribute('data-live')
  })

  test('tabbing to a feature’s link takes its reading too, and tabbing on moves it along', async () => {
    const user = userEvent.setup()
    moving(<FeatureGrid />)
    await user.tab()
    const rollouts = cellOf('Roll out by percentage')
    expect(screen.getByRole('link', { name: 'Roll out by percentage' })).toHaveFocus()
    expect(rollouts).toHaveAttribute('data-live')
    await user.tab()
    expect(rollouts).not.toHaveAttribute('data-live')
    expect(cellOf('Cron without a server')).toHaveAttribute('data-live')
  })

  test('reduced motion: every instrument holds its reading, pointed at or not', () => {
    reduced(<FeatureGrid />)
    const secrets = cellOf('Secrets that stay secret')
    fireEvent.pointerEnter(secrets)
    expect(secrets).not.toHaveAttribute('data-live')
    expect(secrets).toHaveTextContent('Encrypted at rest')
    expect(secrets).not.toHaveTextContent('pg://prod.db.internal')
  })

  test('embedded: a section laid out by the host; theme: rendered in a ThemeScope', () => {
    const { container, unmount } = reduced(<FeatureGrid embedded />)
    const section = screen.getByRole('region', { name: TITLE })
    expect(section).not.toHaveClass('bg-canvas')
    expect(section.className).not.toMatch(/\bpy-/)
    expect(container.querySelector('[data-yj-theme]')).toBeNull()
    unmount()
    const themed = reduced(<FeatureGrid theme={graphite} />)
    expect(themed.container.querySelector('[data-yj-theme]')).toContainElement(screen.getByRole('region'))
  })

  test('features, copy and linkComponent replace the demo; media can follow the live state', () => {
    const RouterLink = forwardRef<HTMLAnchorElement, React.ComponentProps<'a'>>((props, ref) => <a ref={ref} data-router="" {...props} />)
    moving(
      <FeatureGrid
        copy={{ title: 'Everything month end needs', eyebrow: '' }}
        features={[
          { id: 'match', title: 'Automatic matching', description: 'Payments find their invoice.', href: '/features/matching', media: (live) => <span>{live ? 'matching' : 'idle'}</span> },
          { id: 'tax', title: 'Tax, filed', description: 'Quarterly returns, drafted.' },
        ]}
        linkComponent={RouterLink}
        headingLevel={3}
        id="features"
      />,
    )
    const section = screen.getByRole('region', { name: 'Everything month end needs' })
    expect(section).toHaveAttribute('id', 'features')
    expect(screen.queryByText('Platform')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Automatic matching' })).toHaveAttribute('href', '/features/matching')
    expect(screen.getByRole('link', { name: 'Tax, filed' })).toHaveAttribute('href', '#tax')
    expect(screen.getByRole('link', { name: 'Tax, filed' })).toHaveAttribute('data-router')
    const cell = cellOf('Automatic matching')
    expect(cell).toHaveTextContent('idle')
    fireEvent.pointerEnter(cell, { pointerType: 'mouse' })
    expect(cell).toHaveTextContent('matching')
    // A feature without media has no picture box.
    expect(cellOf('Tax, filed').querySelector('[inert]')).not.toBeInTheDocument()
  })
})
