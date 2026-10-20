'use client'

import { useId, type HTMLAttributes } from 'react'
import { ThemeScope, type ThemeInput } from '@youj/core'
import { PlusIcon } from '@youj/icons'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import { DEFAULT_COPY, DEFAULT_EFFECTS, EFFECT_IDS, type EffectId, type EffectsInspectorCopy, type EffectsValue } from './effects-inspector/data'
import { Panels } from './effects-inspector/panels'
import { Preview } from './effects-inspector/preview'

/* A design tool's effects panel with the thing it styles beside it: a stack
 * of collapsible panels (a drop or inner shadow, a stroke, a fill, a layer
 * blur, uniform or progressive) built from the kit's inspector fields, and a
 * button painted from exactly those values, with the CSS they come to. Drag a
 * field's handle to scrub it, type, or use the arrow keys; every panel has a
 * checkbox (apply or not), an eye (show or hide) and a trash (take it out of
 * the stack, and bring it back from Add effect). The values are the app's:
 * `value` / `onValueChange` hold them, so the app can style its own layer from
 * the same object. The panel column scrolls inside a fixed height, so
 * changing the effects never resizes the block. Reduced motion: the panels
 * open and close at once. Every string is in `copy`. It is built for the
 * compact layout density (ui.css), taken from the page. */

interface EffectsInspectorProps extends Omit<HTMLAttributes<HTMLElement>, 'defaultValue'> {
  /** The effects (controlled). */
  value?: EffectsValue
  /** The effects it opens with (uncontrolled). Default: a drop shadow, an inside stroke and a blue fill, with the blur off. */
  defaultValue?: EffectsValue
  onValueChange?: (value: EffectsValue) => void
  /** Wraps the page in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another page: a `section` named by an `h2`, without the page around it. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (896px at 100% scale). Default false. */
  fill?: boolean
  /** The title's level. Default 1, or 2 when embedded. */
  headingLevel?: 1 | 2 | 3
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<EffectsInspectorCopy>
}

function EffectsInspector({
  value: valueProp,
  defaultValue = DEFAULT_EFFECTS,
  onValueChange,
  theme,
  embedded = true,
  fill = false,
  headingLevel = embedded ? 2 : 1,
  copy: copyProp,
  className,
  ...rest
}: EffectsInspectorProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const [value, setValue] = useControllableState(valueProp, defaultValue)
  const titleId = useId()
  const Title = `h${headingLevel}` as const

  const update = (next: EffectsValue) => {
    setValue(next)
    onValueChange?.(next)
  }
  const change = <K extends EffectId>(id: K, patch: Partial<EffectsValue[K]>) => update({ ...value, [id]: { ...value[id], ...patch } })
  const absent = EFFECT_IDS.filter((id) => !value[id].present)
  const names: Record<EffectId, string> = { shadow: copy.shadow, stroke: copy.stroke, fill: copy.fill, blur: copy.blur }

  const card = (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription>{copy.description}</CardDescription>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" disabled={absent.length === 0} />}>
              <PlusIcon size={14} trigger="none" /> {copy.add}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
              {absent.map((id) => (
                <DropdownMenuItem key={id} onClick={() => change(id, { present: true, enabled: true, visible: true } as Partial<EffectsValue[typeof id]>)}>
                  {names[id]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-[minmax(0,1fr)_--spacing(88)]">
        <Preview value={value} copy={copy} />
        <div
          data-slot="effects-stack"
          className="flex h-120 flex-col gap-3 overflow-y-auto pb-10 pe-1 yj-scrollbar [&>section+section]:border-t [&>section+section]:border-line [&>section+section]:pt-3"
          style={{ maskImage: 'linear-gradient(to bottom, black calc(100% - 3rem), transparent)' }}
        >
          <Panels value={value} copy={copy} change={change} remove={(id) => change(id, { present: false, enabled: false } as Partial<EffectsValue[typeof id]>)} />
        </div>
      </CardContent>
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-4xl', className)}>
      {card}
    </section>
  ) : (
    <main aria-labelledby={titleId} {...rest} className={cn('min-h-dvh bg-canvas px-4 py-10 text-fg sm:py-14', className)}>
      <div className={cn('mx-auto w-full', !fill && 'max-w-4xl')}>{card}</div>
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { EffectsInspector, DEFAULT_EFFECTS, type EffectsInspectorProps, type EffectsInspectorCopy, type EffectsValue }
export type { BlurType, EffectId, ShadowType, StrokePosition } from './effects-inspector/data'
