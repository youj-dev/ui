import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { de } from '@youj/core/locales/de'
import { InspectorPanel, InspectorRow, type InspectorPanelProps } from './inspector-panel'

function setup(props: Partial<InspectorPanelProps> = {}) {
  return render(
    <YoujProvider reducedMotion="always">
      <InspectorPanel title="Drop shadow" {...props}>
        <InspectorRow label="Position">
          <input aria-label="X" />
          <input aria-label="Y" />
        </InspectorRow>
      </InspectorPanel>
    </YoujProvider>,
  )
}

describe('InspectorPanel', () => {
  test('is a section named by its title, with rows that name their fields', () => {
    setup()
    const panel = screen.getByRole('region', { name: 'Drop shadow' })
    expect(panel).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Position' })).toContainElement(screen.getByRole('textbox', { name: 'X' }))
  })

  test('shows only the header parts it is given', () => {
    setup()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Hide' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove Drop shadow' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Collapse' })).toBeInTheDocument()
  })

  test('the checkbox, eye, plus and trash report what was pressed', async () => {
    const user = userEvent.setup()
    const onEnabledChange = vi.fn()
    const onVisibleChange = vi.fn()
    const onAdd = vi.fn()
    const onRemove = vi.fn()
    setup({ enabled: true, onEnabledChange, visible: true, onVisibleChange, onAdd, onRemove })
    await user.click(screen.getByRole('checkbox', { name: 'Enable Drop shadow' }))
    expect(onEnabledChange).toHaveBeenLastCalledWith(false)
    await user.click(screen.getByRole('button', { name: 'Hide' }))
    expect(onVisibleChange).toHaveBeenLastCalledWith(false)
    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(onAdd).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: 'Remove Drop shadow' }))
    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  test('the eye names what it will do: Show while hidden', () => {
    setup({ visible: false })
    expect(screen.getByRole('button', { name: 'Show' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('switched off, the body is dimmed and every field in it is disabled', () => {
    setup({ enabled: false })
    expect(screen.getByRole('textbox', { name: 'X' })).toBeDisabled()
    expect(screen.getByRole('checkbox')).not.toBeDisabled()
  })

  test('the chevron collapses and expands the body, and reports it', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    setup({ onOpenChange })
    const toggle = screen.getByRole('button', { name: 'Collapse' })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await user.click(toggle)
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    expect(screen.getByRole('button', { name: 'Expand' })).toHaveAttribute('aria-expanded', 'false')
  })

  test('a title with types is a menu that changes the type from the keyboard', async () => {
    const user = userEvent.setup()
    function Typed() {
      const [type, setType] = useState('drop')
      return (
        <YoujProvider reducedMotion="always">
          <InspectorPanel
            title={type === 'drop' ? 'Drop shadow' : 'Inner shadow'}
            types={[
              { value: 'drop', label: 'Drop shadow' },
              { value: 'inner', label: 'Inner shadow' },
            ]}
            type={type}
            onTypeChange={setType}
          />
        </YoujProvider>
      )
    }
    render(<Typed />)
    const trigger = screen.getByRole('button', { name: 'Change type, Drop shadow' })
    trigger.focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('menuitemradio', { name: 'Drop shadow' })).toBeChecked()
    await user.keyboard('{ArrowDown}{Enter}')
    expect(screen.getByRole('region', { name: 'Inner shadow' })).toBeInTheDocument()
  })

  test('speaks the labels of the provider', () => {
    render(
      <YoujProvider labels={de} reducedMotion="always">
        <InspectorPanel title="Schatten" enabled visible onAdd={() => {}} onRemove={() => {}} />
      </YoujProvider>,
    )
    expect(screen.getByRole('button', { name: 'Ausblenden' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Einklappen' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Aktivieren Schatten' })).toBeInTheDocument()
  })
})
