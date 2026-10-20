import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

const UNITS = [7, 17]

/** Under load: each unit's status light flickers out of step with the other while its throughput meter surges. */
export const ServerIcon = createIcon({
  name: 'server',
  category: 'development',
  keywords: ['backend', 'hosting', 'infrastructure', 'rack', 'datacenter', 'host', 'node'],
  variants: (k) => {
    const unit = (i: number) => {
      const t = i === 0 ? [0, 0.1, 0.3, 0.45, 0.6, 1] : [0, 0.25, 0.4, 0.62, 0.78, 1]
      return {
        led: {
          rest: { opacity: 1, transition: k.tween('fast') },
          active: { opacity: [1, 0.15, 1, 0.15, 1, 1], transition: seq(k, 'deliberate', t, ['linear', 'linear', 'linear', 'linear', 'linear']) },
        },
        meter: {
          rest: { pathLength: 1, transition: k.tween('fast') },
          active: { pathLength: [1, 0.35, 1, 0.6, 1, 1], transition: seq(k, 'deliberate', t) },
        },
      }
    }
    const [a, b] = [unit(0), unit(1)]
    return { led0: a.led, meter0: a.meter, led1: b.led, meter1: b.meter }
  },
  render: (v) => (
    <>
      {UNITS.map((y, i) => (
        <g key={y}>
          <rect x="3" y={y - 3.5} width="18" height="7" rx="2" />
          <m.path d={`M7 ${y} h.01`} strokeWidth={2} variants={v[`led${i}` as 'led0']} />
          <m.path d={`M12 ${y} H17`} variants={v[`meter${i}` as 'meter0']} />
        </g>
      ))}
    </>
  ),
})
