import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { CapsulePlayer, type CapsulePlayerProps } from './capsule-player'

const setup = (props: Partial<CapsulePlayerProps> = {}) => {
  const handlers = { onPlayingChange: vi.fn(), onSeek: vi.fn(), onPrevious: vi.fn(), onNext: vi.fn() }
  render(
    <YoujProvider reducedMotion="always">
      <CapsulePlayer title="Low Tide" subtitle="Mara Quell" playing={false} position={72} duration={220} locale="en-US" {...handlers} {...props} />
    </YoujProvider>,
  )
  return handlers
}

describe('CapsulePlayer', () => {
  test('the play disc is named for what it will do', async () => {
    const user = userEvent.setup()
    const { onPlayingChange } = setup()
    await user.click(screen.getByRole('button', { name: 'Play' }))
    expect(onPlayingChange).toHaveBeenCalledWith(true)
  })

  test('while playing it offers Pause', async () => {
    const user = userEvent.setup()
    const { onPlayingChange } = setup({ playing: true })
    await user.click(screen.getByRole('button', { name: 'Pause' }))
    expect(onPlayingChange).toHaveBeenCalledWith(false)
    expect(document.querySelector('[data-slot=capsule-player]')).toHaveAttribute('data-playing')
  })

  test('skips, and disables a skip it has no handler for', async () => {
    const user = userEvent.setup()
    const { onNext } = setup({ onPrevious: undefined })
    expect(screen.getByRole('button', { name: 'Previous track' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Next track' }))
    expect(onNext).toHaveBeenCalledOnce()
  })

  test('the rail is a seek slider spoken as time of length; arrows seek on a five-second grid', async () => {
    const user = userEvent.setup()
    const { onSeek } = setup()
    const rail = screen.getByRole('slider', { hidden: true })
    expect(rail).toHaveAttribute('aria-label', 'Seek')
    expect(rail).toHaveAttribute('aria-valuetext', '1:12 of 3:40')
    rail.focus()
    await user.keyboard('{ArrowRight}')
    expect(onSeek).toHaveBeenLastCalledWith(75)
    expect(screen.getByText('1:12')).toHaveAttribute('data-slot', 'capsule-player-time')
  })

  test('without onSeek the rail only shows progress', () => {
    setup({ onSeek: undefined })
    expect(screen.getByRole('slider', { hidden: true })).toBeDisabled()
  })
})
