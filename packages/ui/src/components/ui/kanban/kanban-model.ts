/* The board as data: one flat, ordered list of cards, each naming its column
 * (and lane). A card's position is its order among the cards of its cell.
 * No React here. */

export interface KanbanCardData {
  id: string
  column: string
  lane?: string
  /** Used in announcements ("Picked up 'Fix login'…"). */
  title: string
}

export interface KanbanPlace {
  column: string
  lane?: string
  /** 0-based position within the cell. */
  index: number
}

export interface KanbanMove<C extends KanbanCardData = KanbanCardData> {
  card: C
  from: KanbanPlace
  to: KanbanPlace
}

export const inCell = (card: KanbanCardData, column: string, lane: string | undefined) =>
  card.column === column && (lane === undefined || card.lane === lane)

export function cellCards<C extends KanbanCardData>(cards: C[], column: string, lane: string | undefined) {
  return cards.filter((c) => inCell(c, column, lane))
}

export function placeOf(cards: KanbanCardData[], id: string, lanes: boolean): KanbanPlace | null {
  const card = cards.find((c) => c.id === id)
  if (!card) return null
  const lane = lanes ? card.lane : undefined
  return { column: card.column, lane, index: cellCards(cards, card.column, lane).findIndex((c) => c.id === id) }
}

/** The list with one card moved to a place; the card object is replaced only when its cell changes. */
export function moveCard<C extends KanbanCardData>(cards: C[], id: string, to: KanbanPlace): C[] {
  const card = cards.find((c) => c.id === id)
  if (!card) return cards
  const rest = cards.filter((c) => c.id !== id)
  const moved = card.column === to.column && (to.lane === undefined || card.lane === to.lane) ? card : { ...card, column: to.column, ...(to.lane !== undefined ? { lane: to.lane } : {}) }
  const cell = rest.filter((c) => inCell(c, to.column, to.lane))
  const index = Math.max(0, Math.min(to.index, cell.length))
  let at: number
  if (cell.length === 0) {
    // An empty cell: keep the card where it was in the flat order.
    at = Math.min(cards.indexOf(card), rest.length)
  } else if (index < cell.length) at = rest.indexOf(cell[index]!)
  else at = rest.indexOf(cell[cell.length - 1]!) + 1
  return [...rest.slice(0, at), moved, ...rest.slice(at)]
}

export const samePlace = (a: KanbanPlace | null, b: KanbanPlace | null) =>
  !!a && !!b && a.column === b.column && a.lane === b.lane && a.index === b.index
