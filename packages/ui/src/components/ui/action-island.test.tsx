import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActionIsland, ActionIslandGroup, ActionIslandMark, ActionIslandSeparator, ActionIslandTile } from './action-island'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu'

function Island() {
  return (
    <ActionIsland aria-label="Preview actions">
      <ActionIslandMark>Card</ActionIslandMark>
      <ActionIslandGroup aria-label="View">
        <ActionIslandTile label="Preview" pressed>
          P
        </ActionIslandTile>
        <ActionIslandTile label="Code" pressed={false}>
          C
        </ActionIslandTile>
      </ActionIslandGroup>
      <ActionIslandSeparator />
      <DropdownMenu>
        <ActionIslandTile label="More" render={<DropdownMenuTrigger />}>
          M
        </ActionIslandTile>
        <DropdownMenuContent>
          <DropdownMenuItem>Copy code</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ActionIslandTile label="Open" variant="primary" showLabel>
        <svg aria-hidden />
      </ActionIslandTile>
    </ActionIsland>
  )
}

const tile = (name: string) => screen.getByRole('button', { name })

describe('ActionIsland', () => {
  test('is a toolbar named by its label, with tiles named by their labels', () => {
    render(<Island />)
    expect(screen.getByRole('toolbar', { name: 'Preview actions' })).toBeInTheDocument()
    for (const name of ['Preview', 'Code', 'More', 'Open']) expect(tile(name)).toBeInTheDocument()
  })

  test('pressed tiles report aria-pressed', () => {
    render(<Island />)
    expect(tile('Preview')).toHaveAttribute('aria-pressed', 'true')
    expect(tile('Code')).toHaveAttribute('aria-pressed', 'false')
  })

  test('the primary tile is marked by its variant', () => {
    render(<Island />)
    expect(tile('Open')).toHaveAttribute('data-variant', 'primary')
    expect(tile('Code')).toHaveAttribute('data-variant', 'quiet')
  })

  test('is one tab stop; the arrows rove the tiles and wrap, skipping the mark', async () => {
    const user = userEvent.setup()
    render(<Island />)
    await user.tab()
    expect(tile('Preview')).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(tile('Code')).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(tile('More')).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(tile('Open')).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(tile('Preview')).toHaveFocus()
    await user.tab()
    expect(document.body).toHaveFocus()
  })

  test('the mark is not a control', () => {
    render(<Island />)
    expect(screen.getByText('Card')).not.toHaveAttribute('tabindex')
    expect(screen.queryByRole('button', { name: 'Card' })).toBeNull()
  })

  test('a tile can carry a menu trigger that opens its menu', async () => {
    const user = userEvent.setup()
    render(<Island />)
    await user.click(tile('More'))
    expect(await screen.findByRole('menuitem', { name: 'Copy code' })).toBeInTheDocument()
  })
})
