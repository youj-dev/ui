'use client'

import { useCallback, useContext, useId, type HTMLAttributes, type ReactNode } from 'react'
import { ThemeScope, useYouj, type SoundCueSink, type ThemeInput } from '@youj/core'
import { SoundCueContext } from '@youj/core/internal'
import { RefreshIcon, VolumeIcon } from '@youj/icons'
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Slider } from '../../components/ui/slider'
import { Switch } from '../../components/ui/switch'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import { DEFAULT_COPY, DEFAULT_SOUND_SETTINGS, EVENTS, type SoundEvent, type SoundSettingsCopy, type SoundSettingsValue } from './sound-settings/data'
import { EventList, usePreview } from './sound-settings/event-list'
import { PackPicker } from './sound-settings/pack-picker'
import { SoundCheck } from './sound-settings/sound-check'

/* Sound preferences: whether the app makes sounds at all, how loud, in which
 * pack, and for which moments. Nothing here plays on its own. Play on a row,
 * and scrubbing the sound check, are the only ways to hear anything; every
 * switch, slider and card is silent itself.
 *
 * The block holds the settings and reports them (`value` / `onValueChange`);
 * the app keeps them and feeds its own YoujProvider, so a preview is heard
 * in the chosen pack at the chosen volume, and the whole app follows:
 *
 *   const packs = { glass, wood: definePack({ sounds: { tap: candidates.tap.wood, … } }), … }
 *   <YoujProvider sound={{ pack: packs[s.pack], volume: s.volume, muted: !s.enabled, whenReduced: s.playWhenReduced }}>
 *     <SoundEventFilter events={s.events}>{app}</SoundEventFilter>
 *   </YoujProvider>
 *
 * Previews go out on motion's cue bus, so this file never imports
 * @youj/sound. Without a provider above, they're silent and the page
 * says so. Sounds off: the pack, the volume and the rows go inert and the
 * speaker is crossed out. Reduced motion: sounds follow motion and go quiet
 * with it, so the page says why, next to the switch that keeps them. Every
 * string, pack and event names included, is in `copy`.
 * It is built for the compact layout density (ui.css), taken from the page. */

/**
 * Silences the moments a person switched off: wrap the app, inside its
 * YoujProvider, and every cue a switched-off event covers is dropped before
 * it's played. Cues no event covers (a dialog opening, a slider's detent)
 * pass through.
 */
function SoundEventFilter({ events, children }: { events: Record<SoundEvent, boolean>; children: ReactNode }) {
  const sink = useContext(SoundCueContext)
  const filtered = useCallback<SoundCueSink>(
    (cue, reduced) => {
      const event = EVENTS.find((e) => e.cues.includes(cue))
      if (!event || events[event.id]) sink?.(cue, reduced)
    },
    [sink, events],
  )
  return <SoundCueContext.Provider value={sink ? filtered : null}>{children}</SoundCueContext.Provider>
}

interface SoundSettingsProps extends Omit<HTMLAttributes<HTMLElement>, 'defaultValue'> {
  /** The settings (controlled). Keep them, and pass them to your YoujProvider. */
  value?: SoundSettingsValue
  /** The settings it opens with (uncontrolled). Default: on, Glass, half volume, every event. */
  defaultValue?: SoundSettingsValue
  onValueChange?: (value: SoundSettingsValue) => void
  /** Wraps the page in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another settings page: a `section` named by an `h2`, without the page around it. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (672px at 100% scale). Default false. */
  fill?: boolean
  /** The page title's level; the cards' titles sit one below it. Default 1, or 2 when embedded. */
  headingLevel?: 1 | 2 | 3
  /** Any of the page's strings, to rewrite or translate. */
  copy?: Partial<SoundSettingsCopy>
}

function SoundSettings({
  value: valueProp,
  defaultValue = DEFAULT_SOUND_SETTINGS,
  onValueChange,
  theme,
  embedded = true,
  fill = false,
  headingLevel = embedded ? 2 : 1,
  copy: copyProp,
  className,
  ...rest
}: SoundSettingsProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const [value, setValue] = useControllableState(valueProp, defaultValue)
  const update = (patch: Partial<SoundSettingsValue>) => {
    const next = { ...value, ...patch }
    setValue(next)
    onValueChange?.(next)
  }
  const { reduced } = useYouj()
  const heard = useContext(SoundCueContext) !== null
  const { playing, play } = usePreview()
  const titleId = useId()
  const reducedId = useId()
  const Title = `h${headingLevel}` as const
  const CardHeading = `h${Math.min(headingLevel + 1, 3)}` as 'h2' | 'h3'
  const off = !value.enabled
  const changed = JSON.stringify(value) !== JSON.stringify(DEFAULT_SOUND_SETTINGS)
  const quietForMotion = reduced && !value.playWhenReduced && value.enabled

  const page = (
    <div className="flex w-full flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-col gap-1">
          <Title id={titleId} className="text-2xl font-semibold tracking-tight text-fg">
            {copy.title}
          </Title>
          <p className="max-w-lg text-ui text-pretty text-fg-muted">
            {copy.description}
          </p>
        </div>
        <Button variant="ghost" size="sm" sound={false} disabled={!changed} className="ms-auto" onClick={() => update(DEFAULT_SOUND_SETTINGS)}>
          <RefreshIcon size={14} /> {copy.reset}
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>
            <CardHeading>{copy.interfaceSounds}</CardHeading>
          </CardTitle>
          <CardDescription>{off ? copy.offDescription : copy.onDescription}</CardDescription>
          <CardAction className="flex items-center gap-2.5">
            <VolumeIcon size={18} active={off} className={cn('transition-colors yj-duration-fast ease-standard', off ? 'text-fg-muted' : 'text-fg')} />
            <Switch sound={false} checked={value.enabled} onCheckedChange={(enabled) => update({ enabled })} aria-label={copy.interfaceSounds} />
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className={cn('flex flex-col gap-3 transition-opacity yj-duration-fast ease-standard', off && 'opacity-60')}>
            <div className="flex items-baseline justify-between gap-3">
              <span aria-hidden className="text-ui font-medium text-fg">
                {copy.volume}
              </span>
              <output aria-hidden className="font-mono text-ui-sm tabular-nums text-fg-muted">
                {copy.volumeValue(Math.round(value.volume * 100))}
              </output>
            </div>
            <Slider
              aria-label={copy.volume}
              min={0}
              max={100}
              step={5}
              disabled={off}
              value={Math.round(value.volume * 100)}
              onValueChange={(next) => update({ volume: (Array.isArray(next) ? next[0]! : next) / 100 })}
              getAriaValueText={(_, v) => copy.volumeValue(v)}
            />
          </div>
          <div className="flex items-center gap-4 border-t border-line pt-4">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span id={reducedId} className="text-ui font-medium text-fg">
                {copy.keepReduced}
              </span>
              <span className="text-ui-sm text-pretty text-fg-muted">{copy.keepReducedDetail}</span>
            </div>
            <Switch
              sound={false}
              disabled={off}
              checked={value.playWhenReduced}
              onCheckedChange={(playWhenReduced) => update({ playWhenReduced })}
              aria-labelledby={reducedId}
            />
          </div>
          {/* Under reduced motion the note keeps its room whether it applies or not, so the switches never resize the card. */}
          {reduced && (
            <Alert variant="info" aria-hidden={!quietForMotion || undefined} className={cn(!quietForMotion && 'invisible')}>
              <AlertTitle>{copy.quietTitle}</AlertTitle>
              <AlertDescription>{copy.quietBody}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <CardHeading>{copy.packTitle}</CardHeading>
          </CardTitle>
          <CardDescription>{copy.packDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <PackPicker value={value.pack} onChange={(pack) => update({ pack })} disabled={off} copy={copy} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <CardHeading>{copy.eventsTitle}</CardHeading>
          </CardTitle>
          <CardDescription>{copy.eventsDescription}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <SoundCheck events={value.events} disabled={off} onPlay={play} copy={copy} />
          <EventList
            events={value.events}
            onToggle={(event, on) => update({ events: { ...value.events, [event]: on } })}
            disabled={off}
            playing={playing}
            onPlay={play}
            copy={copy}
          />
          {!heard && <p className="text-ui-sm text-fg-muted">{copy.silent}</p>}
        </CardContent>
      </Card>
    </div>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-2xl', className)}>
      {page}
    </section>
  ) : (
    <main aria-labelledby={titleId} {...rest} className={cn('min-h-dvh bg-canvas px-4 py-10 text-fg sm:py-14', className)}>
      <div className={cn('mx-auto w-full', !fill && 'max-w-2xl')}>{page}</div>
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { SoundEventFilter, SoundSettings, DEFAULT_SOUND_SETTINGS, type SoundSettingsProps, type SoundSettingsValue, type SoundSettingsCopy, type SoundEvent }
export type { SoundPackId } from './sound-settings/data'
