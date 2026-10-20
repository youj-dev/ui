'use client'

import { useId, useState, type HTMLAttributes } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { ActivityIcon, AudioLinesIcon, CpuIcon, RepeatIcon, TimerIcon } from '@youj/icons'
import { AppPage } from '../../components/ui/app-page'
import { Capsule, CapsuleLabel } from '../../components/ui/capsule'
import { CapsulePlayer } from '../../components/ui/capsule-player'
import { CapsuleSearch } from '../../components/ui/capsule-search'
import { CapsuleStepper } from '../../components/ui/capsule-stepper'
import { CapsuleToggle } from '../../components/ui/capsule-toggle'
import { StatPill } from '../../components/ui/stat-pill'
import { Toggle } from '../../components/ui/toggle'
import { useAnnouncer } from '../../hooks/use-announcer'
import { Arrangement } from './music-studio/arrangement'
import { DEFAULT_COPY, SESSION, type Session, type MusicStudioCopy } from './music-studio/data'
import { useTransport } from './music-studio/use-transport'
import { cn } from '../../lib/utils'

/* A music session with its controls floating over the song, so the
 * arrangement keeps the whole screen. The top edge holds the session in a
 * capsule, a CapsuleSearch that finds clips (`/` from anywhere; the rest dim)
 * and the engine's vitals as StatPills: DSP load with its trend, the buffer's
 * latency, and the section's loudness against the last one. The dock at the
 * foot is the transport: a CapsulePlayer that names the section playing and
 * skips between sections, the tempo on a CapsuleStepper (the playhead keeps
 * its bar as the clock speeds up), the grid's snap on a CapsuleToggle, and
 * loop and click as toggles in a capsule. Everything is wired: the playhead
 * crosses the lanes, the section's name rolls in the player as it changes,
 * and the ruler lights the section. The transport is simulated
 * (`useTransport`); swap it for your engine. On a phone the lanes scroll
 * sideways and the dock wraps. Reduced motion: values and names change in
 * place.
 * It is built for the compact layout density (ui.css), taken from the page. */

interface MusicStudioProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** A page in your app's frame: the shared page header (AppPage) titled with the session, its search and vitals as the header's actions, the arrangement across the whole width and the transport docked at the foot; no capsule or `main` of its own. Default true; `false` draws its own page (the session capsule and search over the viewport). */
  embedded?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<MusicStudioCopy>
  /** Formats numbers and dates (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  session?: Session
  /** Where the playhead starts, in beats. Default: two bars into the drop. */
  start?: number
  /** Starts playing on mount. Default false. */
  autoPlay?: boolean
}

function MusicStudio({ theme, embedded = true, copy: copyProp, locale, session = SESSION, start = 18 * 4, autoPlay = false, className, ...rest }: MusicStudioProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const arrangementId = useId()
  const transport = useTransport(session, start)
  const [snap, setSnap] = useState(copy.snaps[1]?.value ?? '8')
  const [click, setClick] = useState(true)
  const [query, setQuery] = useState('')
  const { announce, announcer } = useAnnouncer()
  const section = session.sections[transport.section]!
  const previous = session.sections[Math.max(0, transport.section - 1)]!

  // DSP load follows how many clips are sounding, read once a beat.
  const sounding = session.lanes.filter((lane) => lane.clips.some((c) => transport.bar >= c.from && transport.bar <= c.to)).length
  const beat = Math.floor(transport.beat)
  const load = (clips: number, at: number) => 16 + clips * 6 + ((at * 5) % 7)
  const [dsp, setDsp] = useState<number[]>(() => [...Array.from({ length: 8 }, (_, i) => 24 + ((i * 7) % 11)), load(sounding, beat)])
  const [dspAt, setDspAt] = useState({ beat, sounding })
  if (dspAt.beat !== beat || dspAt.sounding !== sounding) {
    setDspAt({ beat, sounding })
    setDsp((d) => [...d.slice(-9), load(sounding, beat)])
  }

  const [autoStarted, setAutoStarted] = useState(false)
  if (autoPlay && !autoStarted) {
    setAutoStarted(true)
    transport.setPlaying(true)
  }

  const search = (next: string) => {
    setQuery(next)
    const q = next.trim().toLowerCase()
    if (!q) return
    const count = session.lanes.reduce((n, lane) => n + lane.clips.filter((c) => c.name.toLowerCase().includes(q) || lane.name.toLowerCase().includes(q)).length, 0)
    announce(count ? copy.matches(count, next.trim()) : copy.noMatch(next.trim()))
  }

  const searchBox = (
    <CapsuleSearch shortcut="/" placeholder={copy.search} aria-label={copy.search} value={query} onValueChange={search} />
  )
  const vitals = (
    <>
      <StatPill label={copy.dsp} icon={<CpuIcon />} value={dsp[dsp.length - 1]!} unit="%" trend={dsp} locale={copy.locale} />
      <StatPill label={copy.latency} icon={<ActivityIcon />} value={5.3} format={{ maximumFractionDigits: 1 }} unit="ms" locale={copy.locale} className="max-sm:hidden" />
      <StatPill
        label={copy.loudness}
        icon={<AudioLinesIcon />}
        value={section.loudness}
        format={{ maximumFractionDigits: 1 }}
        unit="LUFS"
        delta={transport.section ? Math.round((section.loudness - previous.loudness) * 10) / 10 : undefined}
        better="none"
        locale={copy.locale}
        className="max-md:hidden"
      />
    </>
  )
  const arrangement = (
    <Arrangement
      session={session}
      beat={transport.beat}
      section={transport.section}
      snap={Number(snap)}
      query={query}
      copy={copy}
      Heading="h2"
      headingId={arrangementId}
    />
  )
  // The dock floats over the lanes at the foot of the screen.
  const dock = (
    <div role="group" aria-label={copy.transport} className="pointer-events-none sticky bottom-0 mt-auto flex flex-wrap items-center justify-center gap-2 p-4 *:pointer-events-auto">
      <CapsulePlayer
        title={section.name}
        subtitle={`${session.title} · ${copy.bar(transport.bar)}`}
        artwork={<span className="block size-full" style={{ background: 'conic-gradient(from 30deg, var(--color-chart-1), var(--color-chart-4), var(--color-chart-2), var(--color-chart-1))' }} />}
        playing={transport.playing}
        onPlayingChange={transport.setPlaying}
        position={transport.position}
        duration={transport.duration}
        onSeek={transport.seekSeconds}
        onPrevious={transport.previous}
        onNext={transport.next}
        locale={copy.locale}
        className="max-w-96 shadow-md"
      />
      <CapsuleStepper label={copy.tempo} value={transport.tempo} onValueChange={(v) => v !== null && transport.setTempo(v)} min={60} max={200} unit="BPM" className="shadow-md" />
      <CapsuleToggle label={copy.snap} value={snap} onValueChange={setSnap} options={copy.snaps} className="shadow-md" />
      <Capsule data-slot="studio-toggles" className="shadow-md">
        <Toggle size="default" aria-label={copy.loop} pressed={transport.loop} onPressedChange={transport.setLoop} className="aspect-square p-0">
          <RepeatIcon size={16} />
        </Toggle>
        <Toggle size="default" aria-label={copy.click} pressed={click} onPressedChange={setClick} className="aspect-square p-0">
          <TimerIcon size={16} />
        </Toggle>
        <CapsuleLabel aria-hidden className="max-sm:hidden">{`${session.meter}/4`}</CapsuleLabel>
      </Capsule>
    </div>
  )

  const page = embedded ? (
    <AppPage
      {...rest}
      title={session.title}
      description={session.artist}
      actions={
        <>
          {searchBox}
          {vitals}
        </>
      }
      width="fill"
      className={cn('text-fg', className)}
      classNames={{ body: 'min-h-[calc(100dvh-(--spacing(16)))]' }}
    >
      <section aria-labelledby={arrangementId} className="min-h-0 flex-1 pb-36 sm:pb-28">
        {arrangement}
      </section>
      {dock}
      {announcer}
    </AppPage>
  ) : (
    <main aria-labelledby={titleId} {...rest} className={cn('bg-canvas text-fg', className)}>
      <div className="relative flex min-h-dvh flex-col">
        <header className="flex flex-wrap items-center gap-2 p-4">
          <Capsule data-slot="studio-session" className="gap-2.5 ps-1 pe-4">
            <span
              aria-hidden
              className="aspect-square h-full shrink-0 rounded-xl"
              style={{ background: 'conic-gradient(from 210deg, var(--color-chart-5), var(--color-chart-3), var(--color-chart-2), var(--color-chart-5))' }}
            />
            <span className="flex min-w-0 flex-col leading-tight">
              <h1 id={titleId} className="truncate text-ui font-semibold text-fg">
                {session.title}
              </h1>
              <span className="truncate text-ui-xs text-fg-muted">{session.artist}</span>
            </span>
          </Capsule>
          {searchBox}
          <div className="flex flex-wrap items-center gap-2 lg:ms-auto">{vitals}</div>
        </header>
        <section aria-labelledby={arrangementId} className="min-h-0 flex-1 px-4 pt-2 pb-36 sm:pb-28">
          {arrangement}
        </section>
        {dock}
        {announcer}
      </div>
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{page}</ThemeScope> : page
}

export { MusicStudio, type MusicStudioProps }
