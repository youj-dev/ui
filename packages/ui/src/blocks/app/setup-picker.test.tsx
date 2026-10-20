import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { SetupPicker } from './setup-picker'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

const drawingOf = (shape: string) => document.querySelector(`svg[data-shape=${shape}]`)!

describe('setup picker', () => {
  test('a page named by its h1, with the three shapes as one radio group', () => {
    reduced(<SetupPicker />)
    expect(screen.getByRole('region', { name: 'New database' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'New database' })).toBeInTheDocument()
    const group = screen.getByRole('radiogroup', { name: 'How should it run?' })
    expect(within(group).getAllByRole('radio')).toHaveLength(3)
    expect(within(group).getByRole('radio', { name: /^Replicated/ })).toBeChecked()
  })

  test('the chosen plan is built and the others stay wireframes; the drawings are decorative', () => {
    reduced(<SetupPicker />)
    expect(drawingOf('replicated')).toHaveAttribute('data-chosen', 'true')
    expect(drawingOf('single')).not.toHaveAttribute('data-chosen')
    for (const svg of document.querySelectorAll('svg[data-shape]')) expect(svg).toHaveAttribute('aria-hidden', 'true')
  })

  test('arrow keys move the choice, rebuild its plan and say what it means', async () => {
    const user = userEvent.setup()
    reduced(<SetupPicker />)
    screen.getByRole('radio', { name: /^Replicated/ }).focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: /^Multi-region/ })).toBeChecked()
    expect(drawingOf('regions')).toHaveAttribute('data-chosen', 'true')
    expect(drawingOf('replicated')).not.toHaveAttribute('data-chosen')
    expect(screen.getByText(/reads served from the nearest one/)).toBeInTheDocument()
  })

  test('Continue saves the shape in view', async () => {
    const user = userEvent.setup()
    const onContinue = vi.fn()
    reduced(<SetupPicker defaultShape="single" onContinue={onContinue} />)
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(onContinue).toHaveBeenCalledWith('single')
  })

  test('embedded: a section named by an h2; every string follows copy', () => {
    reduced(<SetupPicker embedded copy={{ title: 'Neue Datenbank', question: 'Wie soll sie laufen?' }} />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Neue Datenbank' })).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: 'Wie soll sie laufen?' })).toBeInTheDocument()
  })

  test('options are data: your ids, words and drawings drive the cards, and Continue gives your id', async () => {
    const user = userEvent.setup()
    const onContinue = vi.fn()
    reduced(
      <SetupPicker
        defaultShape="mesh"
        onContinue={onContinue}
        copy={{
          question: 'How should the office connect?',
          options: [
            { id: 'router', shape: 'single', title: 'Single router', detail: '1 device', summary: 'One router covers a small office.' },
            { id: 'mesh', shape: 'replicated', title: 'Mesh', detail: '3 access points', summary: 'Traffic reroutes if one drops out.' },
          ],
        }}
      />,
    )
    const group = screen.getByRole('radiogroup', { name: 'How should the office connect?' })
    expect(within(group).getAllByRole('radio')).toHaveLength(2)
    expect(within(group).getByRole('radio', { name: /^Mesh/ })).toBeChecked()
    expect(screen.getByText('Traffic reroutes if one drops out.')).toBeInTheDocument()
    expect(drawingOf('replicated')).toHaveAttribute('data-chosen', 'true')
    await user.click(within(group).getByRole('radio', { name: /^Single router/ }))
    expect(drawingOf('single')).toHaveAttribute('data-chosen', 'true')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(onContinue).toHaveBeenCalledWith('router')
  })
})
