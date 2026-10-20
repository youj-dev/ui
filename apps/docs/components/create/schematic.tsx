import type { ReactNode } from 'react'
import type { AccountKind, SidebarKind, TopbarKind } from '@youj/react/docs/create/config'
import { cn } from '@/lib/cn'
import { NewerSidebarRows } from './schematic-sidebars'

/* A frame drawn small: the wireframe on each of Create's options. The part
 * an option chooses is drawn in the accent, the rest in quiet lines, so a
 * row of options reads as a row of differences. 120 × 76 units. */

const W = 120
const H = 76

type Focus = 'sidebar' | 'topbar' | 'account'

interface SchematicProps {
  sidebar: SidebarKind
  topbar: TopbarKind
  account: AccountKind
  /** The part drawn in the accent. */
  focus: Focus
  className?: string
}

/** A line of "text": a rounded bar. */
function Bar({ x, y, w, h = 2, on, strong }: { x: number; y: number; w: number; h?: number; on?: boolean; strong?: boolean }) {
  return <rect x={x} y={y} width={w} height={h} rx={h / 2} className={on ? 'fill-accent' : strong ? 'fill-fg-muted' : 'fill-line-strong'} />
}

function Dot({ x, y, r = 1.6, on, className }: { x: number; y: number; r?: number; on?: boolean; className?: string }) {
  return <circle cx={x} cy={y} r={r} className={cn(on ? 'fill-accent' : 'fill-line-strong', className)} />
}

/** Where each sidebar leaves the page, and how it's drawn. */
const SIDEBAR_WIDTH: Record<SidebarKind, number> = {
  classic: 32,
  workspace: 34,
  'rail-panel': 42,
  'icon-rail': 15,
  glass: 40,
}

/** Rail + panel's and the icon rail's rail: round keys in a column. */
const RAIL = 14

/** The sidebars whose rail holds the account as an avatar alone. */
const onRail = (kind: SidebarKind) => kind === 'rail-panel' || kind === 'icon-rail'

function Sidebar({ kind, on, account }: { kind: SidebarKind; on: boolean; account: ReactNode }) {
  const w = SIDEBAR_WIDTH[kind]
  const tint = on ? 'fill-accent-subtle' : 'fill-transparent'
  if (kind === 'rail-panel') {
    return (
      <g>
        <rect x={0} y={0} width={RAIL} height={H} className={on ? 'fill-accent-subtle' : 'fill-well'} />
        <rect x={RAIL} y={0} width={w - RAIL} height={H} className={tint} />
        <rect x={3.5} y={4} width={7} height={7} rx={1.8} className={on ? 'fill-accent' : 'fill-line-strong'} />
        {[17, 30, 43].map((y, i) => (
          <g key={y}>
            <circle cx={7} cy={y + 3} r={3.6} className={i === 0 ? (on ? 'fill-accent-line' : 'fill-line') : 'fill-transparent'} />
            <Dot x={7} y={y + 3} r={1.4} on={on && i === 0} />
          </g>
        ))}
        <Bar x={RAIL + 4} y={6} w={12} h={2.4} on={on} strong />
        {[16, 22, 28, 34, 40].map((y, i) => (
          <Bar key={y} x={RAIL + 4} y={y} w={i === 1 ? 16 : 12 + (i % 2) * 5} on={on && i === 1} />
        ))}
        {account}
      </g>
    )
  }
  if (kind === 'icon-rail') {
    return (
      <g>
        <rect x={2} y={3} width={w - 4} height={H - 6} rx={4} className={cn(on ? 'fill-accent-subtle stroke-accent' : 'fill-surface stroke-line')} strokeWidth={0.8} />
        <rect x={4.5} y={7} width={6} height={6} rx={1.5} className={on ? 'fill-accent' : 'fill-line-strong'} />
        {[19, 27, 35, 43].map((y, i) => (
          <g key={y}>
            {i === 1 && <rect x={3.8} y={y - 3.2} width={7.4} height={6.4} rx={1.6} className={on ? 'fill-accent-line' : 'fill-well'} />}
            <Dot x={7.5} y={y} r={1.4} on={on && i === 1} />
          </g>
        ))}
        {account}
      </g>
    )
  }
  if (kind === 'glass') {
    return (
      <g>
        <rect x={3} y={3} width={w - 5} height={H - 6} rx={4} className={cn(on ? 'fill-accent-subtle stroke-accent' : 'fill-surface stroke-line')} strokeWidth={0.8} />
        <rect x={7} y={8} width={6} height={6} rx={1.5} className={on ? 'fill-accent' : 'fill-line-strong'} />
        <Bar x={15} y={10} w={10} on={on} strong />
        {[20, 26, 32, 38].map((y, i) => (
          <g key={y}>
            {i === 0 && <rect x={6} y={y - 2.2} width={w - 11} height={6.4} rx={3.2} className={on ? 'fill-accent-line' : 'fill-well'} />}
            <Dot x={9.5} y={y + 1} r={1.3} on={on} />
            <Bar x={13} y={y} w={12 - (i % 2) * 3} on={on && i === 0} />
          </g>
        ))}
        {account}
      </g>
    )
  }
  // The rest share a column; their rows differ.
  return (
    <g>
      <rect x={0} y={0} width={w} height={H} className={tint} />
      <rect x={4} y={4} width={6} height={6} rx={1.5} className={on ? 'fill-accent' : 'fill-line-strong'} />
      <Bar x={12} y={6} w={12} on={on} strong />
      {kind === 'workspace' && <NewerSidebarRows kind={kind} w={w} on={on} />}
      {kind === 'classic' &&
        [
          [16, 0],
          [22, 0],
          [28, 0],
          [37, -1],
          [43, 0],
          [49, 4],
          [55, 4],
        ].map(([y, indent], i) =>
          indent === -1 ? (
            <Bar key={y} x={4} y={y} w={9} h={1.4} />
          ) : (
            <g key={y}>
              {i === 0 && <rect x={2.5} y={y - 2.2} width={w - 5} height={6.4} rx={1.6} className={on ? 'fill-accent-line' : 'fill-well'} />}
              {!indent && <rect x={5} y={y - 0.5} width={3} height={3} rx={0.8} className={on ? 'fill-accent' : 'fill-line-strong'} />}
              <Bar x={indent ? 13 : 10} y={y} w={indent ? 10 : 14 - (i % 3) * 2} on={on && i === 0} />
            </g>
          ),
        )}
      {account}
    </g>
  )
}

function Topbar({ kind, x, on, account }: { kind: TopbarKind; x: number; on: boolean; account: ReactNode }) {
  const width = W - x
  const tall = kind === 'tabs'
  return (
    <g>
      <rect x={x} y={0} width={width} height={tall ? 20 : 12} className={on ? 'fill-accent-subtle' : 'fill-transparent'} />
      <rect x={x} y={tall ? 20 : 12} width={width} height={0.6} className="fill-line" />
      <rect x={x + 3} y={4} width={4} height={4} rx={1} className="fill-line-strong" />
      {kind === 'breadcrumb' && (
        <g>
          <Bar x={x + 10} y={5} w={8} on={on} />
          <Bar x={x + 20.5} y={5} w={1.2} on={on} />
          <Bar x={x + 24} y={5} w={11} on={on} strong />
          <rect x={W - 30} y={3} width={16} height={6} rx={3} className="fill-transparent stroke-line" strokeWidth={0.6} />
        </g>
      )}
      {kind === 'tabs' && (
        <g>
          <Bar x={x + 10} y={4.5} w={16} h={2.6} on={on} strong />
          {[0, 1, 2, 3].map((i) => (
            <Bar key={i} x={x + 4 + i * 13} y={14} w={9} h={1.6} on={on && i === 0} />
          ))}
          <rect x={x + 4} y={18.6} width={9} height={1.2} rx={0.6} className={on ? 'fill-accent' : 'fill-fg-muted'} />
        </g>
      )}
      {kind === 'search' && (
        <g>
          <Bar x={x + 10} y={5} w={10} on={on} strong />
          <rect x={x + width / 2 - 14} y={2.8} width={28} height={6.4} rx={3.2} className={on ? 'fill-accent-subtle stroke-accent' : 'fill-transparent stroke-line'} strokeWidth={0.7} />
          <circle cx={x + width / 2 - 10.5} cy={6} r={1.3} className={on ? 'stroke-accent' : 'stroke-fg-subtle'} fill="none" strokeWidth={0.6} />
        </g>
      )}
      {kind === 'minimal' && (
        <g>
          <Bar x={x + 10} y={4.3} w={18} h={3.4} on={on} strong />
          <rect x={W - 26} y={3} width={10} height={6} rx={2} className={on ? 'fill-accent' : 'fill-line-strong'} />
        </g>
      )}
      <Dot x={W - 11} y={6} r={1.5} />
      {account}
    </g>
  )
}

export function Schematic({ sidebar, topbar, account, focus, className }: SchematicProps) {
  const x = SIDEBAR_WIDTH[sidebar]
  const top = topbar === 'tabs' ? 20 : 12
  const accountOn = focus === 'account'
  const inSidebar = account === 'card'
  const sidebarAccount = inSidebar ? (
    <g>
      <circle cx={onRail(sidebar) ? RAIL / 2 : 7} cy={H - 7} r={2.6} className={accountOn ? 'fill-accent' : 'fill-line-strong'} />
      {!onRail(sidebar) && <Bar x={11.5} y={H - 8} w={13} on={accountOn} />}
    </g>
  ) : null
  const topbarAccount = inSidebar ? null : account === 'menu' ? (
    <circle cx={W - 4.5} cy={6} r={2.6} className={accountOn ? 'fill-accent' : 'fill-line-strong'} />
  ) : (
    <g>
      <rect x={W - 9} y={3} width={7} height={6} rx={3} className={accountOn ? 'fill-accent-line stroke-accent' : 'fill-transparent stroke-line'} strokeWidth={0.6} />
      <circle cx={W - 6.5} cy={6} r={1.3} className="fill-success" />
    </g>
  )
  return (
    <svg viewBox={`0 0 ${W} ${H}`} aria-hidden className={cn('block h-auto w-full rtl:-scale-x-100', className)}>
      <rect x={0} y={0} width={W} height={H} className="fill-canvas" />
      {/* The page: its surface (a card of its own beside a floating sidebar), and a few quiet blocks of content. */}
      {sidebar !== 'classic' ? (
        <rect x={x} y={3} width={W - x - 3} height={H - 6} rx={4} className="fill-surface stroke-line" strokeWidth={0.8} />
      ) : (
        <rect x={x} y={0} width={W - x} height={H} className="fill-surface" />
      )}
      <g className="opacity-80">
        <Bar x={x + 5} y={top + 6} w={20} h={3} strong />
        {[0, 1, 2].map((i) => (
          <rect key={i} x={x + 5 + i * ((W - x - 10) / 3)} y={top + 14} width={(W - x - 10) / 3 - 3} height={12} rx={2} className="fill-transparent stroke-line" strokeWidth={0.6} />
        ))}
        <rect x={x + 5} y={top + 30} width={W - x - 10} height={H - top - 35} rx={2} className="fill-transparent stroke-line" strokeWidth={0.6} />
      </g>
      <rect x={x - 0.3} y={0} width={0.6} height={H} className={sidebar !== 'classic' ? 'fill-transparent' : 'fill-line'} />
      <Sidebar kind={sidebar} on={focus === 'sidebar'} account={sidebarAccount} />
      <Topbar kind={topbar} x={x} on={focus === 'topbar'} account={topbarAccount} />
    </svg>
  )
}
