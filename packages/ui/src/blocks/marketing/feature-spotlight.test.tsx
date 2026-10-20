import { forwardRef } from 'react'
import { render, screen, within } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { FeatureSpotlight } from './feature-spotlight'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const RouterLink = forwardRef<HTMLAnchorElement, React.ComponentProps<'a'>>((props, ref) => <a ref={ref} data-router="" {...props} />)

describe('FeatureSpotlight', () => {
  test('features, copy and linkComponent replace the demo rows', () => {
    reduced(
      <FeatureSpotlight
        id="spotlight"
        copy={{ title: 'Getting paid, step by step', learnMore: (eyebrow) => `More on ${eyebrow}` }}
        features={[
          { id: 'invoices', eyebrow: 'Invoices', title: 'Sent in a minute', description: 'From a template.', href: '/invoices', media: <img src="/i.png" alt="An invoice" /> },
          { id: 'reminders', eyebrow: 'Reminders', title: 'Paid on time', description: 'Polite, then firm.' },
        ]}
        linkComponent={RouterLink}
      />,
    )
    const section = screen.getByRole('region', { name: 'Getting paid, step by step' })
    expect(section).toHaveAttribute('id', 'spotlight')
    expect(within(section).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Sent in a minute', 'Paid on time'])
    expect(screen.getByRole('link', { name: 'More on Invoices' })).toHaveAttribute('href', '/invoices')
    expect(screen.getByRole('link', { name: 'More on Reminders' })).toHaveAttribute('href', '#reminders')
    expect(screen.getByRole('link', { name: 'More on Invoices' })).toHaveAttribute('data-router')
    expect(screen.getByRole('img', { name: 'An invoice' })).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  test('headingLevel sets the heading and puts the row titles one level below', () => {
    reduced(<FeatureSpotlight headingLevel={3} />)
    expect(screen.getByRole('heading', { level: 3, name: 'From branch to production, without the ceremony' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(3)
  })
})
