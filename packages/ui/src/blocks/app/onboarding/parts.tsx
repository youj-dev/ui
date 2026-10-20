'use client'

import { useEffect, useRef } from 'react'
import { presetById, ThemeScope } from '@youj/core'
import { CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from '../../../components/ui/field'
import { RadioGroupItem } from '../../../components/ui/radio-group'

export function StepHeading({ title, description, level = 2 }: { title: string; description: string; level?: 2 | 3 | 4 }) {
  const Heading = `h${level}` as const
  const ref = useRef<HTMLHeadingElement>(null)
  const mounted = useRef(false)
  useEffect(() => {
    // The first step is simply there; later ones take focus as they arrive.
    if (mounted.current) return
    mounted.current = true
    if (document.activeElement && document.activeElement !== document.body) ref.current?.focus()
  }, [])
  return (
    <CardHeader className="px-0">
      <CardTitle>
        <Heading ref={ref} tabIndex={-1} className="outline-none">
          {title}
        </Heading>
      </CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
  )
}

export function ThemeCard({ id, preview }: { id: string; preview: string }) {
  const preset = presetById(id)
  return (
    <FieldLabel>
      <Field orientation="horizontal">
        <RadioGroupItem value={preset.id} />
        <FieldContent>
          <FieldTitle>{preset.name}</FieldTitle>
          <FieldDescription className="line-clamp-2">{preset.description}</FieldDescription>
          {/* A preview in the preset's own theme. */}
          <ThemeScope theme={preset}>
            <span aria-hidden className="mt-2 flex items-center gap-2 rounded-lg border border-line bg-canvas p-2.5">
              <span className="h-control-sm rounded-md bg-accent px-2.5 text-ui-sm leading-[var(--spacing-control-sm)] font-medium text-on-accent">
                {preview}
              </span>
              <span className="h-control-sm flex-1 rounded-md border border-line-control bg-canvas" />
              <span className="size-5 rounded-full bg-accent-line" />
            </span>
          </ThemeScope>
        </FieldContent>
      </Field>
    </FieldLabel>
  )
}
