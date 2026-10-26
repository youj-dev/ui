import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/bank-vault'
import { bankVault } from './meta/bank-vault'

export { bankVault }
export type MiniatureBankVaultKey = MiniatureKeyOf<typeof bankVault>
export type MiniatureBankVaultHandle = MiniatureHandle<MiniatureBankVaultKey>
export interface MiniatureBankVaultProps extends MiniatureProps {
  ref?: Ref<MiniatureBankVaultHandle>
}

/**
 * HALVARD V–40, bank vault. Dial the demo combination 30, 70, 15, pressing Enter after each number: every number that clicks in lights a lamp over the door, then the bolts slide back, the handle turns and the door swings open on its hinge. Space closes it and it relocks. A wrong number gives a gentle shake; three in a row ring the alarm. Turn the dial with the arrow keys or by dragging it, or type a number with 0–9. C changes what the vault holds: gold, cash or a single key.
 *
 * Keys: ← → turn the dial · 0–9 dial a number · Enter set it · Space handle · open / close · Esc clear / close · C contents.
 */
export function MiniatureBankVault(props: MiniatureBankVaultProps) {
  return <Miniature {...props} meta={bankVault} figure={figure} />
}
