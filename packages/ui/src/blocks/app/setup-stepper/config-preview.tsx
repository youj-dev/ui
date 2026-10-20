'use client'

import { useState, type ElementType } from 'react'
import { m } from 'motion/react'
import { MotionFeatures, useYouj } from '@youj/core'
import { AsyncButton } from '../../../components/ui/async-button'
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card'
import { cn } from '../../../lib/utils'
import { toToml, type ConfigLine, type SetupStepperCopy } from './data'

/* The config as it will be saved, rebuilt on every change: TOML in a
 * recessed code well with line numbers, a `~` in the gutter on every line
 * that differs from the template, and a brief accent wash over a line the
 * moment its value changes (opacity only, on the slow token). Copy puts the
 * text on the clipboard. Reduced motion: no wash; the gutter marks stay. */

interface ConfigPreviewProps {
  lines: ConfigLine[]
  copy: SetupStepperCopy
  Heading: ElementType
  titleId: string
  className?: string
}

function Value({ line }: { line: ConfigLine }) {
  if (line.kind === 'comment') return <span className="text-fg-muted">{line.value}</span>
  if (line.kind === 'section') return <span className="font-medium text-fg">{line.value}</span>
  if (line.kind === 'blank') return <span> </span>
  return (
    <>
      <span className="text-fg-muted">{line.name}</span>
      <span className="text-fg-muted"> = </span>
      <span className={cn(line.valueKind === 'string' ? 'text-success' : line.valueKind === 'number' ? 'text-warning' : 'text-fg')}>{line.value}</span>
      {line.note && <span className="text-fg-muted">{`  ${line.note}`}</span>}
    </>
  )
}

function ConfigPreview({ lines, copy, Heading, titleId, className }: ConfigPreviewProps) {
  const k = useYouj()
  // Lines on the first render are simply there; only later edits wash.
  const [firstLines] = useState(lines)
  const changes = lines.filter((l) => l.changed).length

  return (
    <MotionFeatures>
      <Card size="sm" data-slot="config-preview" aria-labelledby={titleId} role="region" className={cn('min-w-0', className)}>
        <CardHeader>
          <CardTitle>
            <Heading id={titleId}>{copy.preview}</Heading>
          </CardTitle>
          <CardAction>
            <span className="font-mono text-ui-sm text-fg-muted normal-case! tracking-normal!">{copy.previewFile}</span>
            <AsyncButton variant="secondary" size="sm" successLabel={copy.copied} onAction={() => navigator.clipboard?.writeText(toToml(lines))}>
              {copy.copy}
            </AsyncButton>
          </CardAction>
        </CardHeader>
        <CardContent>
          <pre data-slot="config-well" className="yj-scrollbar overflow-x-auto rounded-xl bg-[color-mix(in_oklab,var(--color-canvas)_calc(45%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_3%,transparent))] py-3 font-mono text-ui-sm leading-6">
            <code className="grid min-w-max">
              {lines.map((line, i) => (
                <span key={line.key} data-changed={line.changed || undefined} className="relative isolate grid grid-cols-[3ch_1.5ch_auto] gap-x-2 pe-4">
                  {!k.reduced && line.kind === 'pair' && (
                    <m.span
                      key={line.value}
                      aria-hidden
                      className="absolute inset-0 -z-1 bg-accent-subtle"
                      initial={{ opacity: lines === firstLines ? 0 : 1 }}
                      animate={{ opacity: 0 }}
                      transition={k.tween('slow', 'exit')}
                    />
                  )}
                  <span aria-hidden className="text-end text-fg-subtle select-none">
                    {i + 1}
                  </span>
                  <span aria-hidden className="text-accent select-none">
                    {line.changed ? '~' : ''}
                  </span>
                  <span className="whitespace-pre">
                    <Value line={line} />
                  </span>
                </span>
              ))}
            </code>
          </pre>
        </CardContent>
        <CardFooter>
          <span aria-live="polite" className="font-mono text-ui-sm text-fg-muted">
            {copy.changed(changes)}
          </span>
        </CardFooter>
      </Card>
    </MotionFeatures>
  )
}

export { ConfigPreview }
