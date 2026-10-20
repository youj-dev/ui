import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { SlotSorter } from './slot-sorter'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const row = (name: string) => screen.getByText(name).closest('li') as HTMLElement
const slotButton = (name: string) => within(row(name)).getByRole('button', { name: new RegExp(name) })
const legend = (slot: string) => within(bar().nextElementSibling as HTMLElement).getByText(slot).closest('li') as HTMLElement
const rect = (x: number, y: number, w: number, h: number) => ({ left: x, right: x + w, top: y, bottom: y + h, width: w, height: h, x, y, toJSON: () => ({}) }) as DOMRect
const bar = () => screen.getByRole('img', { name: /Threads by slot/ })

describe('slot sorter block', () => {
  test('is a section named by an h2, with the step, the split and the threads', () => {
    reduced(<SlotSorter />)
    expect(screen.getByRole('heading', { level: 2, name: 'Split inbox' })).toBeInTheDocument()
    expect(screen.getByText('Setup 2 of 3')).toBeInTheDocument()
    expect(screen.getByText('63 threads · 12 off')).toBeInTheDocument()
    expect(bar()).toHaveAccessibleName('Threads by slot: VIP 14, Needs you 6, FYI 31, Receipts off')
    expect(slotButton('Rui Ortega')).toHaveAccessibleName('Rui Ortega, Contract redlines v3. In VIP. High confidence.')
    expect(within(row('Dana Lee')).getByRole('img', { name: 'Low confidence' })).toBeInTheDocument()
  })

  test('the slot menu moves a thread and the counts and bar follow', async () => {
    const user = userEvent.setup()
    const onMove = vi.fn()
    const onValueChange = vi.fn()
    reduced(<SlotSorter onMove={onMove} onValueChange={onValueChange} />)
    await user.click(slotButton('Dana Lee'))
    await user.click(await screen.findByRole('menuitemradio', { name: /Needs you/ }))
    expect(onMove).toHaveBeenCalledWith(expect.objectContaining({ id: 'dana' }), expect.objectContaining({ id: 'needs-you' }))
    expect(onValueChange).toHaveBeenCalledWith({ dana: 'needs-you' })
    expect(bar()).toHaveAccessibleName('Threads by slot: VIP 14, Needs you 7, FYI 30, Receipts off')
    expect(slotButton('Dana Lee')).toHaveAccessibleName(/In Needs you/)
    expect(screen.getByText(/Moved Dana Lee/)).toHaveTextContent('Moved Dana Lee’s thread to Needs you. VIP 14, Needs you 7, FYI 30')
  })

  test('the number keys on the slot button move a thread; an off slot takes nothing', async () => {
    const user = userEvent.setup()
    reduced(<SlotSorter />)
    slotButton('Dana Lee').focus()
    await user.keyboard('1')
    expect(slotButton('Dana Lee')).toHaveAccessibleName(/In VIP/)
    await user.keyboard('4')
    expect(slotButton('Dana Lee')).toHaveAccessibleName(/In VIP/)
    expect(bar()).toHaveAccessibleName('Threads by slot: VIP 15, Needs you 6, FYI 30, Receipts off')
  })

  test('a thread dragged onto a slot in the legend moves there', () => {
    reduced(<SlotSorter />)
    const handle = within(row('Dana Lee')).getByText('Dana Lee').closest('div[class*=cursor-grab]') as HTMLElement
    const target = legend('VIP')
    target.getBoundingClientRect = () => rect(50, -90, 100, 20)
    legend('Receipts').getBoundingClientRect = () => rect(160, -90, 100, 20)
    handle.setPointerCapture = () => {}
    fireEvent.pointerDown(handle, { button: 0, clientX: 10, clientY: 10, pointerId: 1 })
    fireEvent.pointerMove(handle, { clientX: 60, clientY: -80, pointerId: 1 })
    expect(target).toHaveClass('bg-selected')
    expect(legend('Needs you')).toHaveClass('bg-hover')
    expect(legend('Receipts')).not.toHaveClass('bg-hover')
    fireEvent.pointerUp(handle, { clientX: 60, clientY: -80, pointerId: 1 })
    expect(slotButton('Dana Lee')).toHaveAccessibleName(/In VIP/)
    expect(bar()).toHaveAccessibleName('Threads by slot: VIP 15, Needs you 6, FYI 30, Receipts off')
  })

  test('dropping outside any slot changes nothing', () => {
    reduced(<SlotSorter />)
    const handle = within(row('Dana Lee')).getByText('Dana Lee').closest('div[class*=cursor-grab]') as HTMLElement
    handle.setPointerCapture = () => {}
    fireEvent.pointerDown(handle, { button: 0, clientX: 10, clientY: 10, pointerId: 1 })
    fireEvent.pointerMove(handle, { clientX: 40, clientY: 40, pointerId: 1 })
    fireEvent.pointerUp(handle, { clientX: 40, clientY: 40, pointerId: 1 })
    expect(slotButton('Dana Lee')).toHaveAccessibleName(/In FYI/)
  })

  test('Back and Turn on call the app’s handlers', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    const onTurnOn = vi.fn().mockResolvedValue(undefined)
    reduced(<SlotSorter onBack={onBack} onTurnOn={onTurnOn} />)
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(onBack).toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Turn on' }))
    expect(onTurnOn).toHaveBeenCalledTimes(1)
  })

  test('props drive the content, copy rewrites it and the locale formats the numbers', () => {
    reduced(
      <SlotSorter
        locale="de-DE"
        step={1}
        slots={[
          { id: 'a', label: 'Wichtig', count: 1860 },
          { id: 'b', label: 'Später', count: 420, off: true },
        ]}
        items={[{ id: 't', name: 'Mia Becker', detail: 'Angebot', slot: 'a', confidence: 'medium' }]}
        throughput={{ items: 4200, seconds: 55 }}
        copy={{ title: 'Posteingang', step: (c, t) => `Schritt ${c} von ${t}` }}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Posteingang' })).toBeInTheDocument()
    expect(screen.getByText('Schritt 1 von 3')).toBeInTheDocument()
    expect(screen.getByText('2.280 threads · 420 off')).toBeInTheDocument()
    expect(screen.getByText('4.200 threads · 55 s')).toBeInTheDocument()
    expect(slotButton('Mia Becker')).toHaveAccessibleName(/In Wichtig. Medium confidence/)
  })

  test('controlled assignments set where threads sit', () => {
    reduced(<SlotSorter value={{ rui: 'fyi' }} />)
    expect(slotButton('Rui Ortega')).toHaveAccessibleName(/In FYI/)
    expect(bar()).toHaveAccessibleName('Threads by slot: VIP 13, Needs you 6, FYI 32, Receipts off')
  })

  test('embedded={false} draws its own page with the title as the h1', () => {
    reduced(<SlotSorter embedded={false} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Split inbox' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
  })
  test('your items, slots and copy replace the inbox: a ticket queue sorts the same way', async () => {
    const user = userEvent.setup()
    const onMove = vi.fn()
    reduced(
      <SlotSorter
        onMove={onMove}
        icon={<span data-testid="icon" />}
        slots={[
          { id: 'urgent', label: 'Urgent', count: 7 },
          { id: 'how-to', label: 'How-to', count: 44 },
          { id: 'billing', label: 'Billing', count: 23, off: true },
        ]}
        items={[{ id: 't1', name: 'Priya Nair', detail: 'Exports fail since this morning', slot: 'urgent', confidence: 'high' }]}
        copy={{ title: 'Route tickets', total: (items, off) => `${items} tickets · ${off} paused`, slotOff: 'paused', row: (name, detail, slot) => `${name}: ${detail} (${slot})` }}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Route tickets' })).toBeInTheDocument()
    expect(screen.getByTestId('icon')).toBeInTheDocument()
    expect(screen.getByText('74 tickets · 23 paused')).toBeInTheDocument()
    expect(slotButton('Priya Nair')).toHaveAccessibleName('Priya Nair: Exports fail since this morning (Urgent)')
    await user.click(slotButton('Priya Nair'))
    await user.click(await screen.findByRole('menuitemradio', { name: /How-to/ }))
    expect(onMove).toHaveBeenCalledWith(expect.objectContaining({ id: 't1' }), expect.objectContaining({ id: 'how-to' }))
    expect(screen.getByRole('img', { name: /Threads by slot: Urgent 6, How-to 45, Billing paused/ })).toBeInTheDocument()
  })
})
