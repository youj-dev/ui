import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ActionList, ActionListItem } from './action-list'

describe('ActionList', () => {
  test('is a section named by its title, with a count, a description, a header action and a list of rows', () => {
    render(
      <ActionList title="Waiting on you" count={7} description="Most urgent first" action={<a href="/all">View all</a>}>
        <ActionListItem key="a" title="Rotate the signing key" detail="It expires on Nov 2" meta="Nov 2" action={<button type="button">Rotate</button>} />
        <ActionListItem key="b" title="Update the card" />
      </ActionList>,
    )
    const section = screen.getByRole('region', { name: 'Waiting on you' })
    expect(within(section).getByRole('heading', { level: 3 })).toHaveTextContent('Waiting on you')
    expect(section.querySelector('[data-slot=action-list-count]')).toHaveTextContent('7')
    expect(within(section).getByText('Most urgent first')).toBeInTheDocument()
    expect(within(section).getByRole('link', { name: 'View all' })).toHaveAttribute('href', '/all')
    const rows = within(within(section).getByRole('list')).getAllByRole('listitem')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('Rotate the signing key')
    expect(rows[0]).toHaveTextContent('It expires on Nov 2')
    expect(within(rows[0]!).getByRole('button', { name: 'Rotate' })).toBeInTheDocument()
  })

  test('the icon tile is decorative and takes the row’s tone; the chip takes its own', () => {
    render(
      <ActionList>
        <ActionListItem key="a" icon={<svg data-testid="icon" />} tone="danger" title="Two admins without 2FA" meta="Today" metaTone="warning" />
      </ActionList>,
    )
    const tile = screen.getByTestId('icon').parentElement!
    expect(tile).toHaveAttribute('aria-hidden', 'true')
    expect(tile.className).toContain('own:bg-danger-subtle')
    const chip = document.querySelector('[data-slot=action-list-meta]')!
    expect(chip).toHaveAttribute('data-tone', 'warning')
    expect(chip).toHaveTextContent('Today')
  })

  test('an emphasised row says so, and the heading level follows headingLevel', () => {
    render(
      <ActionList title="Finish setting up" headingLevel={2}>
        <ActionListItem key="a" emphasis tone="accent" title="Create a production key" />
        <ActionListItem key="b" title="Set a spend alert" />
      </ActionList>,
    )
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Finish setting up')
    const [first, second] = screen.getAllByRole('listitem')
    expect(first).toHaveAttribute('data-variant', 'emphasis')
    expect(second).toHaveAttribute('data-variant', 'default')
  })

  test('without a title or action there is no header, and the section is unnamed', () => {
    render(
      <ActionList>
        <ActionListItem key="a" title="One thing" />
      </ActionList>,
    )
    expect(document.querySelector('[data-slot=action-list-header]')).toBeNull()
    expect(document.querySelector('[data-slot=action-list]')).not.toHaveAttribute('aria-labelledby')
  })

  test('a removed row leaves the list', async () => {
    function Live() {
      const [rows, setRows] = useState(['a', 'b'])
      return (
        <ActionList title="Review">
          {rows.map((id) => (
            <ActionListItem key={id} title={`Row ${id}`} action={<button type="button" onClick={() => setRows((r) => r.filter((x) => x !== id))}>{`Resolve ${id}`}</button>} />
          ))}
        </ActionList>
      )
    }
    render(
      <YoujProvider reducedMotion="always">
        <Live />
      </YoujProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Resolve a' }))
    await waitFor(() => expect(screen.queryByText('Row a')).toBeNull())
    expect(screen.getByText('Row b')).toBeInTheDocument()
  })
})
