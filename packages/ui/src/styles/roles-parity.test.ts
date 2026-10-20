import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { oklchToOklab } from '@youj/core/lib/youj/theme/color'
import { deriveRoles, themes, ROLES, type Role } from '@youj/core/lib/youj/theme'
import { parseRoles, resolvePaint } from '../docs/token-math'

/* The roles in youj.css (section 3c) resolved by the CSS arithmetic, against
 * deriveRoles, the JS mirror, for every preset and mode: a role's formula and
 * its mirror agree within ΔE 0.002 (Euclidean distance in OKLab), alpha exact.
 * The roles with no resolvable arithmetic here are checked elsewhere: shadow
 * (oklch(calc(…)), a number-only formula) and scrim (the root constants). */

const css = readFileSync(resolve(__dirname, '../../../core/src/styles/youj.css'), 'utf8')
const SKIPPED = new Set<Role>(['shadow', 'scrim'])

/** The role as the CSS declares it: here, a role declared in section 3c's block, else one derived beside the inks and neutrals (a palette entry). */
test.each(themes.map((t) => [t.id, t] as const))('%s: every role resolves to what deriveRoles says, in light and dark', (_id, theme) => {
  const tokens = parseRoles(css, theme)
  let resolved = 0
  for (const mode of ['light', 'dark'] as const) {
    const roles = deriveRoles(theme, mode)
    for (const role of ROLES) {
      if (SKIPPED.has(role)) continue
      const paint = resolvePaint(tokens, mode, `var(--color-${role})`)
      const [L, a, b] = oklchToOklab(roles[role].color)
      const delta = Math.hypot(paint.lab[0] - L, paint.lab[1] - a, paint.lab[2] - b)
      expect([theme.id, mode, role, delta < 0.002]).toEqual([theme.id, mode, role, true])
      expect([theme.id, mode, role, Math.abs(paint.alpha - roles[role].alpha) < 1e-9]).toEqual([theme.id, mode, role, true])
      resolved++
    }
  }
  // A guard that the resolver read real values: every role but the skipped ones, in both modes.
  expect(resolved).toBe((ROLES.length - SKIPPED.size) * 2)
})
