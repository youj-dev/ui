import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { AvatarStack, type AvatarStackUser } from './avatar-stack'

const users: AvatarStackUser[] = [
  { id: '1', name: 'Mira Chen', presence: 'online', description: 'Design' },
  { id: '2', name: 'Jonas Weber', presence: 'away' },
  { id: '3', name: 'Priya Natarajan' },
  { id: '4', name: 'Sam Okafor', presence: 'busy' },
  { id: '5', name: 'Inès Laurent' },
  { id: '6', name: 'Kenji Mori' },
]

const avatars = () => document.querySelectorAll('[data-slot=avatar-stack] > [data-slot=avatar]')

describe('AvatarStack', () => {
  test('a group named with everyone in it', () => {
    render(<AvatarStack users={users} label="Collaborators" />)
    expect(screen.getByRole('group', { name: 'Collaborators: Mira Chen, Jonas Weber and 4 others' })).toBeInTheDocument()
  })

  test('shows `max` avatars and counts the rest', () => {
    render(<AvatarStack users={users} max={3} label="Collaborators" />)
    expect(avatars()).toHaveLength(3)
    expect(screen.getByRole('button', { name: 'Show all 6 collaborators' })).toHaveTextContent('+3')
  })

  test('one over max shows the face instead of "+1"', () => {
    render(<AvatarStack users={users.slice(0, 5)} max={4} />)
    expect(avatars()).toHaveLength(5)
    expect(screen.queryByRole('button')).toBeNull()
  })

  test('"+N" opens the full list with each status written out, and Escape returns focus', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="always">
        <AvatarStack users={users} max={2} label="Collaborators" />
      </YoujProvider>,
    )
    const trigger = screen.getByRole('button', { name: 'Show all 6 collaborators' })
    await user.click(trigger)
    const dialog = await screen.findByRole('dialog')
    const rows = within(dialog).getAllByRole('listitem')
    expect(rows).toHaveLength(6)
    expect(rows[0]).toHaveTextContent('Mira Chen')
    expect(rows[0]).toHaveTextContent('Design')
    expect(rows[0]).toHaveTextContent('Online')
    expect(rows[3]).toHaveTextContent('Busy')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(trigger).toHaveFocus()
  })

  test('presence dots follow status, and a change remounts the dot', () => {
    const { rerender } = render(<AvatarStack users={users} max={4} />)
    const dot = () => avatars()[0]!.querySelector('[data-slot=avatar-badge]')!
    expect(dot()).toHaveAttribute('data-presence', 'online')
    const before = dot()
    rerender(<AvatarStack users={[{ ...users[0]!, presence: 'busy' }, ...users.slice(1)]} max={4} />)
    expect(dot()).toHaveAttribute('data-presence', 'busy')
    expect(dot()).not.toBe(before)
    expect(avatars()[2]!.querySelector('[data-slot=avatar-badge]')).toBeNull()
  })

  test('earlier avatars stack above later ones, and reduced motion marks the stack', () => {
    render(
      <YoujProvider reducedMotion="always">
        <AvatarStack users={users} max={3} />
      </YoujProvider>,
    )
    const z = Array.from(avatars(), (a) => Number((a as HTMLElement).style.zIndex))
    expect(z).toEqual([3, 2, 1])
    expect(document.querySelector('[data-slot=avatar-stack]')).toHaveAttribute('data-reduced-motion')
  })
})
