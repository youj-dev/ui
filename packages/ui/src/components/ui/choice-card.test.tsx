import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChoiceCard, ChoiceCardGroup } from './choice-card'

describe('ChoiceCard', () => {
  test('a radio group is one tab stop and the arrow keys move the choice', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <>
        <ChoiceCardGroup aria-label="Access" defaultValue="build" onValueChange={onValueChange}>
          <ChoiceCard value="manage" title="Manage" description="Everything" />
          <ChoiceCard value="build" title="Build" description="Projects" />
          <ChoiceCard value="review" title="Review" description="Comments" />
        </ChoiceCardGroup>
        <button type="button">After</button>
      </>,
    )
    expect(screen.getByRole('radiogroup', { name: 'Access' })).toBeInTheDocument()
    await user.tab()
    const build = screen.getByRole('radio', { name: /Build/ })
    expect(build).toHaveFocus()
    expect(build).toHaveAttribute('aria-checked', 'true')
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('radio', { name: /Review/ })).toHaveAttribute('aria-checked', 'true')
    expect(onValueChange).toHaveBeenLastCalledWith('review', expect.anything())
    await user.tab()
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus()
  })

  test('clicking anywhere on a card chooses it', async () => {
    const user = userEvent.setup()
    render(
      <ChoiceCardGroup aria-label="Plan" defaultValue="a">
        <ChoiceCard value="a" title="First" />
        <ChoiceCard value="b" title="Second" description="Click this text" note="Costs more" />
      </ChoiceCardGroup>,
    )
    await user.click(screen.getByText('Click this text'))
    expect(screen.getByRole('radio', { name: /Second/ })).toHaveAttribute('aria-checked', 'true')
    await user.click(screen.getByText('First'))
    expect(screen.getByRole('radio', { name: /First/ })).toHaveAttribute('aria-checked', 'true')
  })

  test('a checkbox group reports the ticked values', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <ChoiceCardGroup control="checkbox" aria-label="Channels" defaultValue={['email']} onValueChange={onValueChange}>
        <ChoiceCard value="email" title="Email" />
        <ChoiceCard value="chat" title="Chat" />
      </ChoiceCardGroup>,
    )
    expect(screen.getByRole('checkbox', { name: /Email/ })).toHaveAttribute('aria-checked', 'true')
    await user.click(screen.getByText('Chat'))
    expect(onValueChange).toHaveBeenLastCalledWith(['email', 'chat'], expect.anything())
  })

  test('a switch card toggles from the card and from the keyboard', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    render(<ChoiceCard control="switch" title="Cache dependencies" description="Reuse installs" onCheckedChange={onCheckedChange} />)
    const toggle = screen.getByRole('switch', { name: /Cache dependencies/ })
    await user.click(screen.getByText('Reuse installs'))
    expect(onCheckedChange).toHaveBeenLastCalledWith(true)
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    toggle.focus()
    await user.keyboard(' ')
    expect(onCheckedChange).toHaveBeenLastCalledWith(false)
  })

  test('the badge, note, icon and children render, the icon hidden from assistive tech', () => {
    render(
      <ChoiceCard control="checkbox" title="Queue" badge="Suggested" note="No extra cost" icon={<svg data-testid="icon" />}>
        <span>A meter</span>
      </ChoiceCard>,
    )
    expect(screen.getByText('Suggested')).toHaveAttribute('data-slot', 'badge')
    expect(screen.getByText('No extra cost')).toBeInTheDocument()
    expect(screen.getByText('A meter')).toBeInTheDocument()
    expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true')
  })

  test('a disabled card cannot be chosen', async () => {
    const user = userEvent.setup()
    render(
      <ChoiceCardGroup aria-label="Plan" defaultValue="a">
        <ChoiceCard value="a" title="First" />
        <ChoiceCard value="b" title="Second" disabled />
      </ChoiceCardGroup>,
    )
    await user.click(screen.getByText('Second'))
    expect(screen.getByRole('radio', { name: /First/ })).toHaveAttribute('aria-checked', 'true')
  })
})
