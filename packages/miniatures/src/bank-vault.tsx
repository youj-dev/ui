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
 * HALVARD V–40, bank vault. A walk-in vault’s round door, set in its wall. Press Space or Enter, or click the big wheel: it turns once and draws the bolts back, then the thick door is drawn out of its frame and swings open on its crane hinge onto gold, cash or a single key. Press again to swing it shut and throw the bolts. Drag the wheel to turn it by hand: past three quarters of a turn it carries on and opens. C changes what the vault holds.
 *
 * Keys: Space Enter open / close · C contents · drag the wheel to turn it.
 */
export function MiniatureBankVault(props: MiniatureBankVaultProps) {
  return <Miniature {...props} meta={bankVault} figure={figure} />
}
