import type { SidebarKind } from '@youj/react/docs/create/config'

/* Workspace's rows, for Create's schematics (schematic.tsx
 * draws the column, the header mark and the account around them). Same
 * units and inks: the chosen part in the accent, the rest in quiet lines. */

export type NewerSidebar = Extract<SidebarKind, 'workspace'>

function Bar({ x, y, w, h = 2, on, strong }: { x: number; y: number; w: number; h?: number; on?: boolean; strong?: boolean }) {
  return <rect x={x} y={y} width={w} height={h} rx={h / 2} className={on ? 'fill-accent' : strong ? 'fill-fg-muted' : 'fill-line-strong'} />
}

export function NewerSidebarRows({ w, on }: { kind: NewerSidebar; w: number; on: boolean }) {
  // The command field first, then the rows, the current one on a raised key, and a space's colored dots.
  return (
      <g>
        <rect x={3} y={14} width={w - 6} height={6.5} rx={2} className={on ? 'fill-accent-subtle stroke-accent' : 'fill-transparent stroke-line'} strokeWidth={0.7} />
        <rect x={w - 8} y={15.6} width={3.4} height={3.4} rx={0.8} className={on ? 'fill-accent' : 'fill-line-strong'} />
        {[27, 33, 39, 47, 53, 59].map((y, i) => (
          <g key={y}>
            {i === 0 && <rect x={2.5} y={y - 2.2} width={w - 5} height={6.2} rx={1.6} className={on ? 'fill-surface stroke-accent' : 'fill-surface stroke-line'} strokeWidth={0.5} />}
            {i >= 3 ? <circle cx={5.5} cy={y + 0.9} r={1.1} className={on ? `fill-chart-${i - 2}` : 'fill-line-strong'} /> : <rect x={4} y={y - 0.6} width={3} height={3} rx={0.8} className={on && i === 0 ? 'fill-accent' : 'fill-line-strong'} />}
            <Bar x={9} y={y} w={12 - (i % 3) * 2} h={1.8} on={on && i === 0} strong={i === 0} />
            {i % 2 === 1 && <Bar x={w - 6} y={y} w={2.6} h={1.8} />}
          </g>
        ))}
      </g>
    )
}
