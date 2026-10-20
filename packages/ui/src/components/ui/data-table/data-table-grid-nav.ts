import { createContext, useCallback, useContext, useRef, type FocusEvent, type KeyboardEvent, type RefObject } from 'react'

/* The ARIA grid pattern with a roving tabindex. The whole grid is one Tab
 * stop: the active cell. Arrow keys move it, Home/End go to the row's ends,
 * Ctrl/Cmd+Home/End to the grid's corners, PageUp/PageDown by a screenful.
 * A cell's focus target is the one widget it holds (a sort button, a row
 * checkbox: marked `data-dt-focus`), or the cell itself.
 *
 * It works on the DOM, not on React state: moving focus rewrites two
 * tabindex attributes and never re-renders a row. That keeps 10k-row grids
 * fast, and it survives rows the virtualizer unmounts (a cell that scrolled
 * out is re-found by its coordinates when it comes back).
 *
 * Coordinates are `data-dt-row` (the header row is -1, body rows count from
 * 0 in the current row model) and `data-dt-col` (visible column index). Rows
 * leaving under PresenceList are `inert` and are never targets. */

export interface DataTableNavigationHandlers {
  /** Space on a body cell. */
  toggleRow?: (row: number, shift: boolean) => void
  /** Ctrl/Cmd+A. */
  selectAll?: () => boolean
  /** Escape outside an editor. Returns true when it did something. */
  escape?: () => boolean
  /** Enter, F2 or a typed character on a body cell. Returns true when the cell is editable. */
  edit?: (row: number, col: number, typed?: string) => boolean
  /** Shift+Left/Right on a header cell. */
  resize?: (col: number, delta: number) => boolean
  /** Alt+Down, Shift+F10 or the context-menu key on a header cell: open its column menu. */
  menu?: (col: number) => boolean
}

interface Cell {
  row: number
  col: number
}

const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]'

export function useDataTableNavigation(options: {
  gridRef: RefObject<HTMLTableElement | null>
  rowCount: number
  colCount: number
  /** Rows per PageUp/PageDown, read when the key is pressed. */
  pageJump: () => number
  /** Brings an unrendered row into the DOM (virtualized grids). */
  scrollToRow?: (row: number) => void
  handlers: DataTableNavigationHandlers
  /** The active cell moved (the keyboard, a click, focus coming back): a formula bar, a status line. */
  onActiveChange?: (cell: { row: number; col: number }) => void
}) {
  const active = useRef<Cell>({ row: -1, col: 0 })
  const stop = useRef<HTMLElement | null>(null)
  const pending = useRef<Cell | null>(null)
  const had = useRef(false)
  const opts = useRef(options)
  opts.current = options

  /** Moves the active cell, telling `onActiveChange` when it lands somewhere new. */
  const setActive = useCallback((cell: Cell) => {
    const was = active.current
    active.current = cell
    if (was.row !== cell.row || was.col !== cell.col) opts.current.onActiveChange?.(cell)
  }, [])

  const findCell = useCallback((row: number, col: number): HTMLElement | null => {
    const grid = opts.current.gridRef.current
    if (!grid) return null
    for (const el of grid.querySelectorAll<HTMLElement>(`[data-dt-cell][data-dt-row="${row}"][data-dt-col="${col}"]`)) {
      if (!el.closest('[inert]')) return el
    }
    return null
  }, [])

  const targetOf = (cell: HTMLElement) => cell.querySelector<HTMLElement>('[data-dt-focus]') ?? cell

  const setStop = useCallback((el: HTMLElement | null) => {
    if (stop.current && stop.current !== el) stop.current.tabIndex = -1
    stop.current = el
    if (el) el.tabIndex = 0
  }, [])

  const clamp = (cell: Cell): Cell => {
    const { rowCount, colCount } = opts.current
    return {
      row: Math.max(-1, Math.min(cell.row, rowCount - 1)),
      col: Math.max(0, Math.min(cell.col, colCount - 1)),
    }
  }

  /** Moves the active cell and focuses it, scrolling an unrendered row in first. */
  const focusCell = useCallback(
    (next: Cell) => {
      const cell = clamp(next)
      setActive(cell)
      const el = findCell(cell.row, cell.col)
      if (!el) {
        pending.current = cell
        opts.current.scrollToRow?.(cell.row)
        return
      }
      const target = targetOf(el)
      setStop(target)
      target.focus({ preventScroll: true })
      el.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
    },
    [findCell, setActive, setStop],
  )

  /**
   * After every render: exactly one Tab stop, on the active cell (or the
   * nearest rendered one), every other focusable in a cell out of the Tab
   * order, and focus restored if the focused cell was replaced.
   */
  const sync = useCallback(() => {
    const grid = opts.current.gridRef.current
    if (!grid) return
    const want = pending.current ?? active.current
    const cell = clamp(want)
    let el = findCell(cell.row, cell.col)
    if (el && pending.current) pending.current = null
    if (!el) el = grid.querySelector<HTMLElement>(`tbody tr:not([inert]) > [data-dt-cell][data-dt-col="${cell.col}"]`)
    if (!el) el = findCell(-1, cell.col) ?? grid.querySelector<HTMLElement>('[data-dt-cell]')
    const target = el ? targetOf(el) : null
    for (const node of grid.querySelectorAll<HTMLElement>(`[data-dt-cell], [data-dt-cell] :is(${FOCUSABLE})`)) {
      if (node !== target && node.tabIndex !== -1) node.tabIndex = -1
    }
    setStop(target)
    // Only a focus that fell to the page is taken back: one inside a popup
    // the grid opened (a menu, a select) stays where it is.
    const focused = document.activeElement
    const lost = !focused || focused === document.body
    if (target && had.current && lost) {
      target.focus({ preventScroll: true })
      if (want.row === cell.row && el?.dataset.dtRow === String(cell.row)) el.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
    }
  }, [findCell, setStop])

  const onFocus = useCallback(
    (event: FocusEvent<HTMLTableElement>) => {
      had.current = true
      const cell = (event.target as HTMLElement).closest<HTMLElement>('[data-dt-cell]')
      if (!cell || cell.closest('[inert]')) return
      setActive({ row: Number(cell.dataset.dtRow), col: Number(cell.dataset.dtCol) })
      setStop(targetOf(cell))
    },
    [setActive, setStop],
  )

  const onBlur = useCallback((event: FocusEvent<HTMLTableElement>) => {
    const grid = opts.current.gridRef.current
    const to = event.relatedTarget as Node | null
    if (to) {
      if (grid && !grid.contains(to)) had.current = false
      return
    }
    // Focus went nowhere. If the cell is still there (a click on the page), the
    // session is over; if it was removed or went inert (a re-sort, a removal),
    // the next sync puts focus back on the same coordinates.
    const from = event.target as HTMLElement
    queueMicrotask(() => {
      if (from.isConnected && !from.closest('[inert]')) had.current = false
    })
  }, [])

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTableElement>) => {
      const el = event.target as HTMLElement
      if (el.closest('[data-dt-editor]')) return
      const cell = el.closest<HTMLElement>('[data-dt-cell]')
      if (!cell) return
      const { rowCount, colCount, pageJump, handlers } = opts.current
      const row = Number(cell.dataset.dtRow)
      const col = Number(cell.dataset.dtCol)
      const rtl = getComputedStyle(cell).direction === 'rtl'
      const mod = event.ctrlKey || event.metaKey
      const onWidget = el !== cell
      let next: Cell | null = null

      const menuKey = (event.altKey && event.key === 'ArrowDown') || (event.shiftKey && event.key === 'F10') || event.key === 'ContextMenu'
      if (row === -1 && menuKey) {
        if (handlers.menu?.(col)) event.preventDefault()
        return
      }

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowLeft': {
          const forward = (event.key === 'ArrowRight') !== rtl
          if (event.shiftKey && row === -1) {
            if (handlers.resize?.(col, forward ? 16 : -16)) event.preventDefault()
            return
          }
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
          // A row checkbox toggles itself (and reads Shift for a range).
          if (row >= 0 && !onWidget && handlers.toggleRow) {
            event.preventDefault()
            handlers.toggleRow(row, event.shiftKey)
          }
          return
        case 'Enter':
        case 'F2':
          if (row >= 0 && !onWidget && handlers.edit?.(row, col)) event.preventDefault()
          return
        case 'Escape':
          if (handlers.escape?.()) event.preventDefault()
          return
        case 'a':
        case 'A':
          if (mod && !event.altKey && handlers.selectAll?.()) event.preventDefault()
          return
        default:
          // Typing on an editable cell starts editing with that character.
          if (row >= 0 && !onWidget && event.key.length === 1 && !mod && !event.altKey) {
            if (handlers.edit?.(row, col, event.key)) event.preventDefault()
          }
          return
      }
      event.preventDefault()
      focusCell(next)
    },
    [focusCell],
  )

  return { onKeyDown, onFocus, onBlur, sync, focusCell, active }
}

/** Puts focus back on the grid's active cell (or the one that took its place). */
export const DataTableFocusContext = createContext<(() => void) | null>(null)

/**
 * A `finalFocus` for popups the grid opens (column and row menus, bulk
 * confirmations): focus goes back to where it came from, unless that left
 * with its row, column or the bulk bar (a delete, a hide), in which case the
 * grid takes it on the cell in its place. Outside a grid, Base UI's default.
 */
export function useDataTableReturnFocus(ref: RefObject<HTMLElement | null> | undefined) {
  const restore = useContext(DataTableFocusContext)
  return () => {
    const el = ref?.current
    if (el?.isConnected && !el.closest('[inert]')) return el
    if (!restore) return true
    restore()
    return false
  }
}
