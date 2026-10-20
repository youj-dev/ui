export { Badge, type BadgeProps } from './badge'

/** Spacing steps. */
export const space = { sm: 4, md: 8 }

export function formatCount(n: number, unit = 'item'): string {
  return `${n} ${unit}`
}
