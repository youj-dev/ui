import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/sbc-cluster'
import { sbcCluster } from './meta/sbc-cluster'

export { sbcCluster }
export type MiniatureSbcClusterKey = MiniatureKeyOf<typeof sbcCluster>
export type MiniatureSbcClusterHandle = MiniatureHandle<MiniatureSbcClusterKey>
export interface MiniatureSbcClusterProps extends MiniatureProps {
  ref?: Ref<MiniatureSbcClusterHandle>
}

/**
 * ORCHARD C4, board cluster. Four single-board computers stacked in a clear acrylic case with a top fan, a five-port switch and patch cables; workloads appear as colored blocks on the boards. The top board is the control plane. Deploy a workload and a colored block flies from it to the least busy worker; drain a worker and its blocks lift off and reschedule; delete a workload; power-cycle the cluster and watch the nodes boot.
 *
 * Keys: D deploy · N drain node · X delete pod · B power.
 */
export function MiniatureSbcCluster(props: MiniatureSbcClusterProps) {
  return <Miniature {...props} meta={sbcCluster} figure={figure} />
}
