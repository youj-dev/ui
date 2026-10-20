'use client'

import { useMemo, useRef, type PointerEvent, type ReactElement } from 'react'
import { KeyboardIcon } from '@youj/icons/components/youj/icons/keyboard'
import { MapIcon } from '@youj/icons/components/youj/icons/map'
import { MinusIcon } from '@youj/icons/components/youj/icons/minus'
import { PlusIcon } from '@youj/icons/components/youj/icons/plus'
import { RedoIcon } from '@youj/icons/components/youj/icons/redo'
import { UndoIcon } from '@youj/icons/components/youj/icons/undo'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '../dropdown-menu'
import { Kbd, KbdGroup } from '../kbd'
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '../popover'
import { Toolbar, ToolbarButton, ToolbarSeparator, ToolbarToggle } from '../toolbar'
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip'
import { MAX_ZOOM, MIN_ZOOM, type View } from './whiteboard-arrange'
import { PAPER, unionBoxes, type Box, type WhiteboardShape } from './whiteboard-model'
import type { Labels } from './whiteboard-toolbar'

/* The view's controls at the board's foot: zoom out, the zoom as a menu
 * (fit, selection, 100%, the minimap and grid snapping), zoom in, the
 * minimap's toggle and the shortcut list; and the minimap itself. */

function Tip({ label, keys, children }: { label: string; keys?: string[]; children: ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent>
        {label}
        {keys && (
          <KbdGroup>
            {keys.map((k) => (
              <Kbd key={k}>{k}</Kbd>
            ))}
          </KbdGroup>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

interface ZoomBarProps {
  labels: Labels
  view: View
  percent: string
  canFit: boolean
  canFitSelection: boolean
  minimap: boolean
  onMinimapChange: (on: boolean) => void
  snapToGrid: boolean
  onSnapToGridChange: (on: boolean) => void
  /** Hidden when the board is read-only: there is nothing to snap. */
  showSnap: boolean
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
  onZoomToFit: () => void
  onZoomToSelection: () => void
  shortcuts: { label: string; keys: string[] }[]
  shortcutsOpen: boolean
  onShortcutsOpenChange: (open: boolean) => void
  /** Undo and redo lead the bar; left out on a read-only board. */
  history?: { canUndo: boolean; canRedo: boolean; onUndo: () => void; onRedo: () => void; mod: string }
}

function ZoomBar({
  labels,
  view,
  percent,
  canFit,
  canFitSelection,
  minimap,
  onMinimapChange,
  snapToGrid,
  onSnapToGridChange,
  showSnap,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onZoomToFit,
  onZoomToSelection,
  shortcuts,
  shortcutsOpen,
  onShortcutsOpenChange,
  history,
}: ZoomBarProps) {
  return (
    <Toolbar aria-label={labels.whiteboardView} data-slot="whiteboard-zoom">
      {history && (
        <>
          <Tip label={labels.undo} keys={[history.mod, 'Z']}>
            <ToolbarButton aria-label={labels.undo} aria-keyshortcuts="Control+Z Meta+Z" disabled={!history.canUndo} onClick={history.onUndo}>
              <UndoIcon className="rtl:-scale-x-100" />
            </ToolbarButton>
          </Tip>
          <Tip label={labels.redo} keys={['⇧', history.mod, 'Z']}>
            <ToolbarButton aria-label={labels.redo} aria-keyshortcuts="Shift+Control+Z Shift+Meta+Z" disabled={!history.canRedo} onClick={history.onRedo}>
              <RedoIcon className="rtl:-scale-x-100" />
            </ToolbarButton>
          </Tip>
          <ToolbarSeparator />
        </>
      )}
      <Tip label={labels.zoomOut} keys={['−']}>
        <ToolbarButton aria-label={labels.zoomOut} disabled={view.k <= MIN_ZOOM + 0.001} onClick={onZoomOut}>
          <MinusIcon />
        </ToolbarButton>
      </Tip>
      <DropdownMenu>
        <DropdownMenuTrigger render={<ToolbarButton aria-label={`${labels.whiteboardView}: ${percent}`} className="min-w-14 own:px-1.5" />}>
          <span className="own:font-mono own:text-ui-sm own:tabular-nums">{percent}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="min-w-52">
          <DropdownMenuItem onClick={onZoomIn} disabled={view.k >= MAX_ZOOM - 0.001}>
            {labels.zoomIn}
            <DropdownMenuShortcut>+</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onZoomOut} disabled={view.k <= MIN_ZOOM + 0.001}>
            {labels.zoomOut}
            <DropdownMenuShortcut>−</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onZoomReset}>
            {labels.zoomReset}
            <DropdownMenuShortcut>0</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onZoomToFit} disabled={!canFit}>
            {labels.zoomToFit}
            <DropdownMenuShortcut>⇧1</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onZoomToSelection} disabled={!canFitSelection}>
            {labels.whiteboardZoomToSelection}
            <DropdownMenuShortcut>⇧2</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem checked={minimap} onCheckedChange={onMinimapChange}>
            {labels.whiteboardMinimap}
            <DropdownMenuShortcut>M</DropdownMenuShortcut>
          </DropdownMenuCheckboxItem>
          {showSnap && (
            <DropdownMenuCheckboxItem checked={snapToGrid} onCheckedChange={onSnapToGridChange}>
              {labels.whiteboardSnapToGrid}
            </DropdownMenuCheckboxItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <Tip label={labels.zoomIn} keys={['+']}>
        <ToolbarButton aria-label={labels.zoomIn} disabled={view.k >= MAX_ZOOM - 0.001} onClick={onZoomIn}>
          <PlusIcon />
        </ToolbarButton>
      </Tip>
      <ToolbarSeparator />
      <Tip label={labels.whiteboardMinimap} keys={['M']}>
        <ToolbarToggle aria-label={labels.whiteboardMinimap} aria-keyshortcuts="M" pressed={minimap} onPressedChange={onMinimapChange}>
          <MapIcon />
        </ToolbarToggle>
      </Tip>
      <Popover open={shortcutsOpen} onOpenChange={onShortcutsOpenChange}>
        <Tip label={labels.whiteboardShortcuts} keys={['?']}>
          <PopoverTrigger render={<ToolbarButton aria-label={labels.whiteboardShortcuts} aria-keyshortcuts="?" />}>
            <KeyboardIcon />
          </PopoverTrigger>
        </Tip>
        <PopoverContent side="top" align="start" className="w-96">
          <PopoverTitle className="own:text-ui own:font-medium">{labels.whiteboardShortcuts}</PopoverTitle>
          <dl className="own:grid grid-cols-[minmax(0,1fr)_auto] items-center own:gap-x-4 own:gap-y-2 own:text-ui-sm">
            {shortcuts.map((s) => (
              <div key={s.label} className="own:contents">
                <dt className="own:text-fg-muted">{s.label}</dt>
                <dd className="own:m-0 justify-self-end">
                  <KbdGroup>
                    {s.keys.map((k) => (
                      <Kbd key={k}>{k}</Kbd>
                    ))}
                  </KbdGroup>
                </dd>
              </div>
            ))}
          </dl>
        </PopoverContent>
      </Popover>
    </Toolbar>
  )
}

interface MinimapProps {
  shapes: readonly WhiteboardShape[]
  boxes: ReadonlyMap<string, Box>
  /** The part of the world in view. */
  visible: Box
  /** Centers the view on a world point. */
  onNavigate: (x: number, y: number) => void
}

const MAP_W = 160
const MAP_H = 100

/** The whole board in miniature, the view as a frame over it; press or drag to move the view there. */
function Minimap({ shapes, boxes, visible, onNavigate }: MinimapProps) {
  const svg = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)
  const world = unionBoxes([...boxes.values(), visible])!
  const pad = Math.max(world.w, world.h) * 0.06
  const vb = { x: world.x - pad, y: world.y - pad, w: world.w + pad * 2, h: world.h + pad * 2 }
  // Keep the board's proportions: letterbox the world into the map.
  const scale = Math.max(vb.w / MAP_W, vb.h / MAP_H)
  const cx = vb.x + vb.w / 2
  const cy = vb.y + vb.h / 2
  const view = { x: cx - (MAP_W * scale) / 2, y: cy - (MAP_H * scale) / 2, w: MAP_W * scale, h: MAP_H * scale }
  // The shapes in miniature only change with the scene, not as the view moves.
  const miniShapes = useMemo(() => {
    const all = unionBoxes([...boxes.values()])
    const r = all ? Math.max(all.w, all.h) / 160 : 1
    return shapes.map((s) => {
      const b = boxes.get(s.id)
      if (!b || s.type === 'connector') return null
      return <rect key={s.id} x={b.x} y={b.y} width={b.w} height={b.h} rx={r * 1.5} fill={s.type === 'sticky' ? PAPER[s.color] : 'var(--color-line-strong)'} />
    })
  }, [shapes, boxes])
  const go = (e: PointerEvent<SVGSVGElement>) => {
    const r = svg.current!.getBoundingClientRect()
    onNavigate(view.x + ((e.clientX - r.left) / r.width) * view.w, view.y + ((e.clientY - r.top) / r.height) * view.h)
  }
  return (
    <div
      data-slot="whiteboard-minimap"
      data-yj-tone="float"
      aria-hidden
      className="overflow-hidden own:rounded-lg border own:border-line own:bg-chrome-float own:p-1 own:shadow-xs"
    >
      <svg
        ref={svg}
        width={MAP_W}
        height={MAP_H}
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        className="block cursor-pointer touch-none"
        onPointerDown={(e) => {
          e.stopPropagation()
          dragging.current = true
          e.currentTarget.setPointerCapture?.(e.pointerId)
          go(e)
        }}
        onPointerMove={(e) => dragging.current && go(e)}
        onPointerUp={() => {
          dragging.current = false
        }}
      >
        {miniShapes}
        <rect
          data-slot="whiteboard-minimap-view"
          x={visible.x}
          y={visible.y}
          width={visible.w}
          height={visible.h}
          rx={scale * 3}
          fill="var(--color-accent-subtle)"
          fillOpacity={0.5}
          stroke="var(--color-accent)"
          strokeWidth={scale * 1.25}
        />
      </svg>
    </div>
  )
}

export { Minimap, ZoomBar }
