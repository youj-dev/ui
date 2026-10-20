'use client'

import { useEffect, useRef, useState, type ComponentProps } from 'react'
import { m } from 'motion/react'
import { MotionFeatures, useSoundCue, type Size } from '@youj/core'
import { audioRecorderLabels, useComponentLabels } from '@youj/core/labels'
import { useLocale, useYouj } from '@youj/core/lib/youj/provider'
import { CheckIcon } from '@youj/icons/components/youj/icons/check'
import { MicIcon } from '@youj/icons/components/youj/icons/mic'
import { PlayIcon } from '@youj/icons/components/youj/icons/play'
import { TrashIcon } from '@youj/icons/components/youj/icons/trash'
import { UndoIcon } from '@youj/icons/components/youj/icons/undo'
import { useAnnouncer } from '../../../hooks/use-announcer'
import { createAudioMeter, type AudioMeter, type AudioReading } from '../../../hooks/use-audio-meter'
import { cn } from '../../../lib/utils'
import { AsyncButton } from '../async-button'
import { Button } from '../button'
import { formatTimecode, WaveformScrubber } from '../waveform-scrubber'
import { canRecord, decodeRecording, errorOf, microphone, pickMimeType, watchPermission, type AudioRecorderError } from './audio-recorder-media'
import { LiveWave, type LiveWaveHandle } from './audio-recorder-wave'

/* Record a voice note or an audio clip, listen back, then keep it or not.
 * - Idle: the record button and a caption (with the limit, if any). The
 *   first press asks for the microphone; a refusal, a missing device or a
 *   browser that can't record says so in the caption, with what to do.
 * - Recording: the sound scrolls past as bars from the microphone's level
 *   (the AnalyserNode it shares with VoiceOrb), a timer counts up,
 *   pause/resume and stop.
 *   With `maxDuration` a ring around stop runs down and the take stops at
 *   the limit.
 * - Recorded: the take on a WaveformScrubber, play/pause, its length,
 *   discard (with Undo for a few seconds) and Save, an AsyncButton that
 *   awaits `onRecordingComplete` (spinner, then a check and "Saved").
 * - Saved: read-only. Playback only, with a quiet "Saved" mark where the
 *   actions were; `saved={false}` gives the take back its actions. A take
 *   passed as `value` opens saved. Nothing ever plays by itself.
 * - One size in every state: the stage and the controls row never change
 *   height, whatever they hold.
 * - The primary button keeps its place and its focus through the states
 *   (record → stop → play), so Space records, stops and plays.
 * - MediaRecorder in the app's `mimeType` when the browser can, else WebM/Opus,
 *   MP4 or Ogg. Tracks, analyzer, recorder and object URLs are released on
 *   stop, discard and unmount.
 * - Motion: the bars slide with the sound; the recording dot breathes on the
 *   slow token. Reduced motion: a still level meter instead of the scrolling
 *   bars, and the dot holds still. Sound: toggleOn/toggleOff around a take,
 *   success (or error) as Save settles. Time runs left to right in every script; the controls
 *   follow the page. */

interface AudioRecordingInfo {
  /** In seconds. */
  duration: number
  /** The Blob's type, as recorded: "audio/webm;codecs=opus", "audio/mp4"… */
  mimeType: string
}

interface AudioRecorderProps extends Omit<ComponentProps<'div'>, 'children' | 'defaultValue' | 'onChange'> {
  /** Save: the take, its length and type. Awaited: a rejection keeps the take unsaved and shows the error on the button. */
  onRecordingComplete?: (blob: Blob, info: AudioRecordingInfo) => unknown | Promise<unknown>
  /** The longest take, in seconds: a ring counts down and recording stops there. */
  maxDuration?: number
  /** The container to record in, when the browser supports it; otherwise the first of WebM/Opus, MP4 and Ogg that it does. */
  mimeType?: string
  disabled?: boolean
  /** Default `default`. */
  size?: Extract<Size, 'sm' | 'default'>
  /** A recording to show, as a Blob or a URL: it opens on playback, saved. */
  value?: Blob | string | null
  /** Whether the take is saved, and so read-only (controlled). Default: true once Save succeeds or a `value` opens; `false` gives back discard and Save. */
  saved?: boolean
  /** When a discard is final: the Undo window closed, a new take started, or the recorder left. */
  onDiscard?: () => void
  /** Plays toggleOn and toggleOff around a take, and Save's success or error. Default true. */
  sound?: boolean
  /** Where the sound comes from. Default: the microphone through getUserMedia. */
  getStream?: () => Promise<MediaStream>
  /** The group's name. Default: the labels' "Audio recorder". */
  label?: string
  /** Formats the times. Default: the YoujProvider locale. */
  locale?: string
}

type Phase = 'idle' | 'requesting' | 'recording' | 'paused' | 'recorded'
type AudioRecorderState = Phase | 'saved'

interface Take {
  url: string
  blob: Blob | null
  duration: number
  peaks: number[]
  /** The app passed it (`value`). */
  given: boolean
  /** Saved through Save, or given: read-only unless the app says otherwise. */
  kept: boolean
}

interface Session {
  stream: MediaStream
  recorder: MediaRecorder
  meter: AudioMeter | null
  chunks: Blob[]
  samples: number[]
  /** Loudest level since the last sample. */
  peak: number
  /** When the current run started (performance.now), and the seconds recorded before it. */
  started: number
  before: number
  paused: boolean
  raf: number
  mimeType?: string
}

/** Seconds per sample of the level: twenty a second. */
const SAMPLE = 0.05
/** How long Undo stays after a discard. */
const UNDO_MS = 6000

const release = (s: Session) => {
  for (const track of s.stream.getTracks()) track.stop()
  s.meter?.dispose()
}

function AudioRecorder({
  onRecordingComplete,
  maxDuration,
  mimeType,
  disabled,
  size = 'default',
  value,
  saved: savedProp,
  onDiscard,
  sound = true,
  getStream,
  label,
  locale: localeProp,
  className,
  ...props
}: AudioRecorderProps) {
  const k = useYouj()
  const labels = useComponentLabels(audioRecorderLabels)
  const locale = useLocale(localeProp)
  const cue = useSoundCue()
  const { announce, announcer } = useAnnouncer()
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<AudioRecorderError | null>(null)
  const [take, setTake] = useState<Take | null>(null)
  const [discarded, setDiscarded] = useState<Take | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [position, setPosition] = useState(0)

  const session = useRef<Session | null>(null)
  const wave = useRef<LiveWaveHandle>(null)
  const ring = useRef<SVGCircleElement>(null)
  const primary = useRef<HTMLButtonElement>(null)
  const audio = useRef<HTMLAudioElement>(null)
  const alive = useRef(true)
  // Bumped whenever the take changes hands, so a late recorder or decoder result for an older one is dropped.
  const takeId = useRef(0)
  const undoTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const pendingDiscard = useRef<Take | null>(null)
  // Save succeeded and its check is showing; the take turns read-only when the button returns to rest.
  const savedRef = useRef(false)
  const latest = useRef({ maxDuration, onDiscard })
  useEffect(() => {
    latest.current = { maxDuration, onDiscard }
  })

  const time = (seconds: number) => formatTimecode(seconds, locale)
  const play = (name: Parameters<typeof cue>[0]) => sound && cue(name)

  const finishDiscard = () => {
    clearTimeout(undoTimer.current)
    const gone = pendingDiscard.current
    if (!gone) return
    pendingDiscard.current = null
    if (alive.current) setDiscarded(null)
    if (!gone.given || gone.blob) URL.revokeObjectURL(gone.url)
    latest.current.onDiscard?.()
  }

  const fail = (reason: AudioRecorderError) => {
    setError(reason)
    setPhase('idle')
    announce(errorText(reason))
    play('error')
  }

  const errorText = (reason: AudioRecorderError) =>
    ({ denied: labels.audioRecorderDenied, 'no-device': labels.audioRecorderNoDevice, unsupported: labels.audioRecorderUnsupported, failed: labels.audioRecorderFailed })[reason]

  const reading: AudioReading = { level: 0, low: 0, mid: 0, high: 0 }
  const tick = (now: number) => {
    const s = session.current
    if (!s || s.paused) return
    const t = s.before + (now - s.started) / 1000
    const max = latest.current.maxDuration
    reading.level = 0
    if (s.meter?.read(reading)) s.peak = Math.max(s.peak, reading.level)
    while (s.samples.length < Math.floor(t / SAMPLE)) {
      s.samples.push(s.peak)
      s.peak = 0
    }
    wave.current?.draw(s.samples, (t / SAMPLE) % 1, reading.level)
    if (max && ring.current) ring.current.style.strokeDashoffset = String(-Math.min(1, t / max))
    setElapsed(Math.floor(t))
    if (max && t >= max) return stop(true)
    s.raf = requestAnimationFrame(tick)
  }

  const start = async () => {
    if (disabled || session.current || phase === 'requesting') return
    finishDiscard()
    if (!canRecord() || (!getStream && !navigator.mediaDevices?.getUserMedia)) return fail('unsupported')
    setError(null)
    setPhase('requesting')
    let stream: MediaStream
    try {
      stream = await (getStream ?? microphone)()
    } catch (reason) {
      if (alive.current) fail(errorOf(reason))
      return
    }
    if (!alive.current) {
      for (const track of stream.getTracks()) track.stop()
      return
    }
    if (!stream.getAudioTracks().length) return fail('no-device')
    const type = pickMimeType(mimeType)
    let recorder: MediaRecorder
    try {
      recorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined)
    } catch {
      try {
        recorder = new MediaRecorder(stream)
      } catch {
        for (const track of stream.getTracks()) track.stop()
        return fail('failed')
      }
    }
    const s: Session = { stream, recorder, meter: null, chunks: [], samples: [], peak: 0, started: performance.now(), before: 0, paused: false, raf: 0, mimeType: type }
    recorder.ondataavailable = (e) => {
      if (e.data.size) s.chunks.push(e.data)
    }
    recorder.start(1000)
    s.meter = createAudioMeter(stream)
    session.current = s
    takeId.current++
    setElapsed(0)
    setPhase('recording')
    announce(labels.audioRecorderRecording)
    play('toggleOn')
    s.raf = requestAnimationFrame(tick)
  }

  const stop = (limit = false) => {
    const s = session.current
    if (!s) return
    session.current = null
    cancelAnimationFrame(s.raf)
    const run = s.paused ? 0 : (performance.now() - s.started) / 1000
    const max = latest.current.maxDuration
    const duration = max ? Math.min(max, s.before + run) : s.before + run
    if (s.peak > 0) s.samples.push(s.peak)
    const id = ++takeId.current
    // The take shows at once; its Blob follows when the recorder flushes.
    setTake({ url: '', blob: null, duration, peaks: s.samples, given: false, kept: false })
    s.recorder.onstop = () => {
      if (!alive.current || id !== takeId.current) return
      const blob = new Blob(s.chunks, { type: s.recorder.mimeType || s.mimeType || 'audio/webm' })
      setTake((current) => (current ? { ...current, blob, url: URL.createObjectURL(blob) } : current))
    }
    if (s.recorder.state !== 'inactive') s.recorder.stop()
    release(s)
    setPosition(0)
    setPhase('recorded')
    const said = labels.audioRecorderStopped(time(duration))
    announce(limit ? `${labels.audioRecorderLimitReached}. ${said}` : said)
    play('toggleOff')
  }

  const pause = () => {
    const s = session.current
    if (!s || s.paused) return
    cancelAnimationFrame(s.raf)
    if (s.recorder.state === 'recording') s.recorder.pause()
    s.before += (performance.now() - s.started) / 1000
    s.paused = true
    wave.current?.draw(s.samples, 0, 0)
    setPhase('paused')
    announce(labels.audioRecorderPaused)
  }

  const resume = () => {
    const s = session.current
    if (!s || !s.paused) return
    if (s.recorder.state === 'paused') s.recorder.resume()
    s.started = performance.now()
    s.paused = false
    setPhase('recording')
    announce(labels.audioRecorderRecording)
    s.raf = requestAnimationFrame(tick)
  }

  const togglePlayback = () => {
    const el = audio.current
    if (!el || !take?.url) return
    if (el.paused) void el.play().catch(() => setPlaying(false))
    else el.pause()
  }

  const seek = (seconds: number) => {
    setPosition(seconds)
    if (audio.current) audio.current.currentTime = seconds
  }

  const discard = () => {
    if (!take) return
    audio.current?.pause()
    takeId.current++
    pendingDiscard.current = take
    setDiscarded(take)
    setTake(null)
    setPlaying(false)
    setPosition(0)
    setPhase('idle')
    announce(labels.audioRecorderDiscarded)
    play('toggleOff')
    clearTimeout(undoTimer.current)
    undoTimer.current = setTimeout(finishDiscard, UNDO_MS)
    requestAnimationFrame(() => primary.current?.focus())
  }

  const undo = () => {
    const back = pendingDiscard.current
    if (!back) return
    clearTimeout(undoTimer.current)
    pendingDiscard.current = null
    takeId.current++
    setDiscarded(null)
    setTake(back)
    setPhase('recorded')
    announce(labels.audioRecorderRestored)
    requestAnimationFrame(() => primary.current?.focus())
  }

  const save = async () => {
    if (!take?.blob) return
    await onRecordingComplete?.(take.blob, { duration: take.duration, mimeType: take.blob.type })
  }

  // A recording the app passes opens on playback once it's measured.
  useEffect(() => {
    if (!value || session.current) return
    const controller = new AbortController()
    const id = ++takeId.current
    void decodeRecording(value, controller.signal).then((decoded) => {
      if (controller.signal.aborted || id !== takeId.current) return
      const blob = decoded?.blob ?? (typeof value === 'string' ? null : value)
      setTake({ url: blob ? URL.createObjectURL(blob) : (value as string), blob, duration: decoded?.duration ?? 0, peaks: decoded?.peaks ?? [], given: true, kept: true })
      setPosition(0)
      setPhase('recorded')
    })
    return () => controller.abort()
  }, [value])

  // Object URLs we made are released with their take (unless it waits in the Undo window).
  useEffect(() => {
    if (!take?.url || (take.given && !take.blob)) return
    return () => {
      if (pendingDiscard.current?.url !== take.url) URL.revokeObjectURL(take.url)
    }
  }, [take?.url, take?.given, take?.blob])

  // A permission refused earlier shows before the first press, where the browser says so.
  const askOwnMic = !getStream
  useEffect(() => {
    if (!askOwnMic) return
    return watchPermission((denied) => setError((e) => (denied ? 'denied' : e === 'denied' ? null : e)))
  }, [askOwnMic])

  // The playhead follows playback every frame.
  useEffect(() => {
    if (!playing) return
    let raf = 0
    const follow = () => {
      if (audio.current) setPosition(audio.current.currentTime)
      raf = requestAnimationFrame(follow)
    }
    raf = requestAnimationFrame(follow)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once; finishDiscard reads refs only
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      const s = session.current
      if (s) {
        session.current = null
        cancelAnimationFrame(s.raf)
        s.recorder.ondataavailable = null
        s.recorder.onstop = null
        if (s.recorder.state !== 'inactive') s.recorder.stop()
        release(s)
      }
      finishDiscard()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once; finishDiscard reads refs only
  }, [])

  const live = phase === 'recording' || phase === 'paused'
  const saved = phase === 'recorded' && !!take && (savedProp ?? take.kept)
  const state: AudioRecorderState = saved ? 'saved' : phase
  const sm = size === 'sm'
  const shown = take?.duration ?? 0
  const primaryLabel = phase === 'recorded' ? (playing ? labels.pause : labels.play) : live ? labels.audioRecorderStop : labels.audioRecorderStart
  const onPrimary = phase === 'recorded' ? togglePlayback : live ? () => stop() : () => void start()

  const caption = error ? (
    <span data-slot="audio-recorder-error" className="own:text-danger-text">
      {errorText(error)}
    </span>
  ) : phase === 'requesting' ? (
    labels.audioRecorderRequesting
  ) : discarded ? (
    <span className="own:flex items-center gap-2">
      {labels.audioRecorderDiscarded}
      <Button variant="link" size={sm ? 'xs' : 'sm'} className="own:px-1" onClick={undo}>
        <UndoIcon className="rtl:-scale-x-100" />
        {labels.undo}
      </Button>
    </span>
  ) : (
    <span>
      {labels.audioRecorderHint}
      {maxDuration ? <span className="own:text-fg-subtle"> · {labels.audioRecorderLimit(time(maxDuration))}</span> : null}
    </span>
  )

  return (
    <div
      role="group"
      aria-label={label ?? labels.audioRecorder}
      data-slot="audio-recorder"
      data-state={state}
      data-size={size}
      data-disabled={disabled || undefined}
      className={cn(
        'own:flex w-full max-w-md flex-col own:rounded-xl own:border own:border-line own:bg-surface own:text-fg',
        sm ? 'own:gap-1 own:p-2 own:text-ui-sm' : 'own:gap-2 own:p-3 own:text-ui',
        className,
      )}
      {...props}
    >
      <div data-slot="audio-recorder-stage" className="own:flex h-23 items-center own:px-1">
        {take ? (
          <WaveformScrubber
            peaks={take.peaks}
            duration={Math.max(shown, 0.1)}
            value={position}
            onValueChange={seek}
            step={shown < 60 ? 1 : 5}
            disabled={disabled || !take.url}
            locale={locale}
            sound={sound}
          />
        ) : (
          <LiveWave ref={wave} reduced={k.reduced} tone={phase === 'recording' ? 'live' : phase === 'paused' ? 'paused' : 'idle'} />
        )}
      </div>

      <div data-slot="audio-recorder-controls" className={cn('own:flex items-center gap-2', sm ? 'h-control-sm' : 'h-control')}>
        <span className="relative own:flex shrink-0 items-center justify-center">
          <Button
            ref={primary}
            size={sm ? 'icon-sm' : 'icon'}
            variant={phase === 'recorded' ? 'outline' : live ? 'outline' : 'default'}
            // shape: a record button is round by convention, in every theme; the countdown ring hugs it
            className="own:rounded-full"
            aria-label={primaryLabel}
            aria-busy={phase === 'requesting' || undefined}
            data-slot="audio-recorder-primary"
            disabled={disabled || (phase === 'recorded' && !take?.url)}
            onClick={onPrimary}
          >
            {phase === 'recorded' ? <PlayIcon active={playing} className="fill-current" /> : live ? <span aria-hidden className="size-3 rounded-xs bg-danger" /> : <MicIcon />}
          </Button>
          {live && maxDuration ? (
            <svg aria-hidden data-slot="audio-recorder-ring" viewBox="0 0 40 40" className="pointer-events-none absolute -inset-1 -rotate-90">
              <circle cx="20" cy="20" r="19" fill="none" className="stroke-line" strokeWidth="1.5" />
              <circle
                ref={ring}
                cx="20"
                cy="20"
                r="19"
                fill="none"
                pathLength={1}
                strokeDasharray="1"
                className={maxDuration - elapsed <= 10 ? 'stroke-danger' : 'stroke-accent'}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          ) : null}
        </span>

        {live ? (
          <>
            <MotionFeatures>
              <m.span
                aria-hidden
                data-slot="audio-recorder-dot"
                className={cn('size-2 shrink-0 own:rounded-full', phase === 'recording' ? 'own:bg-danger' : 'own:bg-fg-subtle')}
                animate={phase === 'recording' && !k.reduced ? { opacity: [1, 0.35] } : { opacity: 1 }}
                transition={phase === 'recording' && !k.reduced ? { ...k.tween('slow', 'standard'), repeat: Infinity, repeatType: 'reverse' } : k.tween('fast')}
              />
            </MotionFeatures>
            <span role="timer" aria-label={labels.audioRecorderElapsed} data-slot="audio-recorder-timer" className="own:font-medium own:tabular-nums">
              {time(elapsed)}
            </span>
            {maxDuration ? (
              <span data-slot="audio-recorder-remaining" className="own:text-fg-muted own:tabular-nums">
                {labels.audioRecorderRemaining(time(Math.max(0, maxDuration - elapsed)))}
              </span>
            ) : null}
            <span className="flex-1" />
            <Button
              variant="ghost"
              size={sm ? 'icon-sm' : 'icon'}
              aria-label={phase === 'paused' ? labels.audioRecorderResume : labels.audioRecorderPause}
              data-slot="audio-recorder-pause"
              disabled={disabled}
              onClick={phase === 'paused' ? resume : pause}
            >
              <PlayIcon active={phase === 'recording'} className="fill-current" />
            </Button>
          </>
        ) : phase === 'recorded' && take ? (
          <>
            <span data-slot="audio-recorder-time" className="own:text-fg-muted own:tabular-nums">
              <span className="own:text-fg">{time(position)}</span> / {time(shown)}
            </span>
            <span className="flex-1" />
            {saved ? null : (
              <Button variant="ghost" size={sm ? 'icon-sm' : 'icon'} aria-label={labels.audioRecorderDiscard} data-slot="audio-recorder-discard" disabled={disabled} onClick={discard}>
                <TrashIcon />
              </Button>
            )}
            {saved ? (
              <span data-slot="audio-recorder-saved" className="own:flex items-center gap-1.5 own:pe-1 own:text-success-text">
                <CheckIcon className="size-4" />
                {labels.audioRecorderSaved}
              </span>
            ) : (
              <AsyncButton
                size={sm ? 'sm' : 'default'}
                data-slot="audio-recorder-save"
                disabled={disabled || !take.blob}
                sound={sound}
                pendingLabel={labels.audioRecorderSaving}
                successLabel={labels.audioRecorderSaved}
                onAction={save}
                // The take turns read-only once the check has shown, so the button's success plays out first.
                onActionStateChange={(next) => {
                  if (next === 'success') savedRef.current = true
                  else if (next === 'idle' && savedRef.current) {
                    savedRef.current = false
                    // The button leaves; its focus goes to play.
                    if (document.activeElement?.closest('[data-slot=audio-recorder-save]')) requestAnimationFrame(() => primary.current?.focus())
                    setTake((current) => (current ? { ...current, kept: true } : current))
                  }
                }}
              >
                <CheckIcon />
                {labels.audioRecorderSave}
              </AsyncButton>
            )}
          </>
        ) : (
          <span data-slot="audio-recorder-caption" className="min-w-0 flex-1 own:text-fg-muted">
            {caption}
          </span>
        )}
      </div>

      {take?.url ? (
        <audio
          ref={audio}
          src={take.url}
          preload="metadata"
          hidden
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false)
            setPosition(0)
          }}
          onLoadedMetadata={(e) => {
            const d = e.currentTarget.duration
            if (take.duration === 0 && Number.isFinite(d)) setTake({ ...take, duration: d })
          }}
        />
      ) : null}
      {announcer}
    </div>
  )
}

export { AudioRecorder, type AudioRecorderError, type AudioRecorderProps, type AudioRecordingInfo }
