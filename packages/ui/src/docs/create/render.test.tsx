import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { DEFAULT_FRAME, type FrameConfig } from './config'
import { FramePreview } from './render'

/* The preview's nav is the frame's screens: following it shows each one in
 * the frame, a screen just added opens, and a frame with none says so. */

function Preview({ config }: { config: FrameConfig }) {
  return (
    <YoujProvider reducedMotion="always">
      <FramePreview config={config} />
    </YoujProvider>
  )
}

const link = (name: string) => screen.getAllByRole('link', { name: new RegExp(`^${name}`) })[0]!

describe('FramePreview', () => {
  test('the nav lists the frame’s screens, and opens on the first', () => {
    render(<Preview config={DEFAULT_FRAME} />)
    expect(link('Analytics overview')).toHaveAttribute('aria-current', 'page')
    expect(link('Task board')).toBeInTheDocument()
    expect(link('Settings')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /^Inbox/ })).not.toBeInTheDocument()
  })

  test('following the nav shows each screen in the frame', async () => {
    const user = userEvent.setup()
    render(<Preview config={DEFAULT_FRAME} />)
    await user.click(link('Settings'))
    expect(link('Settings')).toHaveAttribute('aria-current', 'page')
    expect(await screen.findByText(/Manage your profile, your team/)).toBeInTheDocument()
  })

  test('a screen just added opens, and one removed gives way to the first', async () => {
    const { rerender } = render(<Preview config={{ ...DEFAULT_FRAME, screens: ['app-task-board'] }} />)
    rerender(<Preview config={{ ...DEFAULT_FRAME, screens: ['app-task-board', 'app-settings'] }} />)
    expect(link('Settings')).toHaveAttribute('aria-current', 'page')
    rerender(<Preview config={{ ...DEFAULT_FRAME, screens: ['app-task-board'] }} />)
    expect(link('Task board')).toHaveAttribute('aria-current', 'page')
  })

  test('a frame with no screens holds an empty page that says so', () => {
    render(<Preview config={{ ...DEFAULT_FRAME, screens: [] }} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Your app')
    expect(screen.getByText('No screens yet')).toBeInTheDocument()
  })
})
