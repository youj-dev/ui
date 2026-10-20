'use client'

import { ThemeScope } from '@youj/core'
import type { InternalThemeId as ThemeId } from '@youj/core/lib/youj/theme'
import { themes } from '@youj/core/lib/youj/theme/themes'
import { PlayIcon } from '@youj/icons'
import { Button, ToggleGroup, ToggleGroupItem } from '@youj/react'
import { Segmented } from '@/components/ui/controls'
import { cn } from '@/lib/cn'
import type { StackMode } from './use-stack-progress'

/* The controls every scene shares, built from Youj UI itself: which way
 * the stack is, whether its ambient motion runs, and (where a scene has one)
 * the theme. All keyboard operable: the groups rove with the arrow keys. One
 * height, 32px (40px on touch), like every control on the site. */

export function StackToggle({ mode, onChange, labels = ['Assembled', 'Layers'], className }: {
  mode: StackMode
  onChange: (mode: StackMode) => void
  labels?: readonly [string, string]
  className?: string
}) {
  return (
    <Segmented
      label="View"
      value={mode}
      onChange={(next) => onChange(next)}
      options={[
        { value: 'assembled', label: labels[0] },
        { value: 'exploded', label: labels[1] },
      ]}
      className={className}
    />
  )
}

/**
 * Pauses the scene's ambient motion: drift, loops, theme cycling (WCAG 2.2.2).
 * Under reduced motion there's nothing to pause, so it's disabled.
 */
export function PauseButton({ paused, onChange, disabled }: { paused: boolean; onChange: (paused: boolean) => void; disabled?: boolean }) {
  const playing = !paused && !disabled
  return (
    <Button
      variant="ghost"
      size="icon"
      // shape: a stage toolbar key, the docs stage's 32px (40px on touch)
      aria-label={playing ? 'Pause motion' : 'Play motion'}
      disabled={disabled}
      onClick={() => onChange(!paused)}
      className="size-8 pointer-coarse:size-10"
    >
      <PlayIcon active={playing} size={14} strokeWidth={1.75} />
    </Button>
  )
}

/**
 * The four presets as swatches, each painted by its own theme: the dot is that preset's accent.
 * Classic keeps them plain dots: Bezel draws toggle groups as a padded pill track, which squeezed each ring into an oval.
 */
export function ThemeSwatches({ value, onChange, className }: { value: ThemeId; onChange: (id: ThemeId) => void; className?: string }) {
  return (
    <div data-yj-look="classic" className="contents">
      <ToggleGroup
        size="sm"
        spacing={0}
        aria-label="Theme"
        value={[value]}
        onValueChange={(next) => next[0] && onChange(next[0] as ThemeId)}
        className={cn('max-w-full flex-wrap justify-center gap-0.5', className)}
      >
        {themes.map((theme) => (
          // shape: a stage toolbar key, the docs stage's 32px (40px on touch)
          <ToggleGroupItem key={theme.id} value={theme.id} aria-label={theme.name} title={theme.name} className="size-8 min-w-0 p-0 pointer-coarse:size-10">
            <ThemeScope theme={theme}>
              <span
                aria-hidden
                className="grid size-4 shrink-0 place-items-center rounded-full bg-canvas shadow-[inset_0_0_0_1px_var(--color-line-strong)] group-data-pressed/toggle:shadow-[inset_0_0_0_1.5px_var(--color-fg)]"
              >
                <span className="size-2 rounded-full bg-accent" />
              </span>
            </ThemeScope>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
