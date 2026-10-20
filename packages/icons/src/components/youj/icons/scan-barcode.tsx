import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/* scan-face's corner brackets around four bars. */
const CORNERS = ['M3 8 V5 A2 2 0 0 1 5 3 H8', 'M16 3 H19 A2 2 0 0 1 21 5 V8', 'M21 16 V19 A2 2 0 0 1 19 21 H16', 'M8 21 H5 A2 2 0 0 1 3 19 V16']

/** A scan: the laser line switches on at the top of the code, sweeps down across the bars and back, and switches off. */
export const ScanBarcodeIcon = createIcon({
  name: 'scan-barcode',
  category: 'commerce',
  keywords: ['barcode', 'scan', 'product', 'inventory', 'sku', 'checkout', 'retail', 'qr'],
  variants: (k) => ({
    laser: {
      rest: { y: -4, opacity: 0, transition: k.tween('fast', 'exit') },
      active: {
        y: [-4, 4, -4],
        opacity: [0, 1, 1, 0],
        transition: {
          y: seq(k, 'deliberate', [0, 0.5, 1], ['standard', 'standard']),
          opacity: seq(k, 'deliberate', [0, 0.1, 0.9, 1], ['linear', 'linear', 'linear']),
        },
      },
    },
  }),
  render: (v) => (
    <>
      {CORNERS.map((d) => (
        <path key={d} d={d} />
      ))}
      <path d="M7.5 8 V16 M10.5 8 V16 M13 8 V16 M16.5 8 V16" />
      <m.path d="M5.5 12 H18.5" variants={v.laser} />
    </>
  ),
})
