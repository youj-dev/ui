import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniaturePaymentTerminal, type MiniaturePaymentTerminalKey, paymentTerminal } from './payment-terminal'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniaturePaymentTerminal, paymentTerminal)

describe('PaymentTerminal', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it, presses the keys in order and lets it settle (still by default: every change jumps to its end). */
  const play = async (keys: MiniaturePaymentTerminalKey[] = [], reducedMotion: 'always' | 'never' = 'always') => {
    const run = useFrames()
    const view = mount(MiniaturePaymentTerminal, { reducedMotion })
    await run(100)
    for (const k of keys) act(() => view.handle().press(k))
    await run(100)
    return { ...view, run, snap: () => view.handle().getSnapshot() }
  }
  const screen = (inside: ShadowRoot) => [...inside.querySelectorAll<SVGGElement>('[data-yj-screen]')].find((g) => g.style.opacity === '1')?.getAttribute('data-yj-screen')
  const printedRows = (inside: ShadowRoot) => inside.querySelectorAll('.receipt > g > g[visibility=visible]')
  const card = (inside: ShadowRoot) => inside.querySelector('[aria-label^="Payment card"]')!
  /** The display's status tag: SALE, or a red DECLINE TEST while a decline is armed. */
  const tag = (inside: ShadowRoot) => {
    const t = [...inside.querySelectorAll('text.si.l')].find((n) => /SALE|DECLINE/.test(n.textContent ?? ''))!
    return { text: t.textContent, red: t.classList.contains('no') }
  }
  const click = (el: Element) => act(() => void el.dispatchEvent(new MouseEvent('click', { bubbles: true })))

  it('starts ready to take $24.80, the card on the counter and no receipt out', async () => {
    const { snap, inside } = await play()
    expect(snap()).toEqual(paymentTerminal.initial)
    expect(screen(inside)).toBe('ready')
    expect(inside.querySelector('[data-yj-screen=ready]')?.textContent).toContain('$24.80')
    expect(printedRows(inside)).toHaveLength(0)
    expect(card(inside)).toHaveAttribute('aria-label', 'Payment card: tap it on the pad (T)')
  })

  it('T pays contactless: the four read lights, an approval code and the receipt printed', async () => {
    const { snap, inside } = await play(['t'])
    expect(snap()).toMatchObject({ readout: '$24.80 · AUTH 50DE68', state: 'APPROVED' })
    expect(screen(inside)).toBe('approved')
    expect(inside.querySelectorAll('.dot.on')).toHaveLength(4)
    expect(printedRows(inside)).toHaveLength(10)
    const slip = inside.querySelector('.receipt')!.textContent
    for (const line of ['NORTH LANE MARKET', '#0001', '$24.80', 'CONTACTLESS', 'AUTH 50DE68', 'APPROVED']) expect(slip).toContain(line)
  })

  it('after an approval it thanks the customer, then is ready for the next sale', async () => {
    const { snap, inside, run } = await play(['t'])
    await run(1800)
    expect(snap().state).toBe('PAID · TAKE RECEIPT')
    expect(screen(inside)).toBe('thanks')
    await run(4300)
    expect(snap()).toEqual({ ...paymentTerminal.initial, readout: '$24.80 · SALE 0002' })
    expect(printedRows(inside)).toHaveLength(10)
  })

  it('T in motion: the card glides to the pad, the waves pulse and the lights fill, then it goes back while the sale authorizes', async () => {
    const { snap, inside, handle, run } = await play([], 'never')
    const face = card(inside).children[1]!
    const rest = face.getAttribute('transform')
    act(() => handle().press('t'))
    await run(400)
    expect(snap().state).toBe('CARD TO PAD')
    expect(face.getAttribute('transform')).not.toBe(rest)
    await run(600)
    expect(snap().state).toBe('READING CARD')
    expect(snap().readout).toMatch(/^\$24\.80 · READ [1-3]\/4$/)
    expect(screen(inside)).toBe('reading')
    expect([...inside.querySelectorAll<SVGPathElement>('.wave')].some((w) => Number(w.style.opacity) > 0)).toBe(true)
    await run(700)
    expect(snap().state).toBe('AUTHORIZING')
    expect(screen(inside)).toBe('auth')
    await run(1100)
    expect(snap().state).toMatch(/^APPROVED · PRINTING \d\d\/10$/)
    await run(900)
    expect(printedRows(inside).length).toBeGreaterThan(2)
    expect(printedRows(inside).length).toBeLessThan(10)
    await run(1300)
    expect(snap().state).toBe('PAID · TAKE RECEIPT')
    expect(printedRows(inside)).toHaveLength(10)
    expect(face).toHaveAttribute('transform', rest)
  })

  it('I inserts the card for chip and PIN: digits fill the PIN, ⌫ corrects it, OK authorizes, the card comes back out', async () => {
    const { snap, inside, handle, run } = await play(['i'])
    expect(snap()).toMatchObject({ readout: '$24.80 · PIN ––––', state: 'CHIP · ENTER PIN' })
    expect(screen(inside)).toBe('pin')
    expect(card(inside)).toHaveAttribute('aria-label', 'Payment card: remove it from the slot (I)')
    for (const k of ['1', '2', '3'] as const) act(() => handle().press(k))
    await run(100)
    expect(snap().readout).toBe('$24.80 · PIN •••–')
    act(() => handle().press('Enter'))
    await run(100)
    expect(snap().state).toBe('PIN IS FOUR DIGITS')
    act(() => handle().press('Backspace'))
    for (const k of ['4', '2'] as const) act(() => handle().press(k))
    await run(100)
    expect(snap().readout).toBe('$24.80 · PIN ••••')
    act(() => handle().press('Enter'))
    await run(100)
    expect(snap()).toMatchObject({ readout: '$24.80 · AUTH 50DE68', state: 'APPROVED · REMOVE CARD' })
    expect(inside.querySelector('.receipt')!.textContent).toContain('CHIP + PIN')
    expect(inside.querySelectorAll('.dot.on')).toHaveLength(0)
    await run(1000)
    expect(snap().state).toBe('APPROVED')
    expect(card(inside)).toHaveAttribute('aria-label', 'Payment card: tap it on the pad (T)')
    await run(700)
    expect(snap().state).toBe('PAID · TAKE RECEIPT')
  })

  it('digits key in a new amount, ⌫ takes the last one back, OK sets it and Esc drops an entry', async () => {
    const { snap, inside, handle, run } = await play(['1', '2', '5', '0'])
    expect(snap()).toMatchObject({ readout: '$12.50 · SALE 0001', state: 'ENTER AMOUNT · OK' })
    expect(screen(inside)).toBe('amount')
    act(() => handle().press('Backspace'))
    await run(100)
    expect(snap().readout).toBe('$1.25 · SALE 0001')
    act(() => handle().press('Enter'))
    await run(100)
    expect(snap()).toMatchObject({ readout: '$1.25 · SALE 0001', state: 'READY · TAP OR INSERT' })
    act(() => handle().press('9'))
    act(() => handle().press('Escape'))
    await run(100)
    expect(snap()).toMatchObject({ readout: '$1.25 · SALE 0001', state: 'READY · TAP OR INSERT' })
    act(() => handle().press('t'))
    await run(100)
    expect(inside.querySelector('.receipt')!.textContent).toContain('$1.25')
  })

  it('OK on a zero amount asks for one, and the card waits until there is one', async () => {
    const { snap, handle, run } = await play(['0', 'Enter'])
    expect(snap().state).toBe('ENTER AN AMOUNT')
    act(() => handle().press('t'))
    await run(100)
    expect(snap()).toMatchObject({ readout: '$0.00 · SALE 0001', state: 'ENTER AN AMOUNT' })
  })

  it('D arms a decline for the next payment only: it is refused, nothing prints, and the next one goes through', async () => {
    const { snap, inside, handle, run } = await play(['d'])
    expect(snap().state).toBe('READY · TAP OR INSERT · DECLINE NEXT')
    expect(tag(inside)).toEqual({ text: 'DECLINE TEST', red: true })
    act(() => handle().press('t'))
    await run(100)
    expect(snap()).toMatchObject({ readout: '$24.80 · NOT AUTHORIZED', state: 'DECLINED' })
    expect(screen(inside)).toBe('declined')
    expect(printedRows(inside)).toHaveLength(0)
    await run(2500)
    expect(snap().state).toBe('READY · TAP OR INSERT')
    act(() => handle().press('t'))
    await run(100)
    expect(snap().state).toBe('APPROVED')
  })

  it('D again before paying disarms the decline', async () => {
    const { snap, inside } = await play(['d', 'd'])
    expect(snap().state).toBe('READY · TAP OR INSERT')
    expect(tag(inside)).toEqual({ text: 'SALE', red: false })
  })

  it('Esc during the PIN cancels the sale and gives the card back; I takes it back out too', async () => {
    const { snap, inside, handle, run } = await play(['i', '1', 'Escape'])
    expect(snap().state).toBe('CANCELED')
    expect(card(inside)).toHaveAttribute('aria-label', 'Payment card: tap it on the pad (T)')
    await run(1400)
    expect(snap().state).toBe('READY · TAP OR INSERT')
    act(() => handle().press('i'))
    act(() => handle().press('t'))
    await run(100)
    expect(snap().state).toBe('CARD IN SLOT · I TO REMOVE')
    act(() => handle().press('i'))
    await run(100)
    expect(snap().state).toBe('CARD REMOVED')
    expect(screen(inside)).toBe('canceled')
  })

  it('a new sale tears off the last receipt, which lifts away', async () => {
    const { inside, handle, run } = await play([], 'never')
    act(() => handle().press('t'))
    await run(5200)
    expect(printedRows(inside)).toHaveLength(10)
    const printed = inside.querySelector('.receipt > g')!
    act(() => handle().press('5'))
    await run(200)
    expect(inside.querySelector('.receipt')!.contains(printed)).toBe(false)
    expect(inside.contains(printed)).toBe(true)
    expect(printedRows(inside)).toHaveLength(0)
    await run(700)
    expect(inside.contains(printed)).toBe(false)
  })

  it('its parts work by pointer: the keypad keys, the pad and the slot', async () => {
    const { snap, inside, run } = await play()
    for (const k of ['7', '5', '0']) click(inside.querySelector(`[aria-label="${k}"]`)!)
    click(inside.querySelector('[aria-label="OK (Enter)"]')!)
    await run(100)
    expect(snap().readout).toBe('$7.50 · SALE 0001')
    click(inside.querySelector('[aria-label="Chip slot: insert the card (I)"]')!)
    await run(100)
    expect(snap().state).toBe('CHIP · ENTER PIN')
    click(inside.querySelector('[aria-label="Cancel (Esc)"]')!)
    await run(1500)
    click(inside.querySelector('[aria-label="Contactless pad: tap the card (T)"]')!)
    await run(100)
    expect(snap().readout).toBe('$7.50 · AUTH 50DE68')
  })
})
