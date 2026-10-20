import { BRAND, splitAfterComma } from '../brand'
import { Backdrop } from '../film/backdrop'
import { Lockup } from '../film/brand'
import { SpecimenScene } from '../film/scenes/specimen'

const [LEAD, KICKER] = splitAfterComma(BRAND.tagline)
const MODULES = [BRAND.modules.ui, BRAND.modules.motion, BRAND.modules.icons, BRAND.modules.themes]

/* The link preview (1200 × 630, laid out at 960 × 504 and rendered at
 * 1.25×): the lockup and tagline on the start side, and the tokens
 * specimen (the whole contract on one sheet, in Basalt) running off the
 * end side. Taken at a frame where the specimen is built (STILLS_AT.specimen,
 * counted from the specimen's own start). */
export function OgImage() {
  return (
    <>
      <Backdrop glow={0.5} glowAt={{ x: 70, y: 46 }} />
      <Specimen x={372} y={40} scale={0.6} />
      <div
        aria-hidden
        className="absolute inset-y-0 start-0 w-[520px]"
        style={{ background: 'linear-gradient(to right, var(--color-canvas) 62%, color-mix(in oklab, var(--color-canvas) 0%, transparent))' }}
      />
      <div className="absolute start-14 top-[124px] flex w-[380px] flex-col">
        <div style={{ fontSize: 30 }}>
          <Lockup />
        </div>
        <h1 className="mt-9 max-w-[290px] text-[34px] leading-[1.12] font-semibold tracking-[-0.035em] text-balance">
          <span className="text-fg-muted">{LEAD}</span> <span className="text-fg">{KICKER}</span>
        </h1>
        <p className="mt-6 flex items-center gap-2 font-mono text-[10.5px] tracking-[0.06em] whitespace-nowrap text-fg-subtle uppercase">
          {MODULES.map((module, i) => (
            <span key={module} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden className="size-1 rounded-[1px] bg-accent" />}
              {module}
            </span>
          ))}
        </p>
      </div>
    </>
  )
}

/** The specimen, laid out on its own 1440 × 810 sheet, placed and scaled. */
export function Specimen({ x, y, scale }: { x: number; y: number; scale: number }) {
  return (
    <div className="absolute top-0 left-0 origin-top-left" style={{ width: 1440, height: 810, transform: `translate(${x}px, ${y}px) scale(${scale})` }}>
      <SpecimenScene leaveAt={Infinity} />
    </div>
  )
}
