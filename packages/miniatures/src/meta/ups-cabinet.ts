import type { MiniatureMeta } from '../engine/types'

/** PALISADE U20, ups cabinet: what a showroom shows before it mounts. */
export const upsCabinet = {
  id: 'ups-cabinet',
  name: 'UPS cabinet',
  model: 'PALISADE U20',
  maker: 'PALISADE / POWER SYSTEMS',
  study: '066',
  spec: 'U20 / 20 kVA ONLINE · 16 × 12 V VRLA · ATS + GENERATOR',
  label: 'UPS cabinet, PALISADE U20',
  description: 'An automatic transfer switch, an online UPS with a mimic-diagram display, a battery cabinet with sixteen blocks behind glass, and a load rack, joined by an overhead cable tray. Pull the utility supply and the UPS carries the load on its batteries while the alarm beeps; the generator starts, the transfer switch swings over and the batteries recharge. Restore the utility, step the load, run a battery test or put the UPS in bypass.',
  keys: [
    { keys: ['m'], caps: ['M'], label: 'pull mains', toggle: true },
    { keys: ['l'], caps: ['L'], label: 'load' },
    { keys: ['t'], caps: ['T'], label: 'battery test' },
    { keys: ['b'], caps: ['B'], label: 'bypass', toggle: true },
    { keys: ['a'], caps: ['A'], label: 'silence alarm' },
  ],
  initial: {
    readout: 'ON LINE · LOAD 50% · BATT 100% · 80 MIN',
    state: 'UTILITY OK · GENERATOR STANDBY',
    pressed: { m: false, b: false },
  },
  viewBox: '-110.45894683899488 -182 269.41531628991834 315',
  progress: false,
} as const satisfies MiniatureMeta
