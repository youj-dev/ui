'use client'

import { useEffect, useId, useRef, useState, type DragEvent, type KeyboardEvent, type ReactNode, type Ref } from 'react'
import { LONG_MS, type LabCue, type LabSound, type ProcessedSound } from '@youj/sound/lab'
import { CircleAlertIcon, PlayIcon, UploadIcon, XIcon } from '@youj/icons'
import { Badge, Button, Kbd, Label, RadioGroup, RadioGroupItem } from '@youj/react'
import { cn } from '@youj/core'
import { Waveform, type WaveformHandle } from './sound-viz'

/* One cue: what it's for, and its sounds as a radio group: the built-in
 * packs' candidates (the default first, all leveled to the cue's loudness) and a
 * file of your own, which can also be dropped on the row. Play any; pick one
 * and hear it. With focus in the row, 1–6 play, 0 plays the default and
 * Shift+1–6 picks. */

export interface Upload {
  name: string
  status: 'reading' | 'ready' | 'error'
  error?: string
  sound?: ProcessedSound
}

export const ACCEPT = 'audio/*,.wav,.mp3,.ogg,.oga,.m4a,.aac,.flac'

interface CueRowProps {
  entry: LabCue
  label: string
  plays: string
  /** The id picked: a candidate's, or `<cue>.file`. */
  picked: string
  onPick: (id: string) => void
  upload?: Upload
  onFile: (file: File) => void
  onRemoveFile: () => void
  /** The id sounding now, if it's in this row. */
  playing: string | undefined
  play: (id: string, ms: number) => void
  register: (id: string) => Ref<WaveformHandle>
}

const digit = (event: KeyboardEvent) => /^(?:Digit|Numpad)(\d)$/.exec(event.code)?.[1]
const hasFiles = (event: DragEvent) => [...event.dataTransfer.types].includes('Files')

export function CueRow({ entry, label, plays, picked, onPick, upload, onFile, onRemoveFile, playing, play, register }: CueRowProps) {
  const { cue, defaultId } = entry
  const variants = entry.variants
  const fileId = `${cue}.file`
  const ready = upload?.status === 'ready' ? upload.sound : undefined
  const options: { id: string; ms: number }[] = [...variants, ...(ready ? [{ id: fileId, ms: ready.ms }] : [])]
  const [dragging, setDragging] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const fileButton = useRef<HTMLButtonElement>(null)
  const addButton = useRef<HTMLButtonElement>(null)
  // The control that replaces the one that had focus: the file's play button once it's read, the add button once it's removed.
  const focusNext = useRef<'file' | 'add' | null>(null)
  useEffect(() => {
    if (!focusNext.current || upload?.status === 'reading') return
    if (ready && focusNext.current === 'file') fileButton.current?.focus()
    else if (!ready) addButton.current?.focus()
    focusNext.current = null
  }, [ready, upload?.status])
  const titleId = useId()
  const name = label.toLowerCase()

  const onKeyDown = (event: KeyboardEvent) => {
    const n = digit(event)
    if (n === undefined || event.metaKey || event.ctrlKey || event.altKey || event.repeat) return
    const option = n === '0' ? variants[0] : options[Number(n) - 1]
    if (!option) return
    event.preventDefault()
    if (event.shiftKey && n !== '0') onPick(option.id)
    else play(option.id, option.ms)
  }

  const choose = () => {
    focusNext.current = 'file'
    input.current?.click()
  }

  return (
    <section
      aria-labelledby={titleId}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onDragOver={(event) => {
        if (!hasFiles(event)) return
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false)
      }}
      onDrop={(event) => {
        if (!hasFiles(event)) return
        event.preventDefault()
        setDragging(false)
        const file = event.dataTransfer.files[0]
        if (file) onFile(file)
      }}
      data-dragging={dragging || undefined}
      className={cn(
        // A cue is a band of the page, not a card: its sounds are the cards, so nothing nests three deep.
        'relative flex scroll-mt-24 flex-col gap-3 border-t border-line pt-5 pb-1 outline-none data-dragging:rounded-xl',
        'transition-[background-color,box-shadow] yj-duration-fast ease-standard',
        'data-dragging:bg-accent-subtle data-dragging:shadow-[0_0_0_2px_var(--color-accent)]',
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 id={titleId} className="flex items-baseline gap-2 text-ui-lg font-semibold tracking-tight text-fg">
            {label}
            <code className="type-small font-normal text-fg-muted">{cue}</code>
          </h2>
          <p className="text-ui-sm text-fg-muted">{plays}</p>
        </div>
      </header>

      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onFile(file)
          event.target.value = ''
        }}
      />

      <RadioGroup
        aria-label={`Pick a ${name} sound`}
        value={picked}
        onValueChange={(value) => onPick(value as string)}
        className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
      >
        {variants.map((sound, index) => (
          <Candidate
            key={sound.id}
            title={sound.name}
            cue={name}
            shortcut={String(index + 1)}
            isDefault={sound.id === defaultId}
            picked={sound.id === picked}
            playing={sound.id === playing}
            value={sound.id}
            wave={sound.wave}
            play={() => play(sound.id, sound.ms)}
            waveform={register(sound.id)}
            meta={<Meta sound={sound} />}
          >
            <p className="px-0.5 text-ui-sm leading-snug text-fg-muted max-sm:line-clamp-2">{sound.recipe}</p>
          </Candidate>
        ))}
        {ready ? (
          <Candidate
            title={upload!.name}
            cue={name}
            shortcut={String(options.length)}
            picked={picked === fileId}
            playing={playing === fileId}
            value={fileId}
            wave={ready.wave}
            play={() => play(fileId, ready.ms)}
            waveform={register(fileId)}
            playRef={fileButton}
            meta={
              <span className="type-small whitespace-nowrap text-fg-muted">
                {ready.ms} ms · {ready.gain > 0 ? '+' : ''}
                {ready.gain} dB
              </span>
            }
            remove={
              <Button
                size="icon-xs"
                variant="ghost"
                sound={false}
                onClick={() => {
                  focusNext.current = 'add'
                  onRemoveFile()
                }}
                aria-label={`Remove your ${name} file`}
              >
                <XIcon size={14} />
              </Button>
            }
          >
            <FileReport sound={ready} trimmed={ready.trimmed} />
          </Candidate>
        ) : (
          <FileSlot label={name} upload={upload} onChoose={choose} buttonRef={addButton} />
        )}
      </RadioGroup>
    </section>
  )
}

function Meta({ sound }: { sound: LabSound }) {
  return (
    <span className="type-small whitespace-nowrap text-fg-muted">
      {sound.ms} ms · {(sound.bytes / 1024).toFixed(1)} KB
    </span>
  )
}

/** What was done to a file, and what to know about it. */
function FileReport({ sound, trimmed }: { sound: ProcessedSound; trimmed: number }) {
  const done = [sound.channels > 1 && 'mixed to mono', trimmed > 0 && `trimmed ${trimmed} ms of silence`, 'matched to the pack’s loudness'].filter(Boolean).join(', ')
  const notes = [
    sound.issues.includes('long') && `Long for an interface sound: keep it under ${LONG_MS} ms.`,
    sound.issues.includes('clipped') && 'The file clips, so it sounds distorted. Export it quieter.',
    sound.issues.includes('quiet') && 'It can’t reach the pack’s loudness without clipping, so it plays quieter.',
  ].filter((note): note is string => Boolean(note))
  return (
    <div className="flex flex-col gap-1.5 px-0.5">
      <p className="text-ui-sm leading-snug text-fg-muted">{`${done[0]!.toUpperCase()}${done.slice(1)}.`}</p>
      {notes.map((note) => (
        <p key={note} className="flex items-start gap-1.5 text-ui-sm leading-snug text-fg">
          <CircleAlertIcon size={14} className="mt-0.5 shrink-0 text-warning" aria-hidden />
          {note}
        </p>
      ))}
    </div>
  )
}

/** The fifth sound: a file of your own, not added yet, being read, or refused. */
function FileSlot({ label, upload, onChoose, buttonRef }: { label: string; upload?: Upload; onChoose: () => void; buttonRef: Ref<HTMLButtonElement> }) {
  const reading = upload?.status === 'reading'
  return (
    <div
      aria-busy={reading || undefined}
      className="flex min-h-36 min-w-0 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-surface p-3 text-center"
    >
      {upload?.status === 'error' ? (
        <p role="alert" className="flex items-start gap-1.5 text-start text-ui-sm leading-snug text-fg">
          <CircleAlertIcon size={14} className="mt-0.5 shrink-0 text-danger" aria-hidden />
          <span>
            <span className="font-medium">{upload.name}</span>: {upload.error}
          </span>
        </p>
      ) : (
        <p className="text-ui-sm text-fg-muted">{reading ? `Reading ${upload.name}…` : 'Your own file, or drop one on this cue'}</p>
      )}
      <Button ref={buttonRef} size="sm" variant="outline" sound={false} disabled={reading} onClick={onChoose} className="gap-1.5" aria-label={`${upload?.status === 'error' ? 'Try another' : 'Add a file'}: your own ${label} file`}>
        <UploadIcon size={14} />
        {upload?.status === 'error' ? 'Try another' : 'Add a file'}
      </Button>
      <p className="text-ui-xs text-fg-subtle">WAV, MP3, OGG or M4A</p>
    </div>
  )
}

interface CandidateProps {
  title: string
  /** The cue, in words, so each control has a name of its own: "Play Glass tap". */
  cue: string
  shortcut: string
  isDefault?: boolean
  picked: boolean
  playing: boolean
  value: string
  wave: number[]
  play: () => void
  waveform: Ref<WaveformHandle>
  playRef?: Ref<HTMLButtonElement>
  meta: ReactNode
  remove?: ReactNode
  children: ReactNode
}

function Candidate({ title, cue, shortcut, isDefault, picked, playing, value, wave, play, waveform, playRef, meta, remove, children }: CandidateProps) {
  return (
    <div
      data-picked={picked || undefined}
      className={cn(
        'flex min-w-0 flex-col gap-2.5 rounded-lg border border-line bg-surface p-2.5',
        'transition-[border-color,box-shadow] yj-duration-fast ease-standard',
        'data-picked:border-accent data-picked:shadow-[0_0_0_1px_var(--color-accent)]',
      )}
    >
      <div className="flex min-h-6 items-center justify-between gap-2 px-0.5">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-ui font-medium text-fg" title={title}>
            {title}
          </span>
          {isDefault && (
            <Badge variant="secondary" className="shrink-0">
              Default
            </Badge>
          )}
        </span>
        {remove ?? <Kbd aria-hidden className="pointer-coarse:hidden">{shortcut}</Kbd>}
      </div>

      <button
        ref={playRef}
        type="button"
        onClick={play}
        aria-label={`Play ${title} ${cue}`}
        data-playing={playing || undefined}
        className={cn(
          'group/play relative flex flex-col gap-1.5 rounded-md border border-transparent bg-canvas p-2 text-start',
          'transition-[background-color,border-color] yj-duration-fast ease-standard hover:bg-hover focus-ring',
          'data-playing:border-accent-line',
        )}
      >
        <Waveform ref={waveform} wave={wave} className="h-9 w-full" />
        <PlayIcon
          size={14}
          trigger="none"
          className="absolute end-2 top-2 text-fg-muted opacity-0 transition-opacity yj-duration-fast ease-standard group-hover/play:opacity-100 group-focus-visible/play:opacity-100"
        />
      </button>

      {children}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1 px-0.5">
        {meta}
        <Label className="gap-2 text-ui-sm font-normal">
          <RadioGroupItem value={value} aria-label={`Pick ${title} for ${cue}`} />
          Pick
        </Label>
      </div>
    </div>
  )
}
