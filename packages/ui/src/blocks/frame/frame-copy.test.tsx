import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { FrameAccountMenu } from './account-menu'
import { AppFrame } from './shell'
import { NAV, USER } from './shell/data'
import { FrameSidebarWorkspace } from './sidebar-workspace'

/* The frame parts' built-in strings come from `copy`, and the account's
 * standard rows reach the app through `onSelect`. */

const frame = (sidebar: ReactNode) =>
  render(
    <YoujProvider reducedMotion="always">
      <AppFrame nav={NAV} sidebar={sidebar} />
    </YoujProvider>,
  )

describe('frame parts copy and callbacks', () => {
  test('the account menu’s standard rows take copy and report the chosen row', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <YoujProvider reducedMotion="always">
        <FrameAccountMenu user={USER} onSelect={onSelect} copy={{ settings: 'Preferences' }} />
      </YoujProvider>,
    )
    await user.click(screen.getByRole('button'))
    await user.click(await screen.findByRole('menuitem', { name: /Preferences/ }))
    expect(onSelect).toHaveBeenCalledWith('settings')
  })

  test('the workspace sidebar’s field reads its copy', () => {
    frame(<FrameSidebarWorkspace copy={{ search: 'Find a page', placeholder: 'Type to find…' }} />)
    expect(screen.getByRole('combobox', { name: 'Find a page' })).toHaveAttribute('placeholder', 'Type to find…')
  })

  test('the workspace sidebar’s Needs you and setup card read their copy', () => {
    frame(
      <FrameSidebarWorkspace
        copy={{ needsYou: 'For you', next: 'Weiter' }}
        signals={[{ id: 's', page: 'inbox', title: 'Hi', priority: 'normal', time: '1m' }]}
        setup={{ title: 'Invite your team', done: 1, total: 3 }}
      />,
    )
    expect(screen.getAllByText('For you').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Weiter' })).toBeInTheDocument()
  })
})
