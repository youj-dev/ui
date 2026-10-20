'use client'

import type { ComponentType, CSSProperties } from 'react'
import { ActivityIcon, DatabaseIcon, FolderInputIcon } from '@youj/icons'
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from '../../../components/ui/field'
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group'
import { cn } from '../../../lib/utils'
import type { FirstSourceCopy, FirstSourceKind, FirstSourceOption } from './data'

/* The ways in, as choice cards: the whole card is the target, arrow
 * keys move between them (one tab stop), and the chosen one tints. Each has
 * its icon on a disc, a title, and the formats it takes in mono. The formats
 * never break inside a name: each sits in its own no-wrap run. */

const ICONS: Record<FirstSourceKind, ComponentType<{ size?: number; className?: string }>> = {
  database: DatabaseIcon,
  stream: ActivityIcon,
  files: FolderInputIcon,
}

export function SourceOptions({ copy, sources, value, onChange }: { copy: FirstSourceCopy; sources: FirstSourceOption[]; value: string; onChange: (source: string) => void }) {
  return (
    <RadioGroup aria-label={copy.sourceLabel} value={value} onValueChange={(next) => onChange(String(next))} style={{ '--n': sources.length } as CSSProperties} className="grid gap-2.5 sm:grid-cols-[repeat(var(--n),minmax(0,1fr))]">
      {sources.map((source) => {
        const Icon = source.icon ?? ICONS[source.kind ?? 'files']
        const { label: title, description: detail } = source
        return (
          <FieldLabel key={source.id} className="min-w-0">
            {/* A row on a phone; from sm, a tile: the disc and the radio on top, the words under them at full width. */}
            <Field orientation="horizontal" className="items-start gap-3 sm:flex-wrap">
              <span
                aria-hidden
                className={cn(
                  'grid size-8 shrink-0 place-items-center rounded-lg transition-colors yj-duration-fast ease-standard',
                  source.id === value ? 'bg-accent-subtle text-fg' : 'bg-band text-fg-muted',
                )}
              >
                <Icon size={16} />
              </span>
              <FieldContent className="min-w-0 gap-0.5 pt-px sm:order-last sm:basis-full sm:pt-0">
                <FieldTitle className="text-ui font-medium">{title}</FieldTitle>
                <FieldDescription className="font-mono text-ui-xs tracking-normal">
                  {detail.split(' · ').map((part, i) => (
                    <span key={part} className="whitespace-nowrap">
                      {i > 0 && ' · '}
                      {part}
                    </span>
                  ))}
                </FieldDescription>
              </FieldContent>
              <RadioGroupItem value={source.id} className="mt-1.5 sm:ms-auto" />
            </Field>
          </FieldLabel>
        )
      })}
    </RadioGroup>
  )
}
