import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ColorPicker } from './color-picker'
import { YoujProvider } from '@youj/core'

function Controlled({ initial = '#3554fc', onChange, format }: { initial?: string; onChange?: (v: string) => void; format?: 'hex' | 'oklch' }) {
  const [value, setValue] = useState(initial)
  return (
    <ColorPicker
      aria-label="Brand color"
      format={format}
      value={value}
      onValueChange={(v) => {
        setValue(v)
        onChange?.(v)
      }}
      swatches={[
        { value: '#e5484d', label: 'Red' },
        { value: 'oklch(0.62 0.21 330)', label: 'Orchid' },
      ]}
    />
  )
}

async function open() {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: /Brand color/ }))
  return user
}

describe('ColorPicker', () => {
  test('the trigger names the colour and opens the panel', async () => {
    render(<Controlled />)
    expect(screen.getByRole('button', { name: 'Brand color, #3554fc' })).toBeInTheDocument()
    await open()
    expect(screen.getByRole('dialog', { name: 'Brand color' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: 'Saturation and brightness' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Hex' })).toHaveValue('#3554FC')
    expect(screen.getByRole('textbox', { name: 'OKLCH' })).toHaveValue('0.54 0.249 268')
  })

  test('arrow keys step saturation and brightness', async () => {
    const onChange = vi.fn()
    render(<Controlled initial="#808080" onChange={onChange} />)
    const user = await open()
    const area = screen.getByRole('slider', { name: 'Saturation and brightness' })
    expect(area).toHaveAttribute('aria-valuetext', 'Saturation 0%, brightness 50%')
    area.focus()
    await user.keyboard('{Shift>}{ArrowUp}{/Shift}')
    expect(area).toHaveAttribute('aria-valuetext', 'Saturation 0%, brightness 60%')
    await user.keyboard('{ArrowRight}')
    expect(area).toHaveAttribute('aria-valuenow', '1')
    expect(onChange).toHaveBeenCalled()
  })

  test('a hex typed in the field commits on Enter; nonsense is marked and put back', async () => {
    const onChange = vi.fn()
    render(<Controlled onChange={onChange} />)
    const user = await open()
    const hex = screen.getByRole('textbox', { name: 'Hex' })
    await user.clear(hex)
    await user.type(hex, '#10b981{Enter}')
    expect(onChange).toHaveBeenLastCalledWith('#10b981')
    await user.clear(hex)
    await user.type(hex, 'nope')
    expect(hex).toHaveAttribute('aria-invalid', 'true')
    await user.tab()
    expect(hex).toHaveValue('#10B981')
  })

  test('an OKLCH value commits too', async () => {
    const onChange = vi.fn()
    render(<Controlled onChange={onChange} />)
    const user = await open()
    const field = screen.getByRole('textbox', { name: 'OKLCH' })
    await user.clear(field)
    await user.type(field, '0.62 0.21 330{Enter}')
    expect(onChange).toHaveBeenLastCalledWith('#c849c1')
  })

  test('swatches pick their colour and show which is current', async () => {
    render(<Controlled />)
    const user = await open()
    const orchid = screen.getByRole('button', { name: 'Orchid' })
    expect(orchid).toHaveAttribute('aria-pressed', 'false')
    await user.click(orchid)
    expect(orchid).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Brand color, #c849c1' })).toBeInTheDocument()
  })

  test('format="oklch" reports OKLCH strings', async () => {
    const onChange = vi.fn()
    render(<Controlled format="oklch" onChange={onChange} />)
    const user = await open()
    await user.click(screen.getByRole('button', { name: 'Red' }))
    expect(onChange.mock.lastCall![0]).toMatch(/^oklch\(0\.6\d* 0\.\d+ \d+(\.\d)?\)$/)
  })

  test('the hue survives a trip through grey', async () => {
    render(<Controlled initial="#e5484d" />)
    await open()
    const area = screen.getByRole('slider', { name: 'Saturation and brightness' })
    const hue = () => screen.getAllByRole('slider', { hidden: true }).find((s) => s.getAttribute('aria-label') === 'Hue')!
    const before = hue().getAttribute('aria-valuenow')
    area.focus()
    for (let i = 0; i < 11; i++) fireEvent.keyDown(area, { key: 'ArrowLeft', shiftKey: true })
    expect(area).toHaveAttribute('aria-valuenow', '0')
    expect(hue()).toHaveAttribute('aria-valuenow', before)
  })

  test('the eyedropper shows only where the browser has one', async () => {
    render(<Controlled />)
    await open()
    expect(screen.queryByRole('button', { name: 'Pick a color from the screen' })).not.toBeInTheDocument()
  })
})

describe('ColorPicker on touch', () => {
  test('is a sheet whose colour area and hue slider own their drag', async () => {
    render(
      <YoujProvider device="touch">
        <Controlled />
      </YoujProvider>,
    )
    await open()
    const sheet = screen.getByRole('dialog', { name: 'Brand color' })
    expect(sheet).toHaveAttribute('data-sheet-popup')
    expect(sheet.querySelector('[data-slot=sheet-handle]')).not.toBeNull()
    const area = screen.getByRole('slider', { name: 'Saturation and brightness' }).parentElement!
    expect(area).toHaveAttribute('data-sheet-no-drag')
    expect(sheet.querySelector('[data-slot=slider]')).toHaveAttribute('data-sheet-no-drag')
    // Swatches are 44px targets on touch.
    expect(screen.getByRole('button', { name: 'Red' })).toHaveClass('touch:size-11')
  })

  test('dragging down through the colour area changes the colour and keeps the sheet open', async () => {
    const onChange = vi.fn()
    render(
      <YoujProvider device="touch">
        <Controlled onChange={onChange} />
      </YoujProvider>,
    )
    await open()
    const area = screen.getByRole('slider', { name: 'Saturation and brightness' }).parentElement!
    area.setPointerCapture = () => {}
    area.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100, x: 0, y: 0, toJSON: () => ({}) })
    fireEvent.pointerDown(area, { clientX: 100, clientY: 10, button: 0, pointerId: 1 })
    fireEvent.pointerMove(area, { clientX: 100, clientY: 400, pointerId: 1 })
    fireEvent.pointerUp(area, { clientX: 100, clientY: 400, pointerId: 1 })
    expect(onChange).toHaveBeenLastCalledWith('#000000')
    expect(screen.getByRole('dialog', { name: 'Brand color' })).toBeInTheDocument()
  })

  test('presentation="popover" keeps the popover on touch', async () => {
    render(
      <YoujProvider device="touch">
        <ColorPicker aria-label="Brand color" presentation="popover" />
      </YoujProvider>,
    )
    await open()
    const dialog = screen.getByRole('dialog', { name: 'Brand color' })
    expect(dialog).toHaveClass('yj-pop')
    expect(dialog).not.toHaveAttribute('data-sheet-popup')
  })
})
