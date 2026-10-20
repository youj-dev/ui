import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SoundCueContext } from '@youj/core/internal'
import { CapsuleToggle } from './capsule-toggle'

const OPTIONS = [
  { value: 'source', label: 'Source' },
  { value: 'mix', label: 'Mix' },
  { value: 'master', label: 'Master' },
]

describe('CapsuleToggle', () => {
  test('is a group named by its eyebrow, with the choice pressed', () => {
    render(<CapsuleToggle label="Monitor" defaultValue="mix" options={OPTIONS} />)
    expect(screen.getByRole('group', { name: 'Monitor' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mix' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Source' })).toHaveAttribute('aria-pressed', 'false')
    expect(document.querySelector('[data-slot=capsule-toggle]')).toHaveAttribute('data-capsule')
  })

  test('arrows rove, a press chooses, and pressing the choice again keeps it', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const sink = vi.fn()
    render(
      <SoundCueContext.Provider value={sink}>
        <CapsuleToggle aria-label="Monitor" defaultValue="mix" options={OPTIONS} onValueChange={onValueChange} />
      </SoundCueContext.Provider>,
    )
    await user.click(screen.getByRole('button', { name: 'Master' }))
    expect(onValueChange).toHaveBeenLastCalledWith('master')
    expect(sink).toHaveBeenCalledWith('select', false)
    await user.click(screen.getByRole('button', { name: 'Master' }))
    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Master' })).toHaveAttribute('aria-pressed', 'true')
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('button', { name: 'Mix' })).toHaveFocus()
  })

  test('iconOnly names each option by its label', () => {
    render(
      <CapsuleToggle
        aria-label="Layout"
        iconOnly
        defaultValue="grid"
        options={[
          { value: 'grid', label: 'Grid', icon: <svg /> },
          { value: 'list', label: 'List', icon: <svg /> },
        ]}
      />,
    )
    expect(screen.getByRole('button', { name: 'Grid' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'List' })).not.toHaveTextContent('List')
  })
})
