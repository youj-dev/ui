import { cn } from '../../../lib/utils'

/* What the frame draws on the photo: a grid of thirds while it moves (a
 * finer one while it's straightened), as hairlines of white, and the
 * frame's four corner brackets. */

export function Grid({ lines, className }: { lines: number; className?: string }) {
  const step = 100 / lines
  const stops = Array.from(
    { length: lines - 1 },
    (_, i) =>
      `transparent calc(${step * (i + 1)}% - 0.5px), color-mix(in oklab, white 42%, transparent) calc(${step * (i + 1)}% - 0.5px) calc(${step * (i + 1)}% + 0.5px), transparent calc(${step * (i + 1)}% + 0.5px)`,
  ).join(', ')
  return (
    <span
      className={cn('absolute inset-0 rounded-[inherit] transition-opacity yj-duration-fast ease-standard', className)}
      style={{ backgroundImage: `linear-gradient(to right, ${stops}), linear-gradient(to bottom, ${stops})` }}
    />
  )
}

export function Corners() {
  const corner = 'absolute size-3.5 border-[white]'
  return (
    <>
      <span className={cn(corner, '-start-0.5 -top-0.5 border-s-2 border-t-2')} />
      <span className={cn(corner, '-end-0.5 -top-0.5 border-e-2 border-t-2')} />
      <span className={cn(corner, '-start-0.5 -bottom-0.5 border-s-2 border-b-2')} />
      <span className={cn(corner, '-end-0.5 -bottom-0.5 border-e-2 border-b-2')} />
    </>
  )
}
