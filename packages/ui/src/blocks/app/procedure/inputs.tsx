'use client'

import { Counter } from '@youj/motion'
import { Checkbox } from '../../../components/ui/checkbox'
import { Eyebrow } from '../../../components/ui/typography'
import { cn } from '../../../lib/utils'
import { scaleAmount, type ProcedureCopy, type ProcedureInput, type ProcedureUnit } from './data'

interface InputsProps {
  inputs: ProcedureInput[]
  units: ProcedureUnit[]
  /** Yield shown over yield written. */
  factor: number
  gathered: Set<string>
  onToggle: (id: string, on: boolean) => void
  copy: ProcedureCopy
  SectionTitle: 'h2' | 'h3'
  titleId: string
}

/** How much, scaled to the yield: Intl spells units it knows in the locale; a unit's `label` covers the ones it doesn't. */
function Quantity({ input, units, factor, copy }: { input: ProcedureInput; units: ProcedureUnit[]; factor: number; copy: ProcedureCopy }) {
  const value = scaleAmount(input, factor, units)
  const unit = units.find((u) => u.id === input.unit)
  return (
    <span dir="auto" className="inline-flex shrink-0 items-baseline gap-1 font-mono text-ui-lg text-fg tabular-nums">
      <Counter
        value={value}
        mode="roll"
        inView={false}
        className="[&_[data-part=unit]]:text-[0.8em]!"
        locale={copy.locale}
        format={unit?.format ?? { maximumFractionDigits: 1 }}
      />
      {unit?.label && (
        <span data-part="unit" className="text-[0.8em] text-fg-muted">
          {unit.label}
        </span>
      )}
    </span>
  )
}

/** The inputs as a checklist: tick what's on the counter; the quantities roll to each new yield. */
function Inputs({ inputs, units, factor, gathered, onToggle, copy, SectionTitle, titleId }: InputsProps) {
  return (
    <section aria-labelledby={titleId} className="flex min-w-0 flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <Eyebrow render={<SectionTitle id={titleId} />}>{copy.inputs}</Eyebrow>
        <span dir="auto" className="font-mono text-ui-sm text-fg-muted tabular-nums">{copy.gathered(inputs.filter((i) => gathered.has(i.id)).length, inputs.length)}</span>
      </div>
      {/* Beside the method it takes the method's height and scrolls inside it; stacked, it stops at 15rem. */}
      <div className="md:relative md:min-h-48 md:flex-1">
        <ul className="yj-scrollbar -mx-1 flex max-h-60 flex-col overflow-y-auto px-1 md:absolute md:inset-0 md:max-h-full">
          {inputs.map((input) => {
            const on = gathered.has(input.id)
            return (
              <li key={input.id} className="border-t border-line first:border-t-0">
                <label className="group/input flex min-h-11 cursor-pointer items-center gap-3 py-2">
                  <Checkbox checked={on} onCheckedChange={(checked) => onToggle(input.id, checked === true)} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span
                      className={cn(
                        'truncate text-ui-lg text-fg decoration-fg-subtle transition-[color] yj-duration-fast ease-standard',
                        on && 'text-fg-muted line-through',
                      )}
                    >
                      {input.name}
                    </span>
                    {input.note && <span className="truncate text-ui-sm text-fg-muted">{input.note}</span>}
                  </span>
                  <span className={cn('transition-opacity yj-duration-fast ease-standard', on && 'opacity-50')}>
                    <Quantity input={input} units={units} factor={factor} copy={copy} />
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

export { Inputs }
