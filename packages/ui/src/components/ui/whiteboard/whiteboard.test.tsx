import { createRef } from 'react'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Whiteboard, type WhiteboardHandle } from './whiteboard'
import type { WhiteboardScene } from './whiteboard-model'

const surfaceOf = (container: HTMLElement) => {
  const surface = container.querySelector<SVGSVGElement>('[data-slot="whiteboard-surface"]')!
  surface.getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 500, right: 800, bottom: 500, x: 0, y: 0, toJSON: () => ({}) })
  return surface
}

function drag(surface: Element, from: [number, number], to: [number, number], init: Partial<PointerEventInit> = {}) {
  fireEvent.pointerDown(surface, { clientX: from[0], clientY: from[1], button: 0, pointerId: 1, ...init })
  fireEvent.pointerMove(surface, { clientX: (from[0] + to[0]) / 2, clientY: (from[1] + to[1]) / 2, pointerId: 1, ...init })
  fireEvent.pointerMove(surface, { clientX: to[0], clientY: to[1], pointerId: 1, ...init })
  fireEvent.pointerUp(surface, { clientX: to[0], clientY: to[1], pointerId: 1 })
}

const SCENE: WhiteboardScene = {
  shapes: [
    { id: 'a', type: 'rectangle', color: 'ink', width: 'medium', x: 100, y: 100, w: 100, h: 60 },
    { id: 'b', type: 'text', color: 'accent', width: 'medium', x: 300, y: 100, text: 'Hello' },
  ],
}

describe('Whiteboard', () => {
  test('a drag with the rectangle tool adds a rectangle, announced, and undo and redo walk it back and forth', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { container } = render(<Whiteboard defaultTool="rectangle" onValueChange={onValueChange} />)
    drag(surfaceOf(container), [100, 100], [220, 180])
    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange.mock.lastCall![0].shapes).toEqual([expect.objectContaining({ type: 'rectangle', x: 100, y: 100, w: 120, h: 80, color: 'ink' })])
    expect(screen.getByRole('option', { name: 'Rectangle' })).toBeInTheDocument()
    expect(screen.getByText('Rectangle added')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(onValueChange).toHaveBeenLastCalledWith({ shapes: [] })
    await user.click(screen.getByRole('button', { name: 'Redo' }))
    expect(onValueChange.mock.lastCall![0].shapes).toHaveLength(1)
  })

  test('the pen draws one stroke from the shared engine', () => {
    const onValueChange = vi.fn()
    const { container } = render(<Whiteboard defaultTool="pen" onValueChange={onValueChange} />)
    drag(surfaceOf(container), [50, 50], [150, 90])
    const [shape] = onValueChange.mock.lastCall![0].shapes
    expect(shape.type).toBe('pen')
    expect(shape.points.length).toBeGreaterThanOrEqual(3)
    expect(container.querySelector('[data-yj-shape="pen"] path')!.getAttribute('d')).toMatch(/^M.+Z$/)
  })

  test('select: click picks the topmost shape, a drag moves it, Delete removes it', () => {
    const onValueChange = vi.fn()
    const { container } = render(<Whiteboard defaultValue={SCENE} defaultTool="select" onValueChange={onValueChange} />)
    const surface = surfaceOf(container)
    // The scene opens fitted; bring the view back to 100% at the origin for simple coordinates.
    fireEvent.keyDown(surface, { key: '0' })
    drag(surface, [150, 130], [170, 150])
    expect(onValueChange.mock.lastCall![0].shapes[0]).toMatchObject({ id: 'a', x: 120, y: 120 })
    fireEvent.keyDown(surface, { key: 'Delete' })
    expect(onValueChange.mock.lastCall![0].shapes.map((s: { id: string }) => s.id)).toEqual(['b'])
    expect(screen.getByRole('status')).toHaveTextContent('1 shape deleted')
  })

  test('a marquee selects the shapes wholly inside it', () => {
    const { container } = render(<Whiteboard defaultValue={SCENE} defaultTool="select" />)
    const surface = surfaceOf(container)
    fireEvent.keyDown(surface, { key: '0' })
    const view = container.querySelector('[data-slot="whiteboard-canvas"] > g')!.getAttribute('transform')!
    const [, tx, ty] = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(view)!.map(Number)
    drag(surface, [80 + tx!, 80 + ty!], [220 + tx!, 180 + ty!])
    expect(container.querySelectorAll('[data-slot="whiteboard-shape"][data-selected]')).toHaveLength(1)
    expect(screen.getByRole('option', { name: 'Rectangle' })).toHaveAttribute('data-selected')
  })

  test('tools switch from their keys, and the toolbar names each with its shortcut', async () => {
    const user = userEvent.setup()
    const { container } = render(<Whiteboard />)
    expect(screen.getByRole('toolbar', { name: 'Drawing tools' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pen' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(surfaceOf(container))
    await user.keyboard('r')
    expect(screen.getByRole('button', { name: 'Rectangle' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Rectangle' })).toHaveAttribute('aria-keyshortcuts', 'R')
    await user.keyboard('v')
    expect(container.querySelector('[data-slot="whiteboard"]')).toHaveAttribute('data-yj-tool', 'select')
  })

  test('from the keyboard: Enter places the tool’s shape, the shape takes focus, arrows nudge it and Tab walks the shapes', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { container } = render(<Whiteboard defaultTool="ellipse" onValueChange={onValueChange} />)
    const surface = surfaceOf(container)
    act(() => surface.focus())
    await user.keyboard('{Enter}')
    const placed = onValueChange.mock.lastCall![0].shapes[0]
    expect(placed.type).toBe('ellipse')
    const shape = screen.getByRole('option', { name: 'Ellipse' })
    act(() => shape.focus())
    await user.keyboard('{Shift>}{ArrowRight}{/Shift}{ArrowDown}')
    expect(onValueChange.mock.lastCall![0].shapes[0]).toMatchObject({ x: placed.x + 10, y: placed.y + 1 })
  })

  test('Tab moves between shapes and leaves the board after the last', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Whiteboard defaultValue={SCENE} readOnly />
        <button type="button">After</button>
      </>,
    )
    const first = screen.getByRole('option', { name: 'Rectangle' })
    act(() => first.focus())
    await user.tab()
    expect(screen.getByRole('option', { name: 'Text: Hello' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Zoom out' })).toHaveFocus()
  })

  test('the text tool writes a text shape, committed on Enter', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { container } = render(<Whiteboard defaultTool="text" onValueChange={onValueChange} />)
    fireEvent.pointerDown(surfaceOf(container), { clientX: 100, clientY: 100, button: 0, pointerId: 1 })
    fireEvent.pointerUp(surfaceOf(container), { clientX: 100, clientY: 100, pointerId: 1 })
    const editor = await screen.findByPlaceholderText('Type text')
    await user.type(editor, 'Ship it{Enter}')
    expect(onValueChange.mock.lastCall![0].shapes).toEqual([expect.objectContaining({ type: 'text', text: 'Ship it' })])
    expect(onValueChange).toHaveBeenCalledTimes(1)
  })

  test('the board describes how many shapes it holds', () => {
    render(<Whiteboard defaultValue={SCENE} />)
    expect(screen.getByRole('group', { name: 'Whiteboard' })).toHaveAccessibleDescription(/^2 shapes/)
  })

  test('read-only keeps the zoom and drops the tools', () => {
    const onValueChange = vi.fn()
    const { container } = render(<Whiteboard defaultValue={SCENE} readOnly onValueChange={onValueChange} />)
    expect(screen.queryByRole('toolbar', { name: 'Drawing tools' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument()
    drag(surfaceOf(container), [150, 130], [300, 300])
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test('controlled: the scene comes from value and changes go out through onValueChange only', () => {
    const onValueChange = vi.fn()
    const { container } = render(<Whiteboard value={{ shapes: [] }} defaultTool="line" onValueChange={onValueChange} />)
    drag(surfaceOf(container), [10, 10], [200, 10])
    expect(onValueChange.mock.lastCall![0].shapes[0]).toMatchObject({ type: 'line', x1: 10, x2: 200 })
    expect(container.querySelectorAll('[data-slot="whiteboard-shape"]')).toHaveLength(0)
  })

  test('the handle exports the scene as SVG', () => {
    const ref = createRef<WhiteboardHandle>()
    render(<Whiteboard ref={ref} defaultValue={SCENE} />)
    const svg = ref.current!.toSVG()
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="76 76 /)
    expect(svg).toContain('<rect x="100" y="100" width="100" height="60"')
    expect(svg).toContain('>Hello</tspan>')
  })
})

const BOARD: WhiteboardScene = {
  shapes: [
    { id: 'a', type: 'rectangle', color: 'ink', width: 'medium', x: 100, y: 100, w: 100, h: 60 },
    { id: 'n', type: 'sticky', color: 'amber', width: 'medium', x: 400, y: 100, w: 160, h: 80, text: 'Ship it' },
    { id: 'k', type: 'connector', color: 'ink', width: 'thin', from: { shape: 'a' }, to: { shape: 'n' }, label: 'next' },
    { id: 'e', type: 'embed', x: 100, y: 300, w: 200, h: 120, title: 'Revenue' },
  ],
}

/** Renders at 100% with the world's origin at the board's corner, so client and world coordinates agree. */
function renderBoard(ui: Parameters<typeof render>[0]) {
  const result = render(ui)
  const surface = surfaceOf(result.container)
  fireEvent.keyDown(surface, { key: '0' })
  return { ...result, surface }
}

const connectorPath = (container: HTMLElement) => container.querySelector('[data-yj-shape="connector"] path:nth-of-type(2)')!.getAttribute('d')

describe('Whiteboard: notes, connectors, embeds, pins and presence', () => {
  test('an old scene of the first six kinds still loads as it was', () => {
    render(<Whiteboard defaultValue={SCENE} />)
    expect(screen.getByRole('option', { name: 'Rectangle' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Text: Hello' })).toBeInTheDocument()
  })

  test('every kind is an option named for what it is', () => {
    render(<Whiteboard defaultValue={BOARD} embeds={{ e: <p>Chart</p> }} />)
    expect(screen.getByRole('option', { name: 'Sticky note: Ship it' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Connector: next' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Embed: Revenue' })).toBeInTheDocument()
    // The embed's content sits outside the list of shapes, in a region of its own.
    const region = screen.getByRole('region', { name: 'Embed: Revenue' })
    expect(region).toHaveTextContent('Chart')
    expect(screen.getByRole('listbox').contains(region)).toBe(false)
  })

  test('a connector re-routes when the shape it is attached to moves, and undo puts both back', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { container, surface } = renderBoard(<Whiteboard defaultValue={BOARD} defaultTool="select" onValueChange={onValueChange} />)
    const before = connectorPath(container)
    drag(surface, [150, 130], [150, 230], { altKey: true })
    expect(onValueChange.mock.lastCall![0].shapes[0]).toMatchObject({ id: 'a', y: 200 })
    // The connector itself didn't change: it follows the shape.
    expect(onValueChange.mock.lastCall![0].shapes[2]).toEqual(BOARD.shapes[2])
    expect(connectorPath(container)).not.toBe(before)
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(connectorPath(container)).toBe(before)
  })

  test('the connector tool joins two shapes, and undo takes it away', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { surface } = renderBoard(<Whiteboard defaultValue={{ shapes: BOARD.shapes.slice(0, 2) }} defaultTool="connector" onValueChange={onValueChange} />)
    drag(surface, [150, 130], [480, 140])
    const connector = onValueChange.mock.lastCall![0].shapes[2]
    expect(connector).toMatchObject({ type: 'connector', from: { shape: 'a' }, to: { shape: 'n' }, route: 'elbow' })
    expect(screen.getByRole('option', { name: 'Connector: Rectangle to Ship it' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(onValueChange.mock.lastCall![0].shapes).toHaveLength(2)
  })

  test('a drag snaps to a neighbour’s edge and shows a guide while it moves', () => {
    const onValueChange = vi.fn()
    const { container, surface } = renderBoard(<Whiteboard defaultValue={BOARD} defaultTool="select" onValueChange={onValueChange} />)
    // The rectangle's left edge, dropped 4px from the note's left edge (400), snaps onto it.
    fireEvent.pointerDown(surface, { clientX: 150, clientY: 130, button: 0, pointerId: 1 })
    fireEvent.pointerMove(surface, { clientX: 446, clientY: 260, pointerId: 1 })
    expect(container.querySelector('[data-slot="whiteboard-guide"]')).not.toBeNull()
    fireEvent.pointerUp(surface, { clientX: 446, clientY: 260, pointerId: 1 })
    expect(onValueChange.mock.lastCall![0].shapes[0]).toMatchObject({ x: 400, y: 230 })
    expect(container.querySelector('[data-slot="whiteboard-guide"]')).toBeNull()
  })

  test('Snap to grid rounds new shapes to the grid', async () => {
    const onValueChange = vi.fn()
    const { surface } = renderBoard(<Whiteboard defaultTool="rectangle" defaultSnapToGrid onValueChange={onValueChange} />)
    drag(surface, [101, 95], [219, 170])
    expect(onValueChange.mock.lastCall![0].shapes[0]).toMatchObject({ x: 96, y: 96, w: 120, h: 72 })
  })

  test('align and distribute from the keyboard, each one undo step', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const shapes: WhiteboardScene['shapes'] = [
      { id: 'a', type: 'rectangle', color: 'ink', width: 'medium', x: 0, y: 0, w: 100, h: 60 },
      { id: 'b', type: 'rectangle', color: 'ink', width: 'medium', x: 150, y: 40, w: 80, h: 30 },
      { id: 'c', type: 'rectangle', color: 'ink', width: 'medium', x: 400, y: 10, w: 50, h: 50 },
    ]
    const { surface } = renderBoard(<Whiteboard defaultValue={{ shapes }} defaultTool="select" onValueChange={onValueChange} />)
    fireEvent.keyDown(surface, { key: 'a', metaKey: true })
    fireEvent.keyDown(surface, { key: 'Ŵ', code: 'KeyW', altKey: true })
    expect(onValueChange.mock.lastCall![0].shapes.map((s: { y: number }) => s.y)).toEqual([0, 0, 0])
    fireEvent.keyDown(surface, { key: 'Ó', code: 'KeyH', altKey: true, shiftKey: true })
    const [a, b, c] = onValueChange.mock.lastCall![0].shapes
    expect(b.x - (a.x + a.w)).toBeCloseTo(c.x - (b.x + b.w))
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(onValueChange.mock.lastCall![0].shapes).toEqual(shapes)
  })

  test('the sticky tool places a note and opens it for writing; its words are one more undo step', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { surface } = renderBoard(<Whiteboard defaultTool="sticky" onValueChange={onValueChange} />)
    fireEvent.pointerDown(surface, { clientX: 200, clientY: 200, button: 0, pointerId: 1 })
    fireEvent.pointerUp(surface, { clientX: 200, clientY: 200, pointerId: 1 })
    expect(onValueChange.mock.lastCall![0].shapes[0]).toMatchObject({ type: 'sticky', text: '' })
    const editor = screen.getByRole('textbox', { name: 'Sticky note' })
    await user.type(editor, 'Ask legal')
    act(() => editor.blur())
    expect(onValueChange.mock.lastCall![0].shapes[0]).toMatchObject({ type: 'sticky', text: 'Ask legal' })
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(onValueChange.mock.lastCall![0].shapes[0]).toMatchObject({ text: '' })
  })

  test('a connector’s label is edited from the keyboard', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Whiteboard defaultValue={BOARD} onValueChange={onValueChange} />)
    act(() => screen.getByRole('option', { name: 'Connector: next' }).focus())
    await user.keyboard('{Enter}')
    const editor = screen.getByRole('textbox', { name: 'Connector' })
    await user.clear(editor)
    await user.type(editor, 'approved{Enter}')
    expect(onValueChange.mock.lastCall![0].shapes[2]).toMatchObject({ label: 'approved' })
  })

  test('a comment pin dropped on a shape opens its note, resolves, and every step undoes', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { surface } = renderBoard(<Whiteboard defaultValue={{ shapes: BOARD.shapes.slice(0, 1) }} defaultTool="comment" onValueChange={onValueChange} />)
    fireEvent.pointerDown(surface, { clientX: 120, clientY: 110, button: 0, pointerId: 1 })
    fireEvent.pointerUp(surface, { clientX: 120, clientY: 110, pointerId: 1 })
    // Attached to the rectangle, at its offset from the corner.
    expect(onValueChange.mock.lastCall![0].pins).toEqual([expect.objectContaining({ shape: 'a', x: 20, y: 10 })])
    const note = await screen.findByRole('textbox', { name: 'Comment 1' })
    await user.type(note, 'Bigger?')
    await user.click(screen.getByRole('button', { name: 'Resolve' }))
    expect(onValueChange.mock.lastCall![0].pins[0]).toMatchObject({ text: 'Bigger?', resolved: true })
    expect(screen.getByRole('button', { name: 'Comment 1, Resolved' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(onValueChange.mock.lastCall![0].pins[0].resolved).toBeUndefined()
  })

  test('a pin opens the app’s own thread when given one', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <Whiteboard
        defaultValue={{ shapes: [], pins: [{ id: 'p', x: 10, y: 10, author: 'Mara Lind' }] }}
        onValueChange={onValueChange}
        pinContent={(pin, actions) => (
          <header>
            Thread {pin.id}
            {actions}
          </header>
        )}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Comment 1 by Mara Lind' }))
    // One header, the thread's: the pin's name names the popover, its Resolve and Delete sit in the thread's header.
    const popover = await screen.findByRole('dialog', { name: 'Comment 1 by Mara Lind' })
    expect(within(popover).getByText(/Thread p/)).toBeInTheDocument()
    expect(within(popover).queryByText('Comment 1 by Mara Lind')).toBeNull()
    await user.click(within(popover).getByRole('button', { name: 'Resolve' }))
    expect(onValueChange.mock.lastCall![0].pins[0]).toMatchObject({ resolved: true })
  })

  test('other people’s cursors are drawn where they are on the board', () => {
    const { container } = render(<Whiteboard defaultValue={{ shapes: [] }} cursors={[{ id: 'u1', name: 'Ana', x: 10, y: 10 }]} />)
    expect(container.querySelector('[data-slot="live-cursors"]')).not.toBeNull()
  })

  test('your pointer is reported in board coordinates', () => {
    const onCursorMove = vi.fn()
    const { surface } = renderBoard(<Whiteboard defaultTool="select" onCursorMove={onCursorMove} />)
    fireEvent.pointerMove(surface, { clientX: 120, clientY: 80, pointerId: 1 })
    expect(onCursorMove).toHaveBeenLastCalledWith({ x: 120, y: 80 })
    fireEvent.pointerLeave(surface)
    expect(onCursorMove).toHaveBeenLastCalledWith(null)
  })

  test('the zoom menu turns on the minimap; M toggles it', async () => {
    const user = userEvent.setup()
    const { container, surface } = renderBoard(<Whiteboard defaultValue={BOARD} />)
    expect(container.querySelector('[data-slot="whiteboard-minimap"]')).toBeNull()
    fireEvent.keyDown(surface, { key: 'm' })
    expect(screen.getByRole('button', { name: 'Minimap' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: 'Minimap' }))
    expect(screen.getByRole('button', { name: 'Minimap' })).toHaveAttribute('aria-pressed', 'false')
  })

  test('? opens the shortcut list', async () => {
    const { surface } = renderBoard(<Whiteboard defaultValue={BOARD} />)
    fireEvent.keyDown(surface, { key: '?' })
    expect(await screen.findByText('Keyboard shortcuts', { selector: 'h2' })).toBeInTheDocument()
    expect(screen.getByText('Zoom to selection')).toBeInTheDocument()
  })

  test('deleting a shape takes its connectors with it, in one undo step', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Whiteboard defaultValue={BOARD} onValueChange={onValueChange} />)
    act(() => screen.getByRole('option', { name: 'Rectangle' }).focus())
    await user.keyboard('{Delete}')
    expect(onValueChange.mock.lastCall![0].shapes.map((s: { id: string }) => s.id)).toEqual(['n', 'e'])
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(onValueChange.mock.lastCall![0].shapes).toHaveLength(4)
  })
})
