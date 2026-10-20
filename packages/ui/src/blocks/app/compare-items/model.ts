import type { CompareItem, CompareSpec } from './data'

/**
 * The picks that hold a row's best value. A number row with a `better` end has its best where that end is reached,
 * unless every pick ties; a boolean row's best is Yes, when at least one pick says No. Other rows have none.
 */
export function bestOf(spec: CompareSpec, picks: readonly CompareItem[]) {
  const best = new Set<string>()
  if (spec.kind === 'boolean') {
    const values = picks.map((p) => p.specs[spec.id])
    if (values.includes(false)) for (const p of picks) if (p.specs[spec.id] === true) best.add(p.id)
    return best
  }
  if (spec.kind !== 'number' || !spec.better) return best
  const numbers = picks.flatMap((p) => (typeof p.specs[spec.id] === 'number' ? [{ id: p.id, value: p.specs[spec.id] as number }] : []))
  if (numbers.length < 2) return best
  const target = spec.better === 'higher' ? Math.max(...numbers.map((n) => n.value)) : Math.min(...numbers.map((n) => n.value))
  if (numbers.every((n) => n.value === target)) return best
  for (const n of numbers) if (n.value === target) best.add(n.id)
  return best
}
