'use client'

import { useEffect, useId, useMemo, useRef, useState, type ComponentProps } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { MicIcon, PhoneIcon, PhoneOffIcon, VolumeIcon } from '@youj/icons'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { SegmentedMeter } from '../../components/ui/segmented-meter'
import { Slider } from '../../components/ui/slider'
import { Toggle } from '../../components/ui/toggle'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components/ui/tooltip'
import { VoiceOrb, type VoiceOrbAudio, type VoiceOrbBands, type VoiceOrbState } from '../../components/ui/voice-orb'
import { useControllableState } from '../../hooks/use-controllable-state'
import { useVisible } from '../../hooks/use-visible'
import { cn, numberFormat } from '../../lib/utils'
import { AGENT, DEFAULT_COPY, SCRIPT, demo, type VoiceCallAgent, type VoiceCallCopy, type VoiceCallTurn } from './voice-call/data'
import { useSimulatedCall } from './voice-call/use-simulated-call'

/* A call with a voice agent, as a card: the agent's name and a live line of
 * what it's doing, the call's clock, the VoiceOrb, a caption line, and the
 * controls a call needs: mute (the orb grays and stops hearing), the speaker's
 * volume beside a meter of the voice's level, and End call in the danger
 * tone, which ends the call: the orb goes still, the clock stops and says how
 * long it lasted, and Call again takes its place. The card never changes size.
 * With no `agentState`, a demo conversation plays (a support call about a
 * double charge) and a Demo data badge says so. It is built for the compact
 * layout density (ui.css), taken from the page. Reduced motion: the orb holds
 * still and only its size follows the voice. */

interface VoiceCallProps extends Omit<ComponentProps<'section'>, 'children' | 'title' | 'onVolumeChange'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (384px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<VoiceCallCopy>
  /** Formats the clock (BCP 47). Default: the app's locale (YoujProvider). */
  locale?: string
  agent?: VoiceCallAgent
  /** What the agent is doing. While undefined, the demo conversation plays. */
  agentState?: VoiceOrbState
  /** The voice's loudness, 0–1: the person's while listening, the agent's while speaking. */
  level?: number
  bands?: VoiceOrbBands
  /** A source for the orb to analyze instead of `level`. */
  audio?: VoiceOrbAudio | null
  /** The caption line: what was just said. */
  caption?: string
  /** The demo's conversation, while `agentState` is undefined. */
  script?: VoiceCallTurn[]
  /** When the call started (epoch ms); the clock counts from it. Default: when the card mounted. */
  startedAt?: number
  muted?: boolean
  defaultMuted?: boolean
  onMutedChange?: (muted: boolean) => void
  /** The speaker's volume, 0–1. */
  volume?: number
  defaultVolume?: number
  onVolumeChange?: (volume: number) => void
  /** The call has ended (controlled). Default: the card's own, set by End call. */
  ended?: boolean
  /** Hangs up; the card shows the call ended once it resolves. Default: a short demo wait. */
  onHangUp?: () => Promise<unknown> | unknown
  /** Calls again; the card goes back to a live call once it resolves. Default: a short demo wait. */
  onCallAgain?: () => Promise<unknown> | unknown
  /** Show the Demo data badge while the demo plays. Default true. */
  demoMarker?: boolean
}

function VoiceCall({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  locale: localeProp,
  agent = AGENT,
  agentState,
  level,
  bands,
  audio,
  caption,
  script = SCRIPT,
  startedAt,
  muted: mutedProp,
  defaultMuted = false,
  onMutedChange,
  volume: volumeProp,
  defaultVolume = 0.8,
  onVolumeChange,
  ended: endedProp,
  onHangUp,
  onCallAgain,
  demoMarker = true,
  className,
  ...rest
}: VoiceCallProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const root = useRef<HTMLElement>(null)
  const visible = useVisible(root)
  const [muted, setMuted] = useControllableState(mutedProp, defaultMuted)
  const [volume, setVolume] = useControllableState(volumeProp, defaultVolume)
  const [ownEnded, setOwnEnded] = useState(false)
  const ended = endedProp ?? ownEnded
  const [busy, setBusy] = useState<'hangUp' | 'callAgain' | null>(null)

  const simulated = agentState === undefined
  const sim = useSimulatedCall(script, simulated && visible && !ended)
  const state: VoiceOrbState = ended ? 'idle' : simulated ? sim.state : agentState
  const voice = simulated ? sim.level : (level ?? 0)
  // The agent's voice comes out of the speaker, so its level follows the volume; yours doesn't, and muted it isn't heard.
  const deaf = muted && state === 'listening'
  const heard = deaf ? 0 : state === 'speaking' ? voice * volume : voice
  const said = deaf && simulated ? undefined : simulated ? sim.caption : caption

  // The clock: seconds since the call started, ticking while it's on screen and live.
  const start = useRef(startedAt)
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (start.current === undefined) start.current = Date.now()
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - (start.current ?? Date.now())) / 1000)))
    // Once now (an ended call shows how long it lasted), then every second while live.
    const first = setTimeout(tick, 0)
    const id = ended || !visible ? undefined : setInterval(tick, 1000)
    return () => {
      clearInterval(id)
      clearTimeout(first)
    }
  }, [ended, visible])
  const two = useMemo(() => numberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false }), [locale])
  const one = useMemo(() => numberFormat(locale, { useGrouping: false }), [locale])
  const clock = `${one.format(Math.floor(elapsed / 60))}:${two.format(elapsed % 60)}`

  const line = ended ? copy.ended : muted && state === 'listening' ? copy.muted : copy[state]

  const hangUp = async () => {
    setBusy('hangUp')
    try {
      await (onHangUp ? onHangUp() : demo('VoiceCall: onHangUp', 400))
      setOwnEnded(true)
    } finally {
      setBusy(null)
    }
  }
  const callAgain = async () => {
    setBusy('callAgain')
    try {
      await (onCallAgain ? onCallAgain() : demo('VoiceCall: onCallAgain', 900))
      start.current = Date.now()
      setElapsed(0)
      setOwnEnded(false)
    } finally {
      setBusy(null)
    }
  }
  const toggleMute = (next: boolean) => {
    setMuted(next)
    onMutedChange?.(next)
  }

  const card = (
    <Card className={cn('w-full text-fg', !embedded && !fill && 'max-w-96')}>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Title id={titleId}>{agent.name}</Title>
          {simulated && demoMarker && (
            <Badge variant="outline" data-slot="demo-marker" className="border-dashed border-line-strong">
              {copy.demoData}
            </Badge>
          )}
        </CardTitle>
        {agent.role && <CardDescription>{agent.role}</CardDescription>}
        <CardAction>
          <span role="timer" aria-label={copy.callTime} className={cn('font-mono text-ui-sm tabular-nums', ended ? 'text-fg-muted' : 'text-fg')}>
            {clock}
          </span>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col items-center gap-3">
        <VoiceOrb
          state={state}
          level={ended ? 0 : heard}
          bands={simulated ? sim.bands : bands}
          audio={ended ? null : audio}
          muted={muted || ended}
          size="lg"
          label={agent.name}
          // Calmer than the orb's own showcase: a size down and its colour softened, so the card's controls lead.
          className={cn('saturate-[.6] transition-opacity yj-duration-base ease-standard', ended && 'opacity-60')}
        />
        <p data-slot="voice-call-state" className="flex items-center gap-2 text-ui font-medium text-fg">
          <span aria-hidden className={cn('size-2 rounded-full', ended ? 'bg-fg-subtle' : muted ? 'bg-warning' : 'bg-success')} />
          {ended ? `${copy.ended} · ${copy.lasted(clock)}` : line}
        </p>
        <p role="status" aria-live="polite" aria-label={copy.captions} data-slot="voice-call-caption" className="line-clamp-2 min-h-10 max-w-80 text-center text-ui-sm text-pretty text-fg-muted">
          {ended ? '' : said}
        </p>
      </CardContent>

      <CardFooter className="min-h-control-lg box-content gap-3 py-4">
        {ended ? (
          <Button className="w-full" onClick={() => void callAgain()} disabled={busy !== null}>
            <PhoneIcon />
            {busy === 'callAgain' ? copy.calling : copy.callAgain}
          </Button>
        ) : (
          <>
            <Tooltip>
              <TooltipTrigger render={<Toggle variant="outline" size="lg" pressed={muted} onPressedChange={toggleMute} aria-label={copy.mute} />}>
                <MicIcon active={muted} />
              </TooltipTrigger>
              <TooltipContent>{muted ? copy.unmute : copy.mute}</TooltipContent>
            </Tooltip>
            <div role="group" aria-label={copy.volume} className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <VolumeIcon size={16} active={volume === 0} className="shrink-0 text-fg-muted" />
                <Slider
                  aria-label={copy.volume}
                  min={0}
                  max={100}
                  step={5}
                  value={Math.round(volume * 100)}
                  onValueChange={(next) => {
                    const v = (Array.isArray(next) ? next[0]! : next) / 100
                    setVolume(v)
                    onVolumeChange?.(v)
                  }}
                  getAriaValueText={(_, v) => copy.volumeValue(v)}
                  className="min-w-0 flex-1"
                />
              </div>
              <SegmentedMeter aria-label={copy.outputLevel} value={Math.round(heard * 100)} segments={16} tone="accent" showValue={false} className="ps-6" />
            </div>
            <Tooltip>
              <TooltipTrigger render={<Button variant="danger" size="icon-lg" aria-label={copy.hangUp} onClick={() => void hangUp()} disabled={busy !== null} />}>
                <PhoneOffIcon />
              </TooltipTrigger>
              <TooltipContent>{busy === 'hangUp' ? copy.ending : copy.hangUp}</TooltipContent>
            </Tooltip>
          </>
        )}
      </CardFooter>
    </Card>
  )

  const view = embedded ? (
    <section ref={root} aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-96', className)}>
      {card}
    </section>
  ) : (
    <main ref={root} aria-labelledby={titleId} {...rest} className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}>
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { VoiceCall, type VoiceCallAgent, type VoiceCallCopy, type VoiceCallProps, type VoiceCallTurn }
