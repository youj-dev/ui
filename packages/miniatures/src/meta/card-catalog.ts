import type { MiniatureMeta } from '../engine/types'

/** PELL & ASHBY No. 15, card catalog: what a showroom shows before it mounts. */
export const cardCatalog = {
  id: 'card-catalog',
  name: 'Card catalog',
  model: 'PELL & ASHBY No. 15',
  maker: 'PELL & ASHBY / INDEX JOINERY',
  study: '084',
  spec: 'No. 15 / QUARTER-SAWN OAK · BRASS LABEL FRAMES · ROD-LOCKED CARDS',
  label: 'Card catalog, PELL & ASHBY No. 15',
  description:
    'An oak library card catalog on tapered legs, its drawers labeled A to Z in brass frames. Type a letter and the drawer for it slides out, the index cards riffle forward and the first match rises with a highlight; letters typed in quick succession narrow the search, and a query with no card leaves an empty place where it would be filed. Browse the cards with the arrows, take the found card out to read it (the rod slides back to free it) and push the drawer home with a soft thunk. Left alone, it looks a few words up by itself.',
  keys: [
    {
      keys: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'],
      caps: ['A–Z'],
      label: 'find',
    },
    { keys: ['ArrowUp', 'ArrowDown'], caps: ['↑', '↓'], label: 'previous · next card' },
    { keys: ['Enter'], caps: ['Enter'], label: 'take out · put back' },
    { keys: ['Backspace'], caps: ['⌫'], label: 'erase a letter' },
    { keys: ['Escape'], caps: ['Esc'], label: 'close' },
  ],
  initial: { readout: 'FIND “METEORS” · DRAWER 08 · M', state: 'FOUND · METEORS', pressed: {} },
  viewBox: '-120.85125168440814 -176.6 238.23840175367854 286.6',
  progress: false,
} as const satisfies MiniatureMeta
