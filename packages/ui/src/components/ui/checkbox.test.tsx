import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Checkbox, CheckboxMark } from './checkbox'
import { Field, FieldLabel } from './field'

describe('Checkbox', () => {
  test('click and Space toggle; Enter does not', async () => {
    const user = userEvent.setup()
    render(<Checkbox aria-label="Remember me" />)
    const box = screen.getByRole('checkbox', { name: 'Remember me' })
    expect(box).toHaveAttribute('aria-checked', 'false')
    await user.click(box)
    expect(box).toHaveAttribute('aria-checked', 'true')
    await user.keyboard(' ')
    expect(box).toHaveAttribute('aria-checked', 'false')
    await user.keyboard('{Enter}')
    expect(box).toHaveAttribute('aria-checked', 'false')
  })

  test('controlled: reports the change, the prop decides', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    render(<Checkbox aria-label="Locked" checked={false} onCheckedChange={onCheckedChange} />)
    const box = screen.getByRole('checkbox', { name: 'Locked' })
    await user.click(box)
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything())
    expect(box).toHaveAttribute('aria-checked', 'false')
  })

  test('indeterminate reports mixed and draws the dash through the middle', () => {
    render(<Checkbox aria-label="All" indeterminate />)
    const box = screen.getByRole('checkbox', { name: 'All' })
    expect(box).toHaveAttribute('aria-checked', 'mixed')
    const stroke = box.querySelector('[data-slot=checkbox-check]')!
    expect(stroke).toHaveAttribute('data-shape', 'dash')
    expect(stroke).toHaveAttribute('d', 'M6.5 12 L12 12 L17.5 12')
  })

  test('the check and the dash are one stroke with the same vertices, so mixed → checked morphs it', async () => {
    const user = userEvent.setup()
    function Parent() {
      const [checked, setChecked] = useState(false)
      const [mixed, setMixed] = useState(true)
      return <Checkbox aria-label="All" checked={checked} indeterminate={mixed} onCheckedChange={(next) => (setChecked(next), setMixed(false))} />
    }
    render(<Parent />)
    const box = screen.getByRole('checkbox', { name: 'All' })
    const paths = () => box.querySelectorAll('path')
    const vertices = (d: string | null) => d!.match(/-?[\d.]+/g)!.length
    const dash = paths()[0]!.getAttribute('d')
    await user.click(box)
    expect(box).toHaveAttribute('aria-checked', 'true')
    // Still one path (no glyph swap), now heading for the check, with as many numbers to interpolate.
    expect(paths()).toHaveLength(1)
    expect(box.querySelector('[data-slot=checkbox-check]')).toHaveAttribute('data-shape', 'check')
    await waitFor(() => expect(paths()[0]!.getAttribute('d')).toBe('M4 12.5 L9 17.5 L20 6.5'))
    expect(vertices(dash)).toBe(vertices(paths()[0]!.getAttribute('d')))
  })

  test('a tick scales the fill in and draws the check; an untick fades both but keeps them mounted', async () => {
    const user = userEvent.setup()
    render(<Checkbox aria-label="Tick" />)
    const box = screen.getByRole('checkbox', { name: 'Tick' })
    const fill = () => box.querySelector<HTMLElement>('[data-slot=checkbox-fill]')!
    const stroke = () => box.querySelector<SVGPathElement>('[data-slot=checkbox-check]')!
    // At rest unchecked: the fill sits small and invisible, and nothing animates on mount.
    expect(fill().style.opacity).toBe('0')
    expect(fill().style.transform).toContain('scale(0.6)')
    await user.click(box)
    await waitFor(() => expect(fill().style.opacity).toBe('1'))
    await waitFor(() => expect(fill().style.transform).toBe('none'))
    await waitFor(() => expect(stroke().style.opacity).toBe('1'))
    await user.click(box)
    // Still mounted, so a re-tick replays the draw from zero and a reversal never jumps.
    await waitFor(() => expect(fill().style.opacity).toBe('0'))
    expect(stroke()).toBeInTheDocument()
  })

  test('the press is .95, and none under reduced motion', () => {
    render(<Checkbox aria-label="Press" />)
    expect(screen.getByRole('checkbox', { name: 'Press' })).toHaveClass('active:scale-95', 'reduced:active:scale-100')
  })

  test('disabled ignores presses', async () => {
    const user = userEvent.setup()
    render(<Checkbox aria-label="Off" disabled />)
    const box = screen.getByRole('checkbox', { name: 'Off' })
    await user.click(box)
    expect(box).toHaveAttribute('aria-checked', 'false')
    expect(box).toHaveAttribute('data-disabled')
  })

  test('takes required from its Field and submits with the form', () => {
    function Consent() {
      const [checked, setChecked] = useState(true)
      return (
        <form aria-label="consent">
          <Field required name="terms" orientation="horizontal">
            <Checkbox checked={checked} onCheckedChange={setChecked} />
            <FieldLabel>Accept the terms</FieldLabel>
          </Field>
        </form>
      )
    }
    render(<Consent />)
    const box = screen.getByRole('checkbox', { name: 'Accept the terms' })
    expect(box).toHaveAttribute('aria-required', 'true')
    const form = screen.getByRole('form', { name: 'consent' }) as HTMLFormElement
    expect(new FormData(form).get('terms')).toBe('on')
  })

  test('marks itself for reduced motion', () => {
    render(
      <YoujProvider reducedMotion="always">
        <Checkbox aria-label="Calm" defaultChecked />
      </YoujProvider>,
    )
    expect(screen.getByRole('checkbox', { name: 'Calm' })).toHaveAttribute('data-reduced-motion')
  })

  test('CheckboxMark is decorative and mirrors checked and indeterminate', () => {
    const { container, rerender } = render(<CheckboxMark checked />)
    const mark = container.querySelector('[data-slot=checkbox-mark]')!
    expect(mark).toHaveAttribute('aria-hidden', 'true')
    expect(mark).toHaveAttribute('data-checked')
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    rerender(<CheckboxMark checked="indeterminate" />)
    expect(mark).toHaveAttribute('data-indeterminate')
    expect(mark).not.toHaveAttribute('data-checked')
  })
})
