import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { AppFrame } from './shell'
import { NAV } from './shell/data'
import { FrameSearchPalette } from './search-palette'
import { FrameTopbarBreadcrumb } from './topbar-breadcrumb'

/* The palette's actions as data: the app's commands are listed under
 * Actions, found by their keywords, and choosing one closes the palette and
 * reaches `onCommand`. */

describe('FrameSearchPalette commands', () => {
  test('lists your commands and hands the chosen one to onCommand', async () => {
    const user = userEvent.setup()
    const onCommand = vi.fn()
    const commands = [
      { id: 'new-order', label: 'New order', shortcut: '⌘O' },
      { id: 'refund', label: 'Issue a refund', keywords: ['money back'] },
    ]
    render(
      <YoujProvider reducedMotion="always">
        <AppFrame nav={NAV} topbar={<FrameTopbarBreadcrumb search={<FrameSearchPalette commands={commands} onCommand={onCommand} />} />} />
      </YoujProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Search' }))
    await screen.findByRole('dialog')
    expect(screen.getByRole('option', { name: /New order/ })).toHaveTextContent('⌘O')
    expect(screen.queryByRole('option', { name: /Invite people/ })).not.toBeInTheDocument()
    await user.keyboard('money back{Enter}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(onCommand).toHaveBeenCalledWith(commands[1])
  })
})
