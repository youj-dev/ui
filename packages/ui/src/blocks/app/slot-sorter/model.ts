import type { SlotSorterAssignments, SlotSorterSlot, SlotSorterItem } from './data'

/** Today's count per slot: its own count, less the items moved out of it and plus the ones moved in. */
export function splitCounts(slots: readonly SlotSorterSlot[], items: readonly SlotSorterItem[], assigned: SlotSorterAssignments) {
  const counts = Object.fromEntries(slots.map((s) => [s.id, s.count])) as Record<string, number>
  for (const item of items) {
    const now = assigned[item.id] ?? item.slot
    if (now === item.slot) continue
    if (item.slot in counts) counts[item.slot]!--
    if (now in counts) counts[now]!++
  }
  return counts
}

/** Moves an item to a slot. A slot that is off or unknown takes nothing, and an item already there stays; the same object comes back when nothing changes. */
export function moveItem(
  slots: readonly SlotSorterSlot[],
  items: readonly SlotSorterItem[],
  assigned: SlotSorterAssignments,
  id: string,
  to: string,
) {
  const slot = slots.find((s) => s.id === to)
  const item = items.find((t) => t.id === id)
  if (!slot || slot.off || !item) return assigned
  if ((assigned[id] ?? item.slot) === to) return assigned
  return { ...assigned, [id]: to }
}
