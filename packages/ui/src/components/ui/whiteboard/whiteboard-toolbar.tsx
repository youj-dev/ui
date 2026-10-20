'use client'

import { Fragment, type ReactElement, type ReactNode } from 'react'
import { AlignCenterHorizontalIcon } from '@youj/icons/components/youj/icons/align-center-horizontal'
import { AlignCenterVerticalIcon } from '@youj/icons/components/youj/icons/align-center-vertical'
import { AlignEndHorizontalIcon } from '@youj/icons/components/youj/icons/align-end-horizontal'
import { AlignEndVerticalIcon } from '@youj/icons/components/youj/icons/align-end-vertical'
import { AlignStartHorizontalIcon } from '@youj/icons/components/youj/icons/align-start-horizontal'
import { AlignStartVerticalIcon } from '@youj/icons/components/youj/icons/align-start-vertical'
import { ArrowUpRightIcon } from '@youj/icons/components/youj/icons/arrow-up-right'
import { CircleIcon } from '@youj/icons/components/youj/icons/circle'
import { ColumnsIcon } from '@youj/icons/components/youj/icons/columns'
import { HandIcon } from '@youj/icons/components/youj/icons/hand'
import { LayoutGridIcon } from '@youj/icons/components/youj/icons/layout-grid'
import { MessageIcon } from '@youj/icons/components/youj/icons/message'
import { MinusIcon } from '@youj/icons/components/youj/icons/minus'
import { MousePointerIcon } from '@youj/icons/components/youj/icons/mouse-pointer'
import { PencilIcon } from '@youj/icons/components/youj/icons/pencil'
import { RowsIcon } from '@youj/icons/components/youj/icons/rows'
import { SplineIcon } from '@youj/icons/components/youj/icons/spline'
import { SquareIcon } from '@youj/icons/components/youj/icons/square'
import { StickyNoteIcon } from '@youj/icons/components/youj/icons/sticky-note'
import { TrashIcon } from '@youj/icons/components/youj/icons/trash'
import { TypeIcon } from '@youj/icons/components/youj/icons/type'
import type { whiteboardLabels } from '@youj/core/labels'
import { Button } from '../button'
import { Kbd, KbdGroup } from '../kbd'
import { Popover, PopoverContent, PopoverTrigger } from '../popover'
import { ToggleGroup, ToggleGroupItem } from '../toggle-group'
import { Toolbar, ToolbarButton, ToolbarSeparator } from '../toolbar'
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip'
import type { WhiteboardAlign, WhiteboardDistribute } from './whiteboard-arrange'
import { COLORS, WIDTHS, type WhiteboardColor, type WhiteboardConnectorRoute, type WhiteboardStrokeWidth, type WhiteboardTool } from './whiteboard-model'

type Labels = { [K in keyof typeof whiteboardLabels]: (typeof whiteboardLabels)[K] }

/** Each tool: its icon, its key, its label's key and its group on the toolbar. Order is the toolbar's. */
const TOOLS: { tool: WhiteboardTool; key: string; icon: ReactNode; label: keyof Labels; group: number }[] = [
  { tool: 'select', key: 'V', icon: <MousePointerIcon />, label: 'whiteboardSelect', group: 0 },
  { tool: 'hand', key: 'H', icon: <HandIcon />, label: 'whiteboardHand', group: 0 },
  { tool: 'pen', key: 'P', icon: <PencilIcon />, label: 'whiteboardPen', group: 1 },
  { tool: 'line', key: 'L', icon: <MinusIcon className="-rotate-45" />, label: 'whiteboardLine', group: 1 },
  { tool: 'arrow', key: 'A', icon: <ArrowUpRightIcon className="rtl:-scale-x-100" />, label: 'whiteboardArrow', group: 1 },
  { tool: 'rectangle', key: 'R', icon: <SquareIcon />, label: 'whiteboardRectangle', group: 1 },
  { tool: 'ellipse', key: 'O', icon: <CircleIcon />, label: 'whiteboardEllipse', group: 1 },
  { tool: 'text', key: 'T', icon: <TypeIcon />, label: 'whiteboardText', group: 1 },
  { tool: 'sticky', key: 'S', icon: <StickyNoteIcon />, label: 'whiteboardSticky', group: 2 },
  { tool: 'connector', key: 'X', icon: <SplineIcon />, label: 'whiteboardConnector', group: 2 },
  { tool: 'comment', key: 'C', icon: <MessageIcon />, label: 'whiteboardComment', group: 2 },
]

const PALETTE: { color: WhiteboardColor; label: keyof Labels }[] = [
  { color: 'ink', label: 'whiteboardInk' },
  { color: 'accent', label: 'whiteboardAccent' },
  { color: 'red', label: 'whiteboardRed' },
  { color: 'amber', label: 'whiteboardAmber' },
  { color: 'green', label: 'whiteboardGreen' },
  { color: 'blue', label: 'whiteboardBlue' },
]

const STROKES: { width: WhiteboardStrokeWidth; label: keyof Labels }[] = [
  { width: 'thin', label: 'whiteboardThin' },
  { width: 'medium', label: 'whiteboardMedium' },
  { width: 'bold', label: 'whiteboardBold' },
]

/** Align and distribute, with their Alt keys (⌥ on Apple keyboards), as Figma has them. */
const ALIGN: { mode: WhiteboardAlign; key: string; icon: ReactNode; label: keyof Labels }[] = [
  { mode: 'left', key: 'A', icon: <AlignStartVerticalIcon className="rtl:-scale-x-100" />, label: 'whiteboardAlignLeft' },
  { mode: 'center', key: 'H', icon: <AlignCenterVerticalIcon />, label: 'whiteboardAlignCenter' },
  { mode: 'right', key: 'D', icon: <AlignEndVerticalIcon className="rtl:-scale-x-100" />, label: 'whiteboardAlignRight' },
  { mode: 'top', key: 'W', icon: <AlignStartHorizontalIcon />, label: 'whiteboardAlignTop' },
  { mode: 'middle', key: 'V', icon: <AlignCenterHorizontalIcon />, label: 'whiteboardAlignMiddle' },
  { mode: 'bottom', key: 'S', icon: <AlignEndHorizontalIcon />, label: 'whiteboardAlignBottom' },
]
const DISTRIBUTE: { mode: WhiteboardDistribute; key: string; icon: ReactNode; label: keyof Labels }[] = [
  { mode: 'horizontal', key: 'H', icon: <ColumnsIcon />, label: 'whiteboardDistributeHorizontal' },
  { mode: 'vertical', key: 'V', icon: <RowsIcon />, label: 'whiteboardDistributeVertical' },
]

/** A control with a tooltip naming it, and its keys when it has a shortcut. */
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

/** A quiet caption over a row of choices in a popover. */
function Caption({ children }: { children: ReactNode }) {
  return <span className="own:text-ui-xs own:text-fg-muted">{children}</span>
}

interface WhiteboardToolbarProps {
  labels: Labels
  /** The tools on offer, in the toolbar's order. */
  tools: readonly WhiteboardTool[]
  tool: WhiteboardTool
  onToolChange: (tool: WhiteboardTool) => void
  color: WhiteboardColor
  onColorChange: (color: WhiteboardColor) => void
  width: WhiteboardStrokeWidth
  onWidthChange: (width: WhiteboardStrokeWidth) => void
  /** Shown with the connector tool, or a connector selected. */
  route: WhiteboardConnectorRoute | null
  onRouteChange: (route: WhiteboardConnectorRoute) => void
  /** How many placeable shapes are selected: align needs two, distribute three. */
  arrangeable: number
  onAlign: (mode: WhiteboardAlign) => void
  onDistribute: (mode: WhiteboardDistribute) => void
  canDelete: boolean
  onDelete: () => void
  /** "⌥" on Apple platforms, Alt elsewhere. */
  alt: string
}

/** The board's floating toolbar: tools in three groups, the style, arrange and delete. One tab stop, arrows rove. */
function WhiteboardToolbar({
  labels,
  tools,
  tool,
  onToolChange,
  color,
  onColorChange,
  width,
  onWidthChange,
  route,
  onRouteChange,
  arrangeable,
  onAlign,
  onDistribute,
  canDelete,
  onDelete,
  alt,
}: WhiteboardToolbarProps) {
  const offered = TOOLS.filter((t) => tools.includes(t.tool))
  const groups = [0, 1, 2].map((g) => offered.filter((t) => t.group === g)).filter((g) => g.length)
  const swatch = labels[PALETTE.find((p) => p.color === color)!.label]
  return (
    <Toolbar aria-label={labels.whiteboardTools} className="yj-scrollbar max-w-full overflow-x-auto">
      <ToggleGroup aria-label={labels.whiteboardTools} size="sm" value={[tool]} onValueChange={(next) => next[0] && onToolChange(next[0] as WhiteboardTool)}>
        {groups.map((group, i) => (
          <Fragment key={group[0]!.tool}>
            {group.map((t, j) => (
              <Tip key={t.tool} label={labels[t.label] as string} keys={[t.key]}>
                <ToggleGroupItem value={t.tool} aria-label={labels[t.label] as string} aria-keyshortcuts={t.key} className={i > 0 && j === 0 ? 'own:ms-2' : undefined}>
                  {t.icon}
                </ToggleGroupItem>
              </Tip>
            ))}
          </Fragment>
        ))}
      </ToggleGroup>
      <ToolbarSeparator />
      <Popover>
        <Tip label={labels.whiteboardColor}>
          <PopoverTrigger render={<ToolbarButton aria-label={`${labels.whiteboardColor}: ${swatch}`} />}>
            <span aria-hidden className="size-4 own:rounded-full border own:border-line" style={{ background: COLORS[color] }} />
          </PopoverTrigger>
        </Tip>
        <PopoverContent className="w-auto" side="bottom">
          <div className="own:flex flex-col gap-1.5">
            <Caption>{labels.whiteboardColor}</Caption>
            <ToggleGroup aria-label={labels.whiteboardColor} size="sm" value={[color]} onValueChange={(next) => next[0] && onColorChange(next[0] as WhiteboardColor)}>
              {PALETTE.map((p) => (
                <ToggleGroupItem key={p.color} value={p.color} aria-label={labels[p.label] as string}>
                  <span aria-hidden className="size-4 own:rounded-full" style={{ background: COLORS[p.color] }} />
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <div className="own:flex flex-col gap-1.5">
            <Caption>{labels.whiteboardWidth}</Caption>
            <ToggleGroup aria-label={labels.whiteboardWidth} size="sm" value={[width]} onValueChange={(next) => next[0] && onWidthChange(next[0] as WhiteboardStrokeWidth)}>
              {STROKES.map((s) => (
                <ToggleGroupItem key={s.width} value={s.width} aria-label={labels[s.label] as string}>
                  <span aria-hidden className="w-4 own:rounded-full own:bg-fg" style={{ height: WIDTHS[s.width] }} />
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          {route && (
            <div className="own:flex flex-col gap-1.5">
              <Caption>{labels.whiteboardRoute}</Caption>
              <ToggleGroup aria-label={labels.whiteboardRoute} size="sm" value={[route]} onValueChange={(next) => next[0] && onRouteChange(next[0] as WhiteboardConnectorRoute)}>
                <ToggleGroupItem value="straight" aria-label={labels.whiteboardStraight}>
                  <MinusIcon className="-rotate-45" />
                </ToggleGroupItem>
                <ToggleGroupItem value="elbow" aria-label={labels.whiteboardElbow}>
                  <SplineIcon />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          )}
        </PopoverContent>
      </Popover>
      <Popover>
        <Tip label={labels.whiteboardArrange}>
          <PopoverTrigger render={<ToolbarButton aria-label={labels.whiteboardArrange} disabled={arrangeable < 2} />}>
            <LayoutGridIcon />
          </PopoverTrigger>
        </Tip>
        <PopoverContent className="w-auto" side="bottom">
          <div className="own:flex flex-col gap-1.5">
            <Caption>{labels.whiteboardArrange}</Caption>
            <div role="group" aria-label={labels.whiteboardArrange} className="own:grid grid-cols-6 gap-0.5">
              {ALIGN.map((a) => (
                <Tip key={a.mode} label={labels[a.label] as string} keys={[alt, a.key]}>
                  <Button variant="ghost" size="icon-sm" aria-label={labels[a.label] as string} aria-keyshortcuts={`Alt+${a.key}`} onClick={() => onAlign(a.mode)}>
                    {a.icon}
                  </Button>
                </Tip>
              ))}
            </div>
            <div className="own:grid grid-cols-6 gap-0.5">
              {DISTRIBUTE.map((d) => (
                <Tip key={d.mode} label={labels[d.label] as string} keys={[alt, '⇧', d.key]}>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={labels[d.label] as string}
                    aria-keyshortcuts={`Alt+Shift+${d.key}`}
                    disabled={arrangeable < 3}
                    onClick={() => onDistribute(d.mode)}
                  >
                    {d.icon}
                  </Button>
                </Tip>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <ToolbarSeparator />
      <Tip label={labels.whiteboardDelete} keys={['Del']}>
        <ToolbarButton aria-label={labels.whiteboardDelete} aria-keyshortcuts="Delete" disabled={!canDelete} onClick={onDelete}>
          <TrashIcon />
        </ToolbarButton>
      </Tip>
    </Toolbar>
  )
}

export { ALIGN, DISTRIBUTE, TOOLS, WhiteboardToolbar }
export type { Labels }
