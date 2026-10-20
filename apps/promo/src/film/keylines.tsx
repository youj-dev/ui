/* The icon set's drawing board: a 24-unit box, its unit grid, the live area
 * (2 units in from each edge), the keyline circle and square, the centre
 * lines and the diagonals. Drawn in the box's own 24 units, with every line
 * `hairline` units thick, so a scene can keep it one screen pixel wide at any
 * magnification (pass 1 / the scale it is seen at, in box units). */

export function Keylines({ size, hairline, grid = 1, keys = 1 }: { size: number; hairline: number; grid?: number; keys?: number }) {
  const units = Array.from({ length: 23 }, (_, i) => i + 1)
  return (
    <svg aria-hidden viewBox="0 0 24 24" width={size} height={size} className="absolute inset-0 overflow-visible" fill="none">
      <g stroke="var(--color-line)" strokeWidth={hairline} opacity={grid}>
        {units.map((u) => (
          <g key={u}>
            <line x1={u} y1={0} x2={u} y2={24} />
            <line x1={0} y1={u} x2={24} y2={u} />
          </g>
        ))}
      </g>
      <g stroke="var(--color-line-strong)" strokeWidth={hairline} opacity={keys}>
        <rect x={0} y={0} width={24} height={24} />
        <rect x={2} y={2} width={20} height={20} />
        <rect x={3} y={3} width={18} height={18} strokeDasharray={`${hairline * 3} ${hairline * 3}`} />
        <circle cx={12} cy={12} r={10} />
        <line x1={12} y1={0} x2={12} y2={24} />
        <line x1={0} y1={12} x2={24} y2={12} />
        <line x1={0} y1={0} x2={24} y2={24} strokeDasharray={`${hairline * 3} ${hairline * 3}`} />
        <line x1={24} y1={0} x2={0} y2={24} strokeDasharray={`${hairline * 3} ${hairline * 3}`} />
      </g>
    </svg>
  )
}
