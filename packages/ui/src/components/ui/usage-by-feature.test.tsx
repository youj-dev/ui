import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { UsageByFeature } from './usage-by-feature.fixtures'

const open = () =>
  render(
    <YoujProvider reducedMotion="always">
      <UsageByFeature defaultOpen />
    </YoujProvider>,
  )
const names = () => within(screen.getByRole('dialog')).getAllByRole('listitem').map((li) => li.querySelector('span.truncate')?.textContent)

describe('Usage by feature', () => {
  test('shows the month’s total with its reset, and a tick meter per feature that turns amber and red near the limit', () => {
    open()
    const dialog = within(screen.getByRole('dialog', { name: 'Credit usage' }))
    expect(dialog.getByText(/5,230/)).toBeInTheDocument()
    expect(dialog.getByText('Resets in 12 days')).toBeInTheDocument()
    expect(dialog.getByRole('progressbar', { name: 'Credits used this month' })).toBeInTheDocument()
    expect(dialog.getByRole('meter', { name: 'Voice notes usage' })).toHaveAttribute('aria-valuenow', '310')
    // The band is spoken as well as drawn: 86% and 94% are near the limit, 31% says nothing.
    expect(dialog.getByRole('meter', { name: 'Image studio usage' })).toHaveAttribute('aria-valuetext', '86%, Near limit')
    expect(dialog.getByRole('meter', { name: 'Document search usage' })).toHaveAttribute('aria-valuetext', '94%, Near limit')
    expect(dialog.getByRole('meter', { name: 'Voice notes usage' })).toHaveAttribute('aria-valuetext', '31%')
    expect(dialog.getByRole('button', { name: 'Close' })).toBeInTheDocument()
    expect(dialog.getByRole('button', { name: 'Upgrade plan' })).toBeInTheDocument()
  })

  test('sorting reorders the rows, and the filter keeps only features near their limit', async () => {
    const user = userEvent.setup()
    open()
    expect(names()).toEqual(['Drafting assistant', 'Image studio', 'Document search', 'Voice notes', 'Translations'])

    await user.click(screen.getByRole('combobox', { name: 'Sort features' }))
    await user.click(await screen.findByRole('option', { name: 'Closest to limit' }))
    expect(names()).toEqual(['Document search', 'Image studio', 'Drafting assistant', 'Voice notes', 'Translations'])

    await user.click(screen.getByRole('combobox', { name: 'Filter features' }))
    await user.click(await screen.findByRole('option', { name: 'Near limit' }))
    expect(names()).toEqual(['Document search', 'Image studio'])
  })
})
