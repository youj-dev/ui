import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './button'
import { Collapsible, CollapsibleChevron, CollapsibleContent, CollapsibleTrigger } from './collapsible'

function Advanced({ defaultOpen }: { defaultOpen?: boolean }) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger render={<Button variant="ghost" />}>
        Advanced
        <CollapsibleChevron />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <label>
          Output directory <input defaultValue=".next" />
        </label>
      </CollapsibleContent>
    </Collapsible>
  )
}

describe('Collapsible', () => {
  test('the trigger discloses its panel', async () => {
    const user = userEvent.setup()
    render(<Advanced />)
    const trigger = screen.getByRole('button', { name: 'Advanced' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()

    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const input = screen.getByRole('textbox', { name: 'Output directory' })
    const panel = input.closest('[data-slot=collapsible-content]')!
    expect(trigger).toHaveAttribute('aria-controls', panel.id)
    expect(panel).toHaveClass('yj-collapse')
  })

  test('Enter and Space toggle from the keyboard', async () => {
    const user = userEvent.setup()
    render(<Advanced />)
    await user.tab()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: 'Advanced' })).toHaveAttribute('aria-expanded', 'true')
    await user.keyboard(' ')
    expect(screen.getByRole('button', { name: 'Advanced' })).toHaveAttribute('aria-expanded', 'false')
  })

  test('the chevron follows a trigger composed through render', async () => {
    const user = userEvent.setup()
    render(<Advanced />)
    const trigger = screen.getByRole('button', { name: 'Advanced' })
    const icon = () => trigger.querySelector('[data-icon=chevron-down]')
    expect(icon()).toHaveAttribute('data-state', 'rest')
    await user.click(trigger)
    await waitFor(() => expect(icon()).toHaveAttribute('data-state', 'active'))
    await user.click(trigger)
    await waitFor(() => expect(icon()).toHaveAttribute('data-state', 'rest'))
  })

  test('an initially open collapsible shows its chevron turned from the first paint', () => {
    render(<Advanced defaultOpen />)
    const icon = screen.getByRole('button', { name: 'Advanced' }).querySelector('[data-icon=chevron-down]')
    expect(icon).toHaveAttribute('data-state', 'active')
  })

  test('a chevron outside any trigger rests', () => {
    const { container } = render(<CollapsibleChevron />)
    expect(container.querySelector('[data-icon=chevron-down]')).toHaveAttribute('data-state', 'rest')
  })
})
