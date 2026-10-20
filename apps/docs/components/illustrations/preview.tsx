'use client'

import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { DEFAULT_LOOK, YoujProvider, ThemeScope, useYouj } from '@youj/core'
import type { InternalThemeId as ThemeId } from '@youj/core/lib/youj/theme'
import { GaugeIcon, LayersIcon, RefreshIcon } from '@youj/icons'
import { Toggle, Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@youj/react'
import { Segmented } from '@/components/ui/controls'
import { TOOLBAR_BUTTON } from '@/components/ui/preview-controls'
import { ThemeSelect } from '@/components/showcase/theme-picker'
import { cn } from '@/lib/cn'
import { modePreset, sitePreset } from '@/lib/preview'
import { useSiteTheme } from '@/lib/site-theme'
import type { SceneEntry } from './catalog'
import { Stage } from '@/components/site/stage'

/* The detail panel's stage: the scene drawn large and live, in a theme of its
 * own. The preset and the scheme are scoped to the stage (the page keeps its
 * own); "Apart" holds the scene taken apart, "Reduced" draws it as reduced
 * motion does, and Replay assembles it again. A still copy in the same theme,
 * out of sight, is what the downloads are made from, so a file is the frame
 * you see without the bob. */

export interface PreviewSettings {
  /** A preset for the stage, or null for the default: the site's preset for the stage's scheme (Graphite in light, Basalt in dark). */
  preset: ThemeId | null
  /** Light or dark for the stage, or null for the site's. */
  mode: 'light' | 'dark' | null
  apart: boolean
  reduced: boolean
}

export const DEFAULT_PREVIEW: PreviewSettings = { preset: null, mode: null, apart: false, reduced: false }

/**
 * The stage's theme: the chosen scheme (else the site's) and preset (else the
 * site's preset for that scheme). `themed` is whether it differs from the
 * preset the site is showing, so the stage scopes a theme only when it must.
 */
export function usePreviewTheme(settings: PreviewSettings) {
  const site = useSiteTheme()
  const mode = settings.mode ?? (site.dark ? 'dark' : 'light')
  const preset = settings.preset ?? modePreset(mode === 'dark')
  return { preset, mode, themed: preset !== modePreset(site.dark) }
}

interface StageProps {
  scene: SceneEntry
  settings: PreviewSettings
  /** Bumped to assemble the scene again. */
  replay: number
  /** The still copy the downloads read, once it's drawn. */
  onStill: (svg: SVGSVGElement | null) => void
  compact?: boolean
  children?: ReactNode
}

export function PreviewStage({ scene, settings, replay, onStill, compact, children }: StageProps) {
  const site = useYouj()
  const { preset, mode, themed } = usePreviewTheme(settings)
  const reduced = settings.reduced || site.reduced
  const { Component } = scene
  const still = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    onStill(still.current?.querySelector('svg') ?? null)
  })

  return (
    <YoujProvider timeScale={site.timeScale} reducedMotion={reduced ? 'always' : 'user'} look={DEFAULT_LOOK}>
      <ThemeScope theme={themed ? sitePreset(preset) : undefined}>
        <Stage
          theme={themed ? preset : undefined}
          mode={mode}
          data-slot="illustration-stage"
          className={cn(
            'relative isolate grid w-full place-items-center overflow-hidden rounded-2xl border border-line bg-canvas',
            compact ? 'aspect-[4/3]' : 'aspect-[5/4]',
          )}
        >
          <span aria-hidden className="dot-grid absolute inset-0 opacity-80 [mask-image:radial-gradient(ellipse_75%_80%_at_50%_55%,black,transparent)]" />
          <span aria-hidden className="absolute inset-x-[16%] bottom-[8%] h-1/2 rounded-full bg-hover blur-3xl" />
          <div className="relative w-[90%]">
            {/* Keyed on the scene and each replay, so it assembles as it arrives. */}
            <Component
              key={`${scene.id}-${replay}-${reduced}`}
              assemble
              float
              explode={settings.apart ? 1 : 'hover'}
              unit={22}
              grow
              title={scene.name}
              description={scene.description || undefined}
            />
          </div>
          {/* The frame the downloads are made from: finished, still, apart when Apart is on, in this theme. */}
          <div ref={still} aria-hidden inert className="pointer-events-none fixed -start-[200vw] top-0 w-[400px]">
            <YoujProvider reducedMotion="always">
              <Component key={scene.id} assemble={false} float={false} explode={settings.apart ? 1 : 0} unit={22} />
            </YoujProvider>
          </div>
          {children}
        </Stage>
      </ThemeScope>
    </YoujProvider>
  )
}

interface ControlsProps {
  settings: PreviewSettings
  onChange: (patch: Partial<PreviewSettings>) => void
  onReplay: () => void
  className?: string
}

/**
 * A scene preview's controls, as one row at the size every preview toolbar on
 * the site shares (`control-xs`): the theme as the same specimens the other
 * previews pick from, its light or dark, then Apart, Reduced motion and Replay.
 */
export function PreviewControls({ settings, onChange, onReplay, className }: ControlsProps) {
  const site = useYouj()
  const { preset, mode } = usePreviewTheme(settings)
  const siteDark = useSiteTheme().dark
  const modeDefault = modePreset(mode === 'dark')
  const locked = site.reduced
  return (
    <TooltipProvider>
      <div className={cn('flex flex-nowrap items-center gap-1.5', className)}>
        <ThemeSelect value={preset} onChange={(next) => onChange({ preset: next === modeDefault ? null : next })} />
        <Segmented
          label="Preview scheme"
          compact
          value={mode}
          onChange={(next) => onChange({ mode: (next === 'dark') === siteDark ? null : next })}
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
        />
        <span className="ms-auto flex items-center gap-1">
          <IconToggle
            label="Apart"
            hint="Hold it taken apart, as hovering shows it"
            pressed={settings.apart}
            onPressedChange={(apart) => onChange({ apart })}
          >
            <LayersIcon size={15} strokeWidth={1.75} active={settings.apart} />
          </IconToggle>
          <IconToggle
            label="Reduced motion"
            hint={locked ? 'Reduced motion is on for the whole site' : 'Draw it as reduced motion does: finished and still'}
            pressed={settings.reduced || locked}
            disabled={locked}
            onPressedChange={(reduced) => onChange({ reduced })}
          >
            <GaugeIcon size={15} strokeWidth={1.75} active={!(settings.reduced || locked)} />
          </IconToggle>
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={onReplay}
                  disabled={settings.reduced || locked}
                  aria-label="Replay the assemble"
                  className={cn(TOOLBAR_BUTTON, 'disabled:opacity-40')}
                />
              }
            >
              <RefreshIcon size={15} strokeWidth={1.75} />
            </TooltipTrigger>
            <TooltipContent>{settings.reduced || locked ? 'Nothing assembles under reduced motion' : 'Replay the assemble'}</TooltipContent>
          </Tooltip>
        </span>
      </div>
    </TooltipProvider>
  )
}

function IconToggle({
  label,
  hint,
  pressed,
  disabled,
  onPressedChange,
  children,
}: {
  label: string
  hint: string
  pressed: boolean
  disabled?: boolean
  onPressedChange: (pressed: boolean) => void
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Toggle
            variant="outline"
            size="sm"
            aria-label={label}
            pressed={pressed}
            disabled={disabled}
            onPressedChange={onPressedChange}
            className="size-control-xs min-w-0 px-0"
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  )
}
