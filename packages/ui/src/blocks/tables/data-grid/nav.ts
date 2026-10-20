import { useCallback, useLayoutEffect, useRef, type FocusEvent, type KeyboardEvent, type RefObject } from 'react'

/* The ARIA grid pattern with a roving tabindex: the grid is one Tab stop,
 * the active cell, and the arrow keys move it. Home/End go to the row's
 * ends, Ctrl/Cmd+Home/End to the grid's corners, PageUp/PageDown by a
 * screenful. A cell's focus target is the control it holds (a sort button,
 * a checkbox, a switch: marked `data-dg-focus`), or the cell itself; in a
 * cell with several (the row actions), ←/→ walk them before leaving it.
 *
 * It works on the DOM, not React state: moving focus rewrites two tabindex
 * attributes and renders nothing, so it stays fast on thousands of rows and
 * survives rows the virtualizer unmounts (a cell that scrolled out is found
 * again by its coordinates). Coordinates are `data-dg-row` (the header is
 * -1; body rows count in display order, group headings and detail panels
 * included) and `data-dg-col`. A row with one spanning cell (a group
 * heading, a detail panel) answers for every column; the column the arrows
 * came from is remembered, so ↓ past it lands back in the same column.
 * Rows leaving under PresenceList are `inert` and never targets. */

export interface GridNavHandlers {
  /** Space on a body cell outside a control. */
  toggleRow?: (row: HTMLElement, shift: boolean) => void
  /** Enter on a body cell outside a control. Returns true when it did something. */
  open?: (row: HTMLElement) => boolean
  /** Ctrl/Cmd+A. */
  selectAll?: () => boolean
  /** Escape. Returns true when it did something. */
  escape?: () => boolean
  /** Shift+←/→ on a header cell. */
  resize?: (col: number, delta: number) => boolean
}

interface Cell {
  row: number
  col: number
}

const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]'

export function useGridNavigation(options: {
  gridRef: RefObject<HTMLTableElement | null>
  rowCount: number
  colCount: number
  /** Rows per PageUp/PageDown, read when the key is pressed. */
  pageJump: () => number
  /** Brings an unrendered row into the DOM (virtualized grids). */
  scrollToRow?: (row: number) => void
  handlers: GridNavHandlers
}) {
  const active = useRef<Cell>({ row: -1, col: 0 })
  const stop = useRef<HTMLElement | null>(null)
  const pending = useRef<Cell | null>(null)
  const had = useRef(false)
  const opts = useRef(options)
  useLayoutEffect(() => {
    opts.current = options
  })

  /** The cell at (row, col), or the spanning cell that covers it. */
  const findCell = useCallback((row: number, col: number): HTMLElement | null => {
    const grid = opts.current.gridRef.current
    if (!grid) return null
    let best: HTMLElement | null = null
    for (const el of grid.querySelectorAll<HTMLElement>(`[data-dg-cell][data-dg-row="${row}"]`)) {
      if (el.closest('[inert]')) continue
      const at = Number(el.dataset.dgCol)
      if (at === col) return el
      if (at < col && (!best || at > Number(best.dataset.dgCol))) best = el
    }
    return best
  }, [])

  const targetsOf = (cell: HTMLElement) => [...cell.querySelectorAll<HTMLElement>('[data-dg-focus]')].filter((el) => !el.closest('[inert]') && !(el as HTMLButtonElement).disabled)
  const targetOf = (cell: HTMLElement) => targetsOf(cell)[0] ?? cell

  // Written only when it changes: setting tabindex, even to the same value,
  // makes the browser restyle synchronously (a whole page of fresh rows after a sort).
  const setStop = useCallback((el: HTMLElement | null) => {
    if (stop.current && stop.current !== el) stop.current.tabIndex = -1
    stop.current = el
    if (el && el.tabIndex !== 0) el.tabIndex = 0
  }, [])

  const clamp = (cell: Cell): Cell => {
    const { rowCount, colCount } = opts.current
    return { row: Math.max(-1, Math.min(cell.row, rowCount - 1)), col: Math.max(0, Math.min(cell.col, colCount - 1)) }
  }

  /** Moves the active cell and focuses it, scrolling an unrendered row in first. */
  const focusCell = useCallback(
    (next: Cell, target?: HTMLElement) => {
      const cell = clamp(next)
      active.current = cell
      const el = findCell(cell.row, cell.col)
      if (!el) {
        pending.current = cell
        opts.current.scrollToRow?.(cell.row)
        return
      }
      const focus = target ?? targetOf(el)
      setStop(focus)
      focus.focus({ preventScroll: true })
      el.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- targetOf reads the table at call time
    [findCell, setStop],
  )

  /**
   * After every render: one Tab stop, on the active cell (or the nearest
   * rendered one), every other control in a cell out of the Tab order, and
   * focus put back if the focused cell was replaced. A detail panel's own
   * controls keep their place in the Tab order.
   */
  const sync = useCallback(() => {
    const grid = opts.current.gridRef.current
    if (!grid) return
    const want = pending.current ?? active.current
    const cell = clamp(want)
    let el = findCell(cell.row, cell.col)
    if (el && pending.current) pending.current = null
    if (!el) el = grid.querySelector<HTMLElement>(`tbody tr:not([inert]) > [data-dg-cell][data-dg-col="${cell.col}"]`)
    if (!el) el = findCell(-1, cell.col) ?? grid.querySelector<HTMLElement>('[data-dg-cell]')
    const target = el ? targetOf(el) : null
    for (const node of grid.querySelectorAll<HTMLElement>(`[data-dg-cell], [data-dg-cell] :is(${FOCUSABLE})`)) {
      if (node !== target && node.tabIndex !== -1 && !node.closest('[data-dg-panel]')) node.tabIndex = -1
    }
    setStop(target)
    // Only focus that fell to the page is taken back: focus inside a popup the grid opened stays there.
    const focused = document.activeElement
    const lost = !focused || focused === document.body
    if (target && had.current && lost) {
      target.focus({ preventScroll: true })
      if (want.row === cell.row && el?.dataset.dgRow === String(cell.row)) el.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- targetOf reads the table at call time
  }, [findCell, setStop])

  const onFocus = useCallback(
    (event: FocusEvent<HTMLTableElement>) => {
      had.current = true
      const target = event.target as HTMLElement
      if (target.closest('[data-dg-panel]')) return
      const cell = target.closest<HTMLElement>('[data-dg-cell]')
      if (!cell || cell.closest('[inert]')) return
      const row = Number(cell.dataset.dgRow)
      const col = Number(cell.dataset.dgCol)
      // A spanning cell keeps the column the arrows came from.
      active.current = { row, col: cell.dataset.dgSpan ? Math.max(col, active.current.col) : col }
      setStop(target.matches('[data-dg-focus]') ? target : targetOf(cell))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- targetOf reads the table at call time
    [setStop],
  )

  const onBlur = useCallback((event: FocusEvent<HTMLTableElement>) => {
    const grid = opts.current.gridRef.current
    const to = event.relatedTarget as Node | null
    if (to) {
      if (grid && !grid.contains(to)) had.current = false
      return
    }
    // Focus went nowhere. If the cell is still there (a click on the page), the
    // session is over; if it left (a re-sort, a removal), the next sync puts
    // focus back at the same coordinates.
    const from = event.target as HTMLElement
    queueMicrotask(() => {
      if (from.isConnected && !from.closest('[inert]')) had.current = false
    })
  }, [])

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTableElement>) => {
      const el = event.target as HTMLElement
      // A detail panel, and anything that takes text, keeps its own keys.
      if (el.closest('[data-dg-panel]') || el.matches('input, textarea, select, [contenteditable=true]')) return
      const cell = el.closest<HTMLElement>('[data-dg-cell]')
      if (!cell) return
      const { rowCount, colCount, pageJump, handlers } = opts.current
      const row = Number(cell.dataset.dgRow)
      const col = cell.dataset.dgSpan ? active.current.col : Number(cell.dataset.dgCol)
      const rtl = getComputedStyle(cell).direction === 'rtl'
      const mod = event.ctrlKey || event.metaKey
      const onWidget = el !== cell
      const tr = cell.parentElement as HTMLElement
      let next: Cell | null = null

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowLeft': {
          const forward = (event.key === 'ArrowRight') !== rtl
          if (event.shiftKey && row === -1) {
            if (handlers.resize?.(col, forward ? 16 : -16)) event.preventDefault()
            return
          }
          // Within a cell of several controls, walk them first.
          const targets = targetsOf(cell)
          const at = targets.indexOf(el)
          const inner = at === -1 ? undefined : targets[at + (forward ? 1 : -1)]
          if (inner) {
            event.preventDefault()
            setStop(inner)
            inner.focus({ preventScroll: true })
            return
          }
          if (cell.dataset.dgSpan) return
          next = { row, col: col + (forward ? 1 : -1) }
          break
        }
        case 'ArrowDown':
          next = { row: row + 1, col }
          break
        case 'ArrowUp':
          next = { row: row - 1, col }
          break
        case 'Home':
          next = mod ? { row: -1, col: 0 } : { row, col: 0 }
          break
        case 'End':
          next = mod ? { row: rowCount - 1, col: colCount - 1 } : { row, col: colCount - 1 }
          break
        case 'PageDown':
          next = { row: Math.min(rowCount - 1, Math.max(0, row + pageJump())), col }
          break
        case 'PageUp':
          next = { row: Math.max(row < 0 ? -1 : 0, row - pageJump()), col }
          break
        case ' ':
          if (row >= 0 && !onWidget && tr.dataset.dgKind === 'row' && handlers.toggleRow) {
            event.preventDefault()
            handlers.toggleRow(tr, event.shiftKey)
          }
          return
        case 'Enter':
          if (row >= 0 && !onWidget && handlers.open?.(tr)) event.preventDefault()
          return
        case 'Escape':
          if (handlers.escape?.()) event.preventDefault()
          return
        case 'a':
        case 'A':
          if (mod && !event.altKey && handlers.selectAll?.()) event.preventDefault()
          return
        default:
          return
      }
      event.preventDefault()
      focusCell(next)
    },
    [focusCell, setStop],
  )

  return { onKeyDown, onFocus, onBlur, sync, focusCell, active }
}
