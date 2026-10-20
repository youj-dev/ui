export interface BadgeProps {
  /** The badge's text. */
  label: string
  tone?: 'neutral' | 'accent'
  /** @deprecated Use `tone`. */
  color?: string
}

export function Badge({ label, tone = 'neutral' }: BadgeProps): string {
  return `${tone}:${label}`
}

/** Internal: not exported from an entry, so not API. */
export function badgeClass(tone: string) {
  return `badge-${tone}`
}
