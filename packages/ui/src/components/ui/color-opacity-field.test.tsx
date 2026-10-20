import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { de } from '@youj/core/locales/de'
import { ColorOpacityField, type ColorOpacityFieldProps } from './color-opacity-field'

function setup(props: Partial<ColorOpacityFieldProps> = {}) {
  const onValueChange = vi.fn()
  render(
    <YoujProvider reducedMotion="always">
      <ColorOpacityField onValueChange={onValueChange} {...props} />
    </YoujProvider>,
  )
  return { onValueChange, hex: screen.getByRole('textbox', { name: 'Hex color' }), opacity: screen.getByRole('spinbutton', { name: 'Opacity' }) }
}

describe('ColorOpacityField', () => {
  test('is one group with one label, holding the swatch, the hex and the opacity', () => {
    const { hex, opacity } = setup({ defaultValue: { color: '#ff8800', opacity: 40 } })
    const group = screen.getByRole('group', { name: 'Color' })
    expect(group).toContainElement(hex)
    expect(group).toContainElement(opacity)
    expect(hex).toHaveValue('FF8800')
    expect(opacity).toHaveValue('40')
    expect(screen.getByRole('button', { name: 'Color, #ff8800' })).toBeInTheDocument()
  })

  test.each([
    ['f80', '#ff8800', undefined],
    ['#ff8800', '#ff8800', undefined],
    ['FF8800', '#ff8800', undefined],
    ['#f808', '#ff8800', 53],
    ['ff880080', '#ff8800', 50],
  ])('reads %s as %s', async (text, color, alpha) => {
    const user = userEvent.setup()
    const { hex, onValueChange } = setup({ defaultValue: { color: '#000000', opacity: 100 } })
    await user.clear(hex)
    await user.type(hex, `${text}{Enter}`)
    expect(onValueChange).toHaveBeenLastCalledWith({ color, opacity: alpha ?? 100 })
    expect(hex).toHaveValue(color.slice(1).toUpperCase())
  })

  test('pastes a color, with or without the #, and an 8-digit paste sets the opacity', () => {
    const { hex, onValueChange } = setup({ defaultValue: { color: '#000000', opacity: 100 } })
    fireEvent.paste(hex, { clipboardData: { getData: () => '#3366CC' } })
    expect(onValueChange).toHaveBeenLastCalledWith({ color: '#3366cc', opacity: 100 })
    fireEvent.paste(hex, { clipboardData: { getData: () => '3366cc40' } })
    expect(onValueChange).toHaveBeenLastCalledWith({ color: '#3366cc', opacity: 25 })
  })

  test('marks unreadable text invalid and puts the color back on blur or Escape', async () => {
    const user = userEvent.setup()
    const { hex, onValueChange } = setup({ defaultValue: { color: '#336699', opacity: 100 } })
    await user.clear(hex)
    await user.type(hex, 'zzz')
    expect(hex).toHaveAttribute('aria-invalid', 'true')
    await user.tab()
    expect(hex).toHaveValue('336699')
    expect(hex).not.toHaveAttribute('aria-invalid')
    await user.clear(hex)
    await user.type(hex, '12{Escape}')
    expect(hex).toHaveValue('336699')
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test('the opacity is clamped to 0 to 100 and steps with the arrow keys', async () => {
    const user = userEvent.setup()
    const { opacity, onValueChange } = setup({ defaultValue: { color: '#000000', opacity: 98 } })
    opacity.focus()
    await user.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}')
    expect(opacity).toHaveValue('100')
    await user.clear(opacity)
    await user.type(opacity, '-20{Enter}')
    expect(onValueChange).toHaveBeenLastCalledWith({ color: '#000000', opacity: 0 })
  })

  test('controlled, it reports changes and shows the value it is given', async () => {
    const user = userEvent.setup()
    const { hex, onValueChange } = setup({ value: { color: '#112233', opacity: 70 } })
    await user.clear(hex)
    await user.type(hex, 'abcdef{Enter}')
    expect(onValueChange).toHaveBeenLastCalledWith({ color: '#abcdef', opacity: 70 })
    expect(hex).toHaveValue('112233')
  })

  test('speaks the labels of the provider', () => {
    render(
      <YoujProvider labels={de}>
        <ColorOpacityField />
      </YoujProvider>,
    )
    expect(screen.getByRole('group', { name: 'Farbe' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Hex-Farbe' })).toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: 'Deckkraft' })).toBeInTheDocument()
  })
})
