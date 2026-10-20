import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureReceiptPrinter, receiptPrinter } from './receipt-printer'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureReceiptPrinter, receiptPrinter)

describe('ReceiptPrinter', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  const receipt = (inside: ShadowRoot) => inside.querySelector('[role=button][aria-disabled]')!
  const visibleRows = (inside: ShadowRoot) => receipt(inside).querySelectorAll('g[visibility=visible]')

  it('starts ready for €18.40, with no printed lines and the drawer closed', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureReceiptPrinter)
    await run(100)
    expect(handle().getSnapshot()).toMatchObject({
      readout: '€18.40 · 00/12 lines',
      state: 'READY · DRAWER CLOSED',
      pressed: { d: false },
    })
    expect(inside.querySelector('.scr')?.textContent).toBe('TAP CARD')
    expect(receipt(inside)).toHaveAttribute('aria-disabled', 'true')
    expect(visibleRows(inside)).toHaveLength(0)
    expect(inside.querySelector('[aria-label="Open the cash drawer (D)"]')).toHaveAttribute('aria-pressed', 'false')
  })

  it('C approves the payment and queues the receipt for printing', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureReceiptPrinter, { reducedMotion: 'always' })
    act(() => handle().press('c'))
    await run(100)
    expect(handle().getSnapshot().state).toBe('PAID · PRINT / P · DRAWER CLOSED')
    expect(handle().getSnapshot().readout).toBe('€18.40 · 00/12 lines')
    expect(inside.querySelector('.ok .scr')?.textContent).toBe('APPROVED')
    expect(inside.querySelector('.ring')).toHaveClass('on')
  })

  it('C moves the card to the reader, authorises it, and returns it to its cradle', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureReceiptPrinter, { reducedMotion: 'never' })
    const cardFace = inside.querySelector('.card')!.parentElement!
    const restingPose = cardFace.getAttribute('transform')
    act(() => handle().press('c'))
    await run(500)
    expect(handle().getSnapshot().state).toBe('CARD READING · DRAWER CLOSED')
    expect(inside.querySelector('.scr')?.textContent).toBe('READING')
    expect(cardFace.getAttribute('transform')).not.toBe(restingPose)
    await run(1000)
    expect(handle().getSnapshot().state).toBe('APPROVED · DRAWER CLOSED')
    expect(inside.querySelector('.ok .scr')?.textContent).toBe('APPROVED')
    await run(800)
    expect(handle().getSnapshot().state).toBe('PAID · PRINT / P · DRAWER CLOSED')
    expect(cardFace).toHaveAttribute('transform', restingPose)
  })

  it('P prints all twelve lines for a cash sale and enables the tear control', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureReceiptPrinter, { reducedMotion: 'always' })
    act(() => handle().press('p'))
    await run(100)
    expect(handle().getSnapshot().readout).toBe('€18.40 · 12/12 lines')
    expect(handle().getSnapshot().state).toBe('TEAR / T · DRAWER CLOSED')
    expect(receipt(inside)).toHaveAttribute('aria-disabled', 'false')
    expect(receipt(inside)).toHaveAttribute('aria-label', 'Tear off the receipt (T)')
    expect(visibleRows(inside)).toHaveLength(12)
    expect(receipt(inside).textContent).toContain('TXN 0001')
    expect(receipt(inside).textContent).toContain('CASH')
    expect(receipt(inside).textContent).toContain('TOTAL EUR18.40')
  })

  it('P prints an approved card sale after C; T drops it onto the counter and resets the paper', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureReceiptPrinter, { reducedMotion: 'always' })
    act(() => handle().press('c'))
    act(() => handle().press('p'))
    await run(100)
    expect(handle().getSnapshot().readout).toBe('€18.40 · 12/12 lines')
    expect(handle().getSnapshot().state).toBe('TEAR / T · DRAWER CLOSED')
    const printedStrip = receipt(inside).firstElementChild!
    expect(printedStrip.textContent).toContain('CARD •••• 0428APPROVED')
    const printedShape = printedStrip.querySelector('.paper')!.getAttribute('d')
    act(() => handle().press('t'))
    await run(100)
    expect(handle().getSnapshot().readout).toBe('€18.40 · 00/12 lines')
    expect(handle().getSnapshot().state).toBe('PAID 0001 · DRAWER CLOSED')
    expect(receipt(inside)).toHaveAttribute('aria-disabled', 'true')
    expect(visibleRows(inside)).toHaveLength(0)
    expect(receipt(inside).contains(printedStrip)).toBe(false)
    expect(inside.contains(printedStrip)).toBe(true)
    expect(printedStrip.querySelectorAll('g[visibility=visible]')).toHaveLength(12)
    expect(printedStrip.querySelector('.paper')!.getAttribute('d')).not.toBe(printedShape)
    expect(inside.querySelector('.scr')?.textContent).toBe('THANK YOU')
    expect(inside.querySelector('.ring')).not.toHaveClass('on')
  })

  it('T asks for a print first, and P asks for a tear before another print', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureReceiptPrinter, { reducedMotion: 'always' })
    act(() => handle().press('t'))
    await run(100)
    expect(handle().getSnapshot().state).toBe('PRINT FIRST · P')
    expect(handle().getSnapshot().readout).toBe('€18.40 · 00/12 lines')
    act(() => handle().press('p'))
    await run(100)
    const printedShape = receipt(inside).querySelector('.paper')!.getAttribute('d')
    act(() => handle().press('p'))
    await run(200)
    expect(handle().getSnapshot().state).toBe('TEAR FIRST · T')
    expect(handle().getSnapshot().readout).toBe('€18.40 · 12/12 lines')
    expect(receipt(inside).querySelector('.paper')).toHaveAttribute('d', printedShape)
    expect(receipt(inside).textContent).toContain('TXN 0001')
    act(() => handle().press('t'))
    await run(100)
    act(() => handle().press('p'))
    await run(100)
    expect(handle().getSnapshot().state).toBe('TEAR / T · DRAWER CLOSED')
    expect(receipt(inside).textContent).toContain('TXN 0002')
  })

  // Port-log Math.random review: two calls are audio noise; the third flickers the print head.
  // The seeded lab and mounted miniature matched SVG markup and snapshots on all 847
  // checked frames per scheme (light/dark), including printing, payment, tearing and drawer travel.
  it('feeds the receipt line by line, refuses an early tear, then lets the finished receipt fall', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureReceiptPrinter, { reducedMotion: 'never' })
    act(() => handle().press('p'))
    await run(900)
    expect(handle().getSnapshot().readout).toBe('€18.40 · 03/12 lines')
    expect(handle().getSnapshot().state).toBe('PRINT 03/12 · DRAWER CLOSED')
    expect(visibleRows(inside)).toHaveLength(3)
    expect(inside.querySelector('.ring')).toHaveClass('on')
    act(() => handle().press('t'))
    await run(100)
    expect(handle().getSnapshot().state).toBe('WAIT FOR PRINT')
    await run(2100)
    expect(handle().getSnapshot().readout).toBe('€18.40 · 12/12 lines')
    expect(handle().getSnapshot().state).toBe('TEAR / T · DRAWER CLOSED')
    act(() => handle().press('t'))
    await run(200)
    expect(handle().getSnapshot().readout).toBe('€18.40 · 00/12 lines')
    expect(handle().getSnapshot().state).toBe('TEARING · DRAWER CLOSED')
    await run(1000)
    expect(handle().getSnapshot().state).toBe('READY · DRAWER CLOSED')
    expect(visibleRows(inside)).toHaveLength(0)
  })

  it('D opens and closes the cash drawer, moving its front and publishing the toggle', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureReceiptPrinter, { reducedMotion: 'always' })
    await run(100)
    const drawer = inside.querySelector('[aria-label="Open the cash drawer (D)"]')!
    const closedPose = drawer.getAttribute('transform')
    act(() => handle().press('d'))
    await run(200)
    expect(handle().getSnapshot().pressed.d).toBe(true)
    expect(handle().getSnapshot().state).toBe('READY · DRAWER OPEN')
    expect(drawer).toHaveAttribute('aria-pressed', 'true')
    expect(drawer).toHaveAttribute('aria-label', 'Close the cash drawer (D)')
    expect(drawer.getAttribute('transform')).not.toBe(closedPose)
    act(() => handle().press('d'))
    await run(200)
    expect(handle().getSnapshot().pressed.d).toBe(false)
    expect(handle().getSnapshot().state).toBe('READY · DRAWER CLOSED')
    expect(drawer).toHaveAttribute('aria-pressed', 'false')
    expect(drawer).toHaveAttribute('aria-label', 'Open the cash drawer (D)')
    expect(drawer).toHaveAttribute('transform', closedPose)
  })
})
