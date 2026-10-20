'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { SoundCue } from '@youj/core'
import { cueInfo, encodeWav, labPacks } from '@youj/sound/lab'
import { DownloadIcon, InfoIcon, LinkIcon, PlayIcon, RotateCcwIcon, VolumeIcon } from '@youj/icons'
import { Button, CodeBlock, Kbd, Slider, ToggleGroup, ToggleGroupItem } from '@youj/react'
import { cn } from '@youj/core'
import { zip } from '../../lib/zip'
import { forgetFile, playClip, preloadClips, readFile, stopClip } from './builder-audio'
import { CueRow, type Upload } from './builder-row'
import { DEFAULTS, PACKS, PACK_PATH, lab, filePath, packFile, picksQuery, readPicks, readme, type Install, type Picks } from './builder-state'
import type { WaveformHandle } from './sound-viz'
import { copyToast } from '../../lib/copy-toast'

/* The Sound builder: every candidate for every cue, leveled to the cue's
 * loudness, and a file of your own for any of them. Pick one per cue (and
 * hear it), hear the whole set against the default, and take it home as a
 * definePack file, with a .zip that holds your files. Built-in picks live in
 * the page's link; files stay in this tab. Sound plays only when asked. */

const GAP = 380
type SoundSet = Record<string, string>

/** The built-in packs, the default first, each with what it plays for every cue. */
const PACK_SETS = labPacks.map(({ name, picks }, index) => ({ id: name, ...PACKS[name]!, isDefault: index === 0, set: picks as SoundSet }))

const msOf = new Map(lab.flatMap((entry) => entry.variants.map((sound) => [sound.id, sound.ms])))
const fileId = (cue: SoundCue) => `${cue}.file`

const noop = () => () => {}
/** This page's address without its query: empty on the server and while hydrating. */
const usePage = () =>
  useSyncExternalStore(
    noop,
    () => `${window.location.origin}${window.location.pathname}`,
    () => '',
  )

export function SoundBuilder() {
  const id = useId()
  const [picks, setPicks] = useState<Picks>(DEFAULTS)
  const [files, setFiles] = useState<Partial<Record<SoundCue, Upload>>>({})
  const [useFile, setUseFile] = useState<Partial<Record<SoundCue, boolean>>>({})
  const [volume, setVolume] = useState(0.5)
  const [playing, setPlaying] = useState<string>()
  const [sequence, setSequence] = useState<string>()
  const [install, setInstall] = useState<Install>('package')
  const [status, setStatus] = useState('')
  const handles = useRef(new Map<string, WaveformHandle>())
  const refs = useRef(new Map<string, (handle: WaveformHandle | null) => void>())
  const run = useRef(0)
  const volumeRef = useRef(volume)
  useEffect(() => {
    volumeRef.current = volume
  }, [volume])

  // The picks a link names, after hydration so server and client agree; the audio, decoded while nobody's listening yet.
  useEffect(() => {
    setPicks(readPicks(window.location.search))
    preloadClips().catch(() => {})
  }, [])

  // The link is the built-in picks: rewritten as they change, with no history entry.
  const query = picksQuery(picks)
  useEffect(() => {
    const search = picksQuery(picks, window.location.search)
    if (search !== window.location.search.slice(1)) window.history.replaceState(null, '', `${window.location.pathname}${search ? `?${search}` : ''}`)
  }, [picks])

  const chosen = useMemo(
    () => Object.fromEntries(lab.map(({ cue }) => [cue, useFile[cue] && files[cue]?.status === 'ready' ? fileId(cue) : picks[cue]])) as Record<SoundCue, string>,
    [picks, files, useFile],
  )
  const ownFiles = lab.map(({ cue }) => cue).filter((cue) => chosen[cue] === fileId(cue))
  const changed = lab.filter(({ cue, defaultId }) => chosen[cue] !== defaultId).length

  // One stable ref per sound, so its waveform registers once.
  const register = useCallback((sound: string) => {
    let ref = refs.current.get(sound)
    if (!ref) {
      ref = (handle) => {
        if (handle) handles.current.set(sound, handle)
        else handles.current.delete(sound)
      }
      refs.current.set(sound, ref)
    }
    return ref
  }, [])

  const play = useCallback((sound: string, ms: number) => {
    const token = ++run.current
    setSequence(undefined)
    setPlaying(sound)
    handles.current.get(sound)?.play(ms)
    playClip(sound, volumeRef.current).catch(() => {})
    setTimeout(() => run.current === token && setPlaying(undefined), ms + 120)
  }, [])

  const msOfSound = (sound: string) => msOf.get(sound) ?? files[sound.split('.')[0] as SoundCue]?.sound?.ms ?? 200

  /** Plays a set cue by cue; pressing it again, or playing anything else, stops it. */
  const hear = (name: string, set: SoundSet) => {
    if (sequence === name) {
      run.current++
      stopClip()
      setSequence(undefined)
      setPlaying(undefined)
      return
    }
    const token = ++run.current
    setSequence(name)
    const step = (i: number) => {
      if (run.current !== token) return
      const entry = lab[i]
      if (!entry) {
        setSequence(undefined)
        setPlaying(undefined)
        return
      }
      const sound = set[entry.cue]!
      const ms = msOfSound(sound)
      setPlaying(sound)
      handles.current.get(sound)?.play(ms)
      playClip(sound, volumeRef.current).catch(() => {})
      setTimeout(() => step(i + 1), ms + GAP)
    }
    step(0)
  }

  const pick = (cue: SoundCue, sound: string) => {
    if (sound === fileId(cue)) setUseFile((current) => ({ ...current, [cue]: true }))
    else {
      setUseFile((current) => ({ ...current, [cue]: false }))
      setPicks((current) => ({ ...current, [cue]: sound }))
    }
    play(sound, msOfSound(sound))
  }

  const addFile = (cue: SoundCue, file: File) => {
    const entry = lab.find((e) => e.cue === cue)!
    const label = cueInfo[cue].label
    setFiles((current) => ({ ...current, [cue]: { name: file.name, status: 'reading' } }))
    readFile(fileId(cue), file, entry).then(
      (sound) => {
        setFiles((current) => ({ ...current, [cue]: { name: file.name, status: 'ready', sound } }))
        setUseFile((current) => ({ ...current, [cue]: true }))
        setStatus(`${label} now plays ${file.name}, matched to the pack.${sound.issues.length ? ' It has a warning.' : ''}`)
      },
      (error: unknown) => {
        const message = error instanceof Error ? error.message : 'It couldn’t be read.'
        setFiles((current) => ({ ...current, [cue]: { name: file.name, status: 'error', error: message } }))
        setStatus(`${file.name} can’t be used for ${label}: ${message}`)
      },
    )
  }

  const removeFile = (cue: SoundCue) => {
    forgetFile(fileId(cue))
    setFiles(({ [cue]: _, ...rest }) => rest)
    setUseFile((current) => ({ ...current, [cue]: false }))
    setStatus(`${cueInfo[cue].label} plays ${lab.find((e) => e.cue === cue)!.variants.find((v) => v.id === picks[cue])?.name} again.`)
  }

  const reset = () => {
    setPicks(DEFAULTS)
    setUseFile({})
    setStatus('Every cue plays the default again. Your files are still here to pick.')
  }

  const page = usePage()
  const link = `${page}${query ? `?${query}` : ''}`
  const code = packFile({ picks, files: ownFiles, install, link })

  const copyLink = () =>
    navigator.clipboard.writeText(link).then(
      () => {
        setStatus('The link to your picks is on the clipboard.')
        copyToast('Link copied', 'To your picks.')
      },
      () => setStatus('Couldn’t copy the link. Copy it from the address bar.'),
    )

  const download = () => {
    try {
      const audio = ownFiles.map((cue) => ({ path: `public${filePath(cue)}`, content: encodeWav(files[cue]!.sound!.samples) }))
      const bytes = zip([{ path: PACK_PATH, content: code }, ...audio, { path: 'README.md', content: readme({ files: ownFiles, link }) }])
      const url = URL.createObjectURL(new Blob([bytes.buffer as ArrayBuffer], { type: 'application/zip' }))
      const a = Object.assign(document.createElement('a'), { href: url, download: 'youj-sounds.zip' })
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 0)
      setStatus('Saved youj-sounds.zip.')
    } catch {
      setStatus('The download failed. Try again.')
    }
  }

  const sets = [{ id: 'yours', name: 'Your pack', line: changed ? `${changed} of ${lab.length} cues changed.` : 'The default until you pick.', isDefault: false, set: chosen as SoundSet }, ...PACK_SETS]

  return (
    <div className="not-prose flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3 shadow-xs sm:p-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex min-w-56 flex-1 items-center gap-3">
            <VolumeIcon size={16} strokeWidth={1.75} className="shrink-0 text-fg-muted" aria-hidden />
            <Slider aria-label="Volume" value={volume * 100} onValueChange={(value) => setVolume((value as number) / 100)} className="max-w-56" />
            <span className="type-small w-9 text-end text-fg-muted">{Math.round(volume * 100)}%</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="type-small text-fg-muted">
              {changed ? `${changed} of ${lab.length} changed` : 'The default pack'}
            </span>
            <Button size="sm" variant="outline" sound={false} onClick={copyLink} className="gap-1.5">
              <LinkIcon size={14} strokeWidth={1.75} />
              Copy link
            </Button>
            <Button size="sm" variant="ghost" sound={false} disabled={changed === 0} onClick={reset} className="gap-1.5">
              <RotateCcwIcon size={14} strokeWidth={1.75} />
              Reset
            </Button>
          </div>
        </div>

        <div role="group" aria-labelledby={`${id}-sets`} className="flex flex-col gap-2 border-t border-line pt-3">
          <span id={`${id}-sets`} className="text-ui-sm text-fg-muted">
            Hear as a set
          </span>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
            {sets.map((set) => (
              <button
                key={set.id}
                type="button"
                aria-pressed={sequence === set.id}
                onClick={() => hear(set.id, set.set)}
                className={cn(
                  'flex min-w-0 items-start gap-2 rounded-lg border border-line bg-surface px-2.5 py-2 text-start transition-colors yj-duration-fast ease-standard hover:bg-hover focus-ring',
                  sequence === set.id && 'border-accent',
                )}
              >
                <PlayIcon size={12} active={sequence === set.id} className="mt-1 shrink-0 text-fg-muted" aria-hidden />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-ui-sm font-medium text-fg">
                    {set.name}
                    {set.isDefault && <span className="font-normal text-fg-subtle"> · default</span>}
                  </span>
                  <span className="text-ui-xs leading-snug text-fg-muted">{set.line}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 text-ui-sm text-fg-muted">
          <p>
            Every sound of a cue is leveled to the same loudness, so you compare character, not level.
            <span className="pointer-coarse:hidden">
              {' '}
              In a row, <Kbd>1</Kbd>–<Kbd>6</Kbd> play, <Kbd>0</Kbd> plays the default and <Kbd>⇧</Kbd>
              <Kbd>1</Kbd>–<Kbd>6</Kbd> picks.
            </span>
          </p>
          <p className="flex items-start gap-1.5">
            <InfoIcon size={14} className="mt-0.5 shrink-0" aria-hidden />
            Your picks are saved in this page’s link. Files you add stay in this tab: they’re never uploaded, and they’re gone when you leave, so download the .zip to keep them.
          </p>
        </div>
        <span role="status" className="sr-only">
          {status}
        </span>
      </div>

      {lab.map((entry) => (
        <CueRow
          key={entry.cue}
          entry={entry}
          label={cueInfo[entry.cue].label}
          plays={cueInfo[entry.cue].plays}
          picked={chosen[entry.cue]}
          onPick={(sound) => pick(entry.cue, sound)}
          upload={files[entry.cue]}
          onFile={(file) => addFile(entry.cue, file)}
          onRemoveFile={() => removeFile(entry.cue)}
          playing={playing?.startsWith(`${entry.cue}.`) ? playing : undefined}
          play={play}
          register={register}
        />
      ))}

      <section aria-labelledby={`${id}-export`} className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3 shadow-xs sm:p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h2 id={`${id}-export`} className="text-ui-lg font-semibold tracking-tight text-fg">
              Your pack
            </h2>
            <p className="text-ui-sm text-fg-muted">
              {changed
                ? `${changed} ${changed === 1 ? 'cue plays' : 'cues play'} your choice${ownFiles.length ? `, ${ownFiles.length} from ${ownFiles.length === 1 ? 'a file' : 'files'} of your own` : ''}; the rest play the Beacon pack.`
                : 'Every cue plays the default, the Beacon pack. Pick a sound above, or add a file, to make your own. For a built-in pack, pass it as is: <YoujProvider sound={halo}>.'}
            </p>
          </div>
          <ToggleGroup variant="segmented" size="sm" aria-label="Youj in your app" value={[install]} onValueChange={(value) => value[0] && setInstall(value[0] as Install)}>
            <ToggleGroupItem value="package">Package</ToggleGroupItem>
            <ToggleGroupItem value="source">Source</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <CodeBlock code={code} language="ts" filename={PACK_PATH} copyLabel="Copy the pack" sound={false} />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Button size="sm" sound={false} disabled={changed === 0} onClick={download} className="gap-1.5">
            <DownloadIcon size={14} strokeWidth={1.75} />
            Download .zip
          </Button>
          <p className="min-w-0 flex-1 text-ui-sm text-fg-muted">
            {ownFiles.length ? `The pack, your ${ownFiles.length === 1 ? 'file' : 'files'} as WAV for public/sounds/, and how to use them.` : 'The pack and how to use it.'} Then:{' '}
            <code className="code-inline">{'<YoujProvider sound={sounds}>'}</code>
          </p>
        </div>
      </section>
    </div>
  )
}
