import type { MiniatureMeta } from '../engine/types'

/** ORCHARD C4, board cluster: what a showroom shows before it mounts. */
export const sbcCluster = {
  id: 'sbc-cluster',
  name: 'Board cluster',
  model: 'ORCHARD C4',
  maker: 'ORCHARD / EDGE COMPUTE',
  study: '067',
  spec: 'C4 / 4 × QUAD-CORE BOARDS · 5-PORT GIGABIT · ACRYLIC STACK',
  label: 'Board cluster, ORCHARD C4',
  description: 'Four single-board computers stacked in a clear acrylic case with a top fan, a five-port switch and patch cables; workloads appear as colored blocks on the boards. The top board is the control plane. Deploy a workload and a colored block flies from it to the least busy worker; drain a worker and its blocks lift off and reschedule; delete a workload; power-cycle the cluster and watch the nodes boot.',
  keys: [
    { keys: ['d'], caps: ['D'], label: 'deploy' },
    { keys: ['n'], caps: ['N'], label: 'drain node' },
    { keys: ['x'], caps: ['X'], label: 'delete pod' },
    { keys: ['b'], caps: ['B'], label: 'power' },
  ],
  initial: { readout: '4/4 NODES READY · 5 PODS · 41°C', state: 'BALANCED', pressed: {  } },
  viewBox: '-59.09549882328188 -129 174.48264889255228 233',
  progress: false,
} as const satisfies MiniatureMeta
