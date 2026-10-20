import { createRef } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Field, FieldDescription, FieldLabel } from './field'
import { SignaturePad, type SignaturePadHandle, type SignatureValue } from './signature-pad'

const surfaceOf = (container: HTMLElement) => container.querySelector<HTMLElement>('[data-slot="signature-pad-surface"]')!

/** Lays the pad out at 300×100 and drags a pointer along `points` (pad pixels). */
function draw(container: HTMLElement, points: [number, number][], pointerId = 1) {
  const surface = surfaceOf(container)
  surface.getBoundingClientRect = () => ({ left: 0, top: 0, width: 300, height: 100, right: 300, bottom: 100, x: 0, y: 0, toJSON: () => ({}) })
  const [first, ...rest] = points
  fireEvent.pointerDown(surface, { clientX: first![0], clientY: first![1], button: 0, pointerId })
  for (const [x, y] of rest) fireEvent.pointerMove(surface, { clientX: x, clientY: y, pointerId })
  fireEvent.pointerUp(surface, { pointerId })
}

describe('SignaturePad', () => {
  test('a drag becomes one stroke of points stored as fractions of the pad’s width', () => {
    const onValueChange = vi.fn()
    const { container } = render(<SignaturePad onValueChange={onValueChange} />)
    expect(screen.getByText('Sign here')).toBeInTheDocument()
    draw(container, [
      [30, 50],
      [90, 40],
      [150, 60],
    ])
    const value = onValueChange.mock.lastCall![0] as Extract<SignatureValue, { kind: 'drawn' }>
    expect(value.kind).toBe('drawn')
    expect(value.strokes).toHaveLength(1)
    expect(value.strokes[0]![0]!.slice(0, 2)).toEqual([0.1, 0.1667])
    expect(value.strokes[0]!.at(-1)!.slice(0, 2)).toEqual([0.5, 0.2])
    expect(container.querySelectorAll('[data-slot="signature-pad-ink"] path')).toHaveLength(1)
    expect(container.querySelector('[data-slot="signature-pad-ink"] path')!.getAttribute('d')).toMatch(/^M[\d.,-]+Q.+Z$/)
  })

  test('undo takes back the last stroke and clear empties the pad, out loud', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { container } = render(<SignaturePad onValueChange={onValueChange} />)
    draw(container, [
      [10, 10],
      [60, 30],
    ])
    draw(container, [
      [100, 40],
      [160, 70],
    ])
    expect(container.querySelectorAll('[data-slot="signature-pad-ink"] path')).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(container.querySelectorAll('[data-slot="signature-pad-ink"] path')).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(onValueChange).toHaveBeenLastCalledWith(null)
    expect(container.querySelectorAll('[data-slot="signature-pad-ink"] path')).toHaveLength(0)
    expect(screen.getByText('Signature cleared')).toHaveAttribute('role', 'status')
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled()
  })

  test('⌘Z on the focused pad undoes a stroke', () => {
    const { container } = render(<SignaturePad />)
    draw(container, [
      [10, 10],
      [60, 30],
    ])
    fireEvent.keyDown(surfaceOf(container), { key: 'z', metaKey: true })
    expect(container.querySelectorAll('[data-slot="signature-pad-ink"] path')).toHaveLength(0)
  })

  test('the Sign by typing tab sets the name as the signature, and Draw brings the drawing back', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { container } = render(<SignaturePad onValueChange={onValueChange} />)
    draw(container, [
      [10, 10],
      [60, 30],
    ])
    expect(screen.getByRole('tablist', { name: 'Signature method' })).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Sign by typing' }))
    const field = screen.getByPlaceholderText('Your full name')
    await user.type(field, 'Ada Lovelace')
    expect(onValueChange).toHaveBeenLastCalledWith({ kind: 'typed', text: 'Ada Lovelace' })
    expect(field.style.fontFamily).toMatch(/cursive/)
    await user.click(screen.getByRole('tab', { name: 'Draw' }))
    expect(container.querySelectorAll('[data-slot="signature-pad-ink"] path')).toHaveLength(1)
  })

  test('Enter on the focused pad switches to typing, for signing without a pointer', async () => {
    const user = userEvent.setup()
    render(<SignaturePad label="Signature" />)
    await user.tab()
    expect(screen.getByRole('tab', { name: 'Draw' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('group', { name: 'Signature' })).toHaveFocus()
    expect(screen.getByRole('group', { name: 'Signature' })).toHaveAccessibleDescription(/press Enter to type/i)
    await user.keyboard('{Enter}')
    expect(screen.getByPlaceholderText('Your full name')).toBeInTheDocument()
  })

  test('in a Field it takes the label and description, and a required, named pad submits its PNG or blocks the form', () => {
    const { container } = render(
      <form>
        <Field required>
          <FieldLabel>Your signature</FieldLabel>
          <SignaturePad name="signature" />
          <FieldDescription>Sign as on your ID.</FieldDescription>
        </Field>
      </form>,
    )
    const pad = screen.getByRole('group', { name: 'Your signature' })
    expect(pad).toHaveAccessibleDescription(/Sign as on your ID/)
    const input = container.querySelector<HTMLInputElement>('input[name="signature"]')!
    expect(input).toBeRequired()
    expect(container.querySelector('form')!.checkValidity()).toBe(false)
  })

  test('the handle exports the drawing as SVG, and nothing while unsigned', () => {
    const ref = createRef<SignaturePadHandle>()
    const { container } = render(<SignaturePad ref={ref} />)
    expect(ref.current!.toSVG()).toBe('')
    draw(container, [
      [10, 10],
      [60, 30],
      [120, 20],
    ])
    const svg = ref.current!.toSVG()
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="0 0 1000 333.33"/)
    expect(svg.match(/<path /g)).toHaveLength(1)
  })

  test('a typed signature exports as escaped text', () => {
    const ref = createRef<SignaturePadHandle>()
    render(<SignaturePad ref={ref} defaultValue={{ kind: 'typed', text: 'Ada <A&B>' }} />)
    expect(ref.current!.toSVG()).toContain('>Ada &#60;A&#38;B&#62;</text>')
  })

  test('read-only shows the signature without controls and ignores the pointer', () => {
    const onValueChange = vi.fn()
    const value: SignatureValue = { kind: 'drawn', strokes: [[[0.1, 0.1, 0.5], [0.3, 0.2, 0.5]]] }
    const { container } = render(<SignaturePad readOnly value={value} onValueChange={onValueChange} />)
    expect(screen.queryByRole('button')).toBeNull()
    draw(container, [
      [10, 10],
      [60, 30],
    ])
    expect(onValueChange).not.toHaveBeenCalled()
    expect(container.querySelectorAll('[data-slot="signature-pad-ink"] path')).toHaveLength(1)
  })

  test('disabled leaves the tab order and draws nothing', () => {
    const onValueChange = vi.fn()
    const { container } = render(<SignaturePad disabled onValueChange={onValueChange} />)
    expect(surfaceOf(container)).not.toHaveAttribute('tabindex')
    draw(container, [
      [10, 10],
      [60, 30],
    ])
    expect(onValueChange).not.toHaveBeenCalled()
  })

  describe('accepting', () => {
    /* The Accept button holds its check for a timer (3 × deliberate) before
     * Re-sign takes its place: faked from just before the action settles. */
    function fakeHold() {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
      return () => act(() => vi.advanceTimersByTime(10_000))
    }
    afterEach(() => {
      vi.useRealTimers()
      vi.unstubAllGlobals()
      vi.restoreAllMocks()
    })

    test('Accept waits for onAccept, then locks the signature under a seal until Re-sign', async () => {
      const user = userEvent.setup()
      let resolve!: () => void
      const onAccept = vi.fn(() => new Promise<void>((r) => (resolve = r)))
      const onLockedChange = vi.fn()
      const { container } = render(<SignaturePad onAccept={onAccept} onLockedChange={onLockedChange} />)
      const accept = screen.getByRole('button', { name: 'Accept signature' })
      expect(accept).toBeDisabled()
      draw(container, [
        [10, 10],
        [60, 30],
      ])
      await user.click(accept)
      expect(onAccept).toHaveBeenCalledWith({ kind: 'drawn', strokes: [expect.any(Array)] })
      expect(accept).toHaveAttribute('data-state', 'pending')
      expect(accept).toHaveTextContent('Accepting…')

      const endHold = fakeHold()
      await act(async () => resolve())
      expect(accept).toHaveAttribute('data-state', 'success')
      expect(accept).toHaveAccessibleName('Signature accepted')
      expect(onLockedChange).toHaveBeenCalledWith(true)
      const root = container.querySelector('[data-slot="signature-pad"]')!
      expect(root).toHaveAttribute('data-yj-locked')
      expect(container.querySelector('[data-slot="signature-pad-accepted"]')).toBeInTheDocument()
      expect(screen.getByText(/^Signed .+/)).toHaveClass('sr-only')
      expect(screen.getByRole('tab', { name: 'Sign by typing' })).toHaveAttribute('aria-disabled', 'true')
      expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled()
      // Locked ink takes no more strokes.
      draw(container, [
        [100, 40],
        [160, 70],
      ])
      expect(container.querySelectorAll('[data-slot="signature-pad-ink"] path')).toHaveLength(1)

      endHold()
      vi.useRealTimers()
      expect(screen.getByText('Signature locked. Choose Re-sign to change it.')).toHaveAttribute('aria-live', 'polite')
      await user.click(screen.getByRole('button', { name: 'Re-sign' }))
      expect(onLockedChange).toHaveBeenLastCalledWith(false)
      expect(root).not.toHaveAttribute('data-yj-locked')
      expect(screen.getByText('Signature unlocked')).toHaveAttribute('aria-live', 'polite')
      expect(screen.getByRole('button', { name: 'Clear' })).toBeEnabled()
    })

    test('a rejected onAccept shows its message and leaves the pad open', async () => {
      const user = userEvent.setup()
      let reject!: (error: Error) => void
      const { container } = render(<SignaturePad onAccept={() => new Promise((_, r) => (reject = r))} />)
      draw(container, [
        [10, 10],
        [60, 30],
      ])
      const accept = screen.getByRole('button', { name: 'Accept signature' })
      await user.click(accept)
      fakeHold()
      await act(async () => reject(new Error('Session expired')))
      expect(accept).toHaveAttribute('data-state', 'error')
      expect(screen.getByRole('alert')).toHaveTextContent('Session expired')
      expect(container.querySelector('[data-slot="signature-pad"]')).not.toHaveAttribute('data-yj-locked')
    })

    test('typing is a full keyboard path: a typed name is accepted without a pointer', async () => {
      const user = userEvent.setup()
      const onAccept = vi.fn()
      render(<SignaturePad onAccept={onAccept} />)
      await user.tab()
      await user.keyboard('{ArrowRight}{Enter}')
      await user.keyboard('Ada Lovelace')
      await user.tab()
      await user.tab()
      expect(screen.getByRole('button', { name: 'Accept signature' })).toHaveFocus()
      await user.keyboard('{Enter}')
      expect(onAccept).toHaveBeenCalledWith({ kind: 'typed', text: 'Ada Lovelace' })
    })

    test('defaultLocked starts accepted: read-only, with Re-sign', () => {
      const value: SignatureValue = { kind: 'typed', text: 'Dana Whitfield' }
      render(<SignaturePad defaultLocked defaultValue={value} />)
      expect(screen.getByRole('textbox', { name: 'Signature' })).toHaveAttribute('readonly')
      expect(screen.getByRole('button', { name: 'Re-sign' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Accept signature' })).toBeNull()
    })

    test('a required pad counts as filled only once its signature is accepted', async () => {
      const user = userEvent.setup()
      vi.stubGlobal('Path2D', class {})
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ scale() {}, fill() {}, fillText() {} } as never)
      vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,AAA')
      const { container } = render(
        <form>
          <SignaturePad name="signature" required />
        </form>,
      )
      const form = container.querySelector('form')!
      draw(container, [
        [10, 10],
        [60, 30],
      ])
      expect(form.checkValidity()).toBe(false)
      await user.click(screen.getByRole('button', { name: 'Accept signature' }))
      expect(form.checkValidity()).toBe(true)
      expect(new FormData(form).get('signature')).toBe('data:image/png;base64,AAA')
    })
  })
})
