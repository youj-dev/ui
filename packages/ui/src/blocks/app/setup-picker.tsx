'use client'

import { useId, useState, type HTMLAttributes } from 'react'
import { ThemeScope, type ThemeInput } from '@youj/core'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from '../../components/ui/field'
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group'
import { useAnnouncer } from '../../hooks/use-announcer'
import { DEFAULT_COPY, demo, type SetupPickerCopy, type SetupShape } from './setup-picker/data'
import { SetupShapeScene } from './setup-picker/shapes'
import { cn } from '../../lib/utils'

/* A setup step that shows each choice as the thing it builds. Three
 * deployment shapes as choice cards, each with a small isometric plan:
 * unchosen, a wireframe of the nodes it would run; chosen, the nodes drop
 * onto their plinths and the primary lights up in the accent. The sentence
 * under the cards says what the choice means, and Continue saves it
 * (Button onAction). Arrow keys move between the cards (RadioGroup), and the
 * choice is announced. Reduced motion: the chosen plan is simply built.
 * It is built for the compact layout density (ui.css), taken from the page; embedded, it keeps its natural width unless `fill`. */

interface SetupPickerProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (960px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the block's strings, the options included, to rewrite or translate. */
  copy?: Partial<SetupPickerCopy>
  /** The id of the option chosen when the step opens. Default 'replicated'. */
  defaultShape?: string
  /** Saves the choice; resolve when it's stored. Default: a short demo wait. */
  onContinue?: (shape: string) => Promise<unknown> | unknown
  onBack?: () => void
}

function SetupPicker({ theme, embedded = true, fill = false, copy: copyProp, defaultShape = 'replicated', onContinue, onBack, className, ...rest }: SetupPickerProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const titleId = useId()
  const questionId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const Question = embedded ? 'h3' : 'h2'
  const { announce, announcer } = useAnnouncer()
  const [shape, setShape] = useState(defaultShape)
  const chosen = copy.options.find((o) => o.id === shape) ?? copy.options[0]!

  const card = (
    <Card className={cn('w-full text-fg', !embedded && !fill && 'max-w-240')}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription>{copy.subtitle}</CardDescription>
        <CardAction>
          <span>{copy.step}</span>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Question id={questionId} className="text-ui-lg font-medium tracking-tight">
            {copy.question}
          </Question>
          <p className="text-ui text-pretty text-fg-muted">{copy.lead}</p>
        </div>
        <RadioGroup
          aria-labelledby={questionId}
          value={shape}
          onValueChange={(value) => {
            setShape(String(value))
            const option = copy.options.find((o) => o.id === value)
            if (option) announce(copy.chosen(option.title))
          }}
          className="grid grid-cols-1 gap-3 sm:grid-cols-3"
        >
          {copy.options.map((option) => (
            <FieldLabel key={option.id} className="h-full">
              <Field orientation="vertical" className="h-full" data-shape={option.id}>
                {/* A row on a phone (the plan beside its name), a column of three from sm up. */}
                <div className="flex h-full items-center gap-3 sm:flex-col sm:items-stretch">
                  <div aria-hidden className="relative isolate grid w-28 shrink-0 place-items-center overflow-hidden rounded-md bg-transparent px-1.5 py-2 sm:w-auto sm:px-2 sm:py-3">
                    <SetupShapeScene shape={option.shape ?? (option.id as SetupShape)} chosen={option.id === shape} />
                  </div>
                  <div className="flex min-w-0 flex-1 items-start gap-3 sm:flex-none">
                    <FieldContent className="min-w-0 flex-1">
                      <FieldTitle>{option.title}</FieldTitle>
                      <FieldDescription className="font-mono text-ui-xs tracking-normal">{option.detail}</FieldDescription>
                    </FieldContent>
                    <RadioGroupItem value={option.id} className="mt-0.5" />
                  </div>
                </div>
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
        <p className="min-h-10 text-ui text-pretty text-fg-muted">{chosen.summary}</p>
      </CardContent>

      <CardFooter className="flex-wrap">
        <Button variant="secondary" onClick={onBack}>
          {copy.back}
        </Button>
        <AsyncButton onAction={() => (onContinue ? onContinue(shape) : demo('SetupPicker: onContinue', 900))} pendingLabel={copy.saving} successLabel={copy.saved}>
          {copy.next}
        </AsyncButton>
      </CardFooter>
      {announcer}
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-240', className)}>
      {card}
    </section>
  ) : (
    <main
      aria-labelledby={titleId}
      {...rest}
      className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}
    >
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { SetupPicker, type SetupPickerProps }
