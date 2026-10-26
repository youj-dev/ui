import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/card-catalog'
import { cardCatalog } from './meta/card-catalog'

export { cardCatalog }
export type MiniatureCardCatalogKey = MiniatureKeyOf<typeof cardCatalog>
export type MiniatureCardCatalogHandle = MiniatureHandle<MiniatureCardCatalogKey>
export interface MiniatureCardCatalogProps extends MiniatureProps {
  ref?: Ref<MiniatureCardCatalogHandle>
}

/**
 * PELL & ASHBY No. 15, card catalog. An oak library card catalog on tapered legs, its drawers labeled A to Z in brass frames. Type a letter and the drawer for it slides out, the index cards riffle forward and the first match rises with a highlight; letters typed in quick succession narrow the search, and a query with no card leaves an empty place where it would be filed. Browse the cards with the arrows, take the found card out to read it (the rod slides back to free it) and push the drawer home with a soft thunk. Left alone, it looks a few words up by itself.
 *
 * Keys: A–Z find · ↑ ↓ previous · next card · Enter take out · put back · ⌫ erase a letter · Esc close.
 */
export function MiniatureCardCatalog(props: MiniatureCardCatalogProps) {
  return <Miniature {...props} meta={cardCatalog} figure={figure} />
}
