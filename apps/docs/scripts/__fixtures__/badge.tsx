// Fixture for scripts/props.test.ts: one of each shape the extractor handles.
import type { HTMLAttributes, ReactNode } from 'react'

export type Size = 'sm' | 'md' | 'lg'

const steps = { tight: 1, base: 2, loose: 3 } as const
export type Step = keyof typeof steps

/** An item in a list prop: documented like props, though not named *Props. */
export interface BadgeItem {
  /** Shown on the badge. */
  label: string
  href?: string
}

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** The text on the badge. */
  label: string
  /** Visual size. Default 'md'. */
  size?: Size
  /** Spacing, as a token. */
  step?: Step
  /** Fraction that must be visible. Default 0.5. Only whole badges count. */
  amount?: number
  /** Accent color. Default: whatever the theme says. */
  tone?: string
  /** @default 3 */
  count?: number
  children?: ReactNode
}

/** A small label. */
export function Badge({ label, size = 'md', step = 'base', amount = 0.5, ...rest }: BadgeProps) {
  return (
    <span data-size={size} data-step={steps[step]} data-amount={amount} {...rest}>
      {label}
    </span>
  )
}

export const Arrow = (props: { direction?: 'up' | 'down' }) => {
  const { direction = 'up' } = props
  return <span>{direction}</span>
}

export function helper() {
  return null
}
