'use client'

import { useId, useLayoutEffect, useRef, useState, type ClipboardEvent, type HTMLAttributes } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { AsyncButton } from '../../components/ui/async-button'
import { Button } from '../../components/ui/button'
import { Spinner } from '../../components/ui/spinner'
import { useLiveRegion } from '../../hooks/use-announcer'
import { cn } from '../../lib/utils'
import { AltText } from './image-editor/alt-text'
import { Controls } from './image-editor/controls'
import {
  DEFAULT_COPY,
  demo,
  VARIANTS,
  type ImageEditorAspect,
  type ImageEditorCopy,
  type ImageEditorEdit,
  type ImageEditorPoint,
  type ImageEditorPreview,
  type ImageEditorResult,
  type ImageEditorVariant,
} from './image-editor/data'
import { Empty } from './image-editor/empty'
import { aspectOf, clamp, clampCenter, coverScale, fitFrame, outputSize, place, splitRotation, type Size } from './image-editor/geometry'
import { Previews } from './image-editor/previews'
import { framed, normalized } from './image-editor/save'
import { Stage } from './image-editor/stage'
import { useLive } from './image-editor/use-live'
import { useSource } from './image-editor/use-source'

/* An image field that shows exactly how the picture will look everywhere it
 * appears. The photo moves under a fixed frame: drag it, pinch or scroll to
 * zoom, turn it a quarter, straighten it by the degree, flip it, choose a
 * crop; at any angle it always covers the frame. A focal point marks what
 * matters, and the previews beside it are the real framing at each size the
 * image is shown (a card, a story, a banner; a cover's desktop and phone
 * headers; an avatar's profile, comment and mention), live, cropped around
 * the focal point as far as the edges allow. Alt text sits under it. Save
 * draws the result on a canvas and hands over the file with the region in
 * the source's pixels, the focal point and the edit to reopen it. Shapes:
 * `image`, `cover` (3:1) and `avatar` (round). Drop, paste or browse to
 * start or replace; the rules explain a refusal. Every gesture has keys.
 * Reduced motion: changes land at once. */

interface ImageEditorProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'onPaste'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** A panel inside another page: an `h2`, and no page around it. Default true; `false` draws its own page (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (896px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<ImageEditorCopy>
  /** Writes its numbers in this locale (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** `image` (crops to choose), `cover` (a 3:1 header) or `avatar` (round). Default `image`. */
  variant?: ImageEditorVariant
  /** The image to edit; `null` starts empty. Default: a demo photo. */
  src?: string | null
  /** For a `src` on another origin that allows it, so Save can draw it. */
  crossOrigin?: 'anonymous' | 'use-credentials'
  /** The crops to choose from. Default: the shape's (Original, Square, 4:5, 16:9 for an image). */
  aspects?: ImageEditorAspect[]
  /** Where the image appears, previewed live. Default: the shape's. */
  previews?: ImageEditorPreview[]
  /** An edit to reopen, as `onSave` gave it. Default: none (the demo photo comes with one). */
  defaultEdit?: Partial<ImageEditorEdit>
  /** Every committed change to the edit (on release, not every frame of a drag). */
  onEditChange?: (edit: ImageEditorEdit) => void
  /** Saves the framed image: the file, its region in the source, the focal point and alt text. Default: a demo wait. */
  onSave?: (result: ImageEditorResult) => Promise<unknown> | unknown
  /** Removes the image (from your storage); awaited. Without it, Remove only empties the field. */
  onRemove?: () => Promise<unknown> | unknown
  /** A new image was chosen (dropped, pasted or picked), before it's edited: to upload the original, say. */
  onFileChange?: (file: File) => void
  /** The images it takes, as an input's `accept`. Default JPG, PNG, WebP and AVIF. */
  accept?: string
  /** The largest file, in bytes. Default 20 MB. */
  maxSize?: number
  /** The smallest image, in pixels. Default: the shape's (a cover 1200 × 400, an avatar 256 × 256). */
  minDimensions?: { width: number; height: number }
  /** The saved file's type. Default JPEG. */
  outputType?: 'image/jpeg' | 'image/webp' | 'image/png'
  /** The saved file's quality, 0–1, for JPEG and WebP. Default 0.9. */
  outputQuality?: number
  /** The saved image's longest edge, in pixels. Default: the shape's (2400, a cover 3000, an avatar 512). */
  maxOutput?: number
}

const MB = 1024 * 1024
const PAD = 28
const FORMAT: Record<string, string> = { 'image/jpeg': 'JPG', 'image/webp': 'WebP', 'image/png': 'PNG' }

/** The edit a fresh image starts with. */
const fresh = (aspect: string): ImageEditorEdit => ({
  aspect,
  rotation: 0,
  flipX: false,
  flipY: false,
  zoom: 1,
  center: { x: 0.5, y: 0.5 },
  focal: { x: 0.5, y: 0.5 },
  alt: '',
})

function ImageEditor({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  locale,
  variant = 'image',
  src: srcProp,
  crossOrigin,
  aspects: aspectsProp,
  previews: previewsProp,
  defaultEdit,
  onEditChange,
  onSave,
  onRemove,
  onFileChange,
  accept = 'image/jpeg,image/png,image/webp,image/avif',
  maxSize = 20 * MB,
  minDimensions: minProp,
  outputType = 'image/jpeg',
  outputQuality = 0.9,
  maxOutput: maxProp,
  className,
  ...rest
}: ImageEditorProps) {
  const copy: ImageEditorCopy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const shape = VARIANTS[variant]
  const aspects = aspectsProp ?? shape.aspects
  const previews = previewsProp ?? shape.previews
  const minDimensions = minProp ?? shape.minDimensions
  const round = variant === 'avatar'
  const titleId = useId()
  const errorId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const { politeRef, announce } = useLiveRegion()
  const input = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [edit, setEdit] = useState<ImageEditorEdit>(() => ({
    ...fresh(aspects[0]?.id ?? 'original'),
    ...(srcProp === undefined ? shape.edit : null),
    ...defaultEdit,
  }))
  const source = useSource({
    initial: srcProp === undefined ? shape.src : srcProp,
    crossOrigin,
    accept,
    maxSize,
    minDimensions,
    copy,
    onOpen: (file) => {
      setEdit(fresh(edit.aspect))
      onFileChange?.(file)
    },
  })
  const { src, status, natural } = source
  // A new `src` from the app is a new image: set while rendering, so no frame shows the old edit on it.
  const [seenSrc, setSeenSrc] = useState(srcProp)
  if (seenSrc !== srcProp) {
    setSeenSrc(srcProp)
    source.show(srcProp ?? null)
    setEdit({ ...fresh(edit.aspect), ...defaultEdit })
  }
  const [straightening, setStraightening] = useState(false)
  const straightenTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // The stage's box, which the frame fits inside.
  const stageBox = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState<Size>({ width: 640, height: 400 })
  useLayoutEffect(() => {
    const el = stageBox.current
    if (!el) return
    const measure = () => setBox({ width: el.clientWidth, height: el.clientHeight })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const frameFor = (e: ImageEditorEdit) =>
    fitFrame(aspectOf(aspects.find((a) => a.id === e.aspect)?.ratio ?? 'original', natural, e.rotation), {
      width: Math.max(1, box.width - PAD * 2),
      height: Math.max(1, box.height - PAD * 2),
    })
  const frame = frameFor(edit)
  const live = useLive(edit, frame)

  /** Applies a change, holding the frame on the image, and reports it. */
  const commit = (change: Partial<ImageEditorEdit>) => {
    const next = { ...edit, ...change }
    const f = frameFor(next)
    next.zoom = clamp(next.zoom, 1, 8)
    next.center = clampCenter(next.center, natural, f, next.rotation, coverScale(f, natural, next.rotation) * next.zoom)
    setEdit(next)
    onEditChange?.(normalized(next))
  }
  const turn = (quarters: number) => {
    commit({ rotation: edit.rotation + quarters * 90 })
    announce(copy.turned(normalized({ ...edit, rotation: edit.rotation + quarters * 90 }).rotation))
  }
  // A flip mirrors what's on screen: across the image's own width or height, whichever lies that way after the quarter turns.
  const flip = (axis: 'x' | 'y') => {
    const { quarter, straighten } = splitRotation(edit.rotation)
    const rotation = edit.rotation - 2 * straighten
    commit((axis === 'x') === (quarter % 2 === 0) ? { flipX: !edit.flipX, rotation } : { flipY: !edit.flipY, rotation })
    announce(copy.flipped)
  }
  const reset = () => commit({ ...fresh(edit.aspect), alt: edit.alt })
  const straighten = (degrees: number) => {
    commit({ rotation: Math.round(edit.rotation / 90) * 90 + degrees })
    setStraightening(true)
    clearTimeout(straightenTimer.current)
    straightenTimer.current = setTimeout(() => setStraightening(false), 700)
  }

  const paste = (event: ClipboardEvent) => {
    const file = Array.from(event.clipboardData?.files ?? []).find((f) => f.type.startsWith('image/'))
    if (!file) return
    event.preventDefault()
    source.open(file)
  }
  const remove = async () => {
    await onRemove?.()
    source.show(null)
    announce(copy.removed)
  }

  const placed = place(edit, natural, frame)
  const out = outputSize(frame, placed, maxProp ?? shape.maxOutput)
  const save = async () => {
    const image = imageRef.current
    if (!image || status !== 'ready') throw new Error(copy.broken)
    const result = await framed({
      image,
      natural,
      frame,
      placed,
      out,
      edit,
      name: source.name,
      type: outputType,
      quality: outputQuality,
      failed: copy.saveFailed,
    })
    await (onSave ? onSave(result) : demo('ImageEditor: onSave', 700))
  }
  const title = variant === 'avatar' ? copy.avatarTitle : variant === 'cover' ? copy.coverTitle : copy.title
  const description = variant === 'avatar' ? copy.avatarDescription : variant === 'cover' ? copy.coverDescription : copy.description

  const panel = (
    <article
      aria-labelledby={titleId}
      onPaste={paste}
      {...(embedded ? rest : null)}
      className={cn(
        '@container/editor w-full overflow-hidden rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line bg-surface text-fg',
        embedded ? 'shadow-sm' : 'shadow-lg',
        !fill && 'max-w-4xl',
        embedded && className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-(--ui--panel-x) py-(--ui--panel-head-y)">
        <div className="flex min-w-0 flex-col gap-1">
          <Title id={titleId} className="text-(length:--ui--panel-title) leading-(--ui--panel-title-leading) font-semibold tracking-tight">
            {title}
          </Title>
          <p className="text-ui text-fg-muted">{description}</p>
        </div>
        {src && (
          <div className="flex shrink-0 items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={() => input.current?.click()}>
              {copy.replace}
            </Button>
            <Button variant="ghost" size="sm" onClick={remove}>
              {copy.remove}
            </Button>
          </div>
        )}
      </header>
      <input
        ref={input}
        type="file"
        accept={accept}
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]
          if (file) source.open(file)
          event.currentTarget.value = ''
        }}
      />
      <div className="grid border-t border-line @3xl/editor:grid-cols-[minmax(0,1fr)_calc(var(--spacing)*76)]">
        <div ref={stageBox} className="relative h-80 bg-well @3xl/editor:h-full @3xl/editor:min-h-112">
          {status === 'ready' ? (
            <Stage
              live={live}
              natural={natural}
              frame={frame}
              src={src!}
              edit={edit}
              round={round}
              focal={!round}
              straightening={straightening}
              copy={copy}
              imageRef={imageRef}
              crossOrigin={crossOrigin}
              onCommit={commit}
              onTurn={turn}
              onFlip={flip}
              onReset={reset}
            />
          ) : status === 'loading' ? (
            <div className="grid h-full place-items-center text-fg-muted">
              <Spinner label={copy.loading} />
            </div>
          ) : (
            <Empty
              copy={copy}
              rules={source.rules}
              error={status === 'broken' ? copy.broken : source.error}
              errorId={errorId}
              onBrowse={() => input.current?.click()}
              onFile={source.open}
            />
          )}
          {status === 'ready' && source.error && (
            <p
              role="alert"
              className="absolute inset-x-3 top-3 rounded-md border border-danger-line bg-danger-subtle px-3 py-2 text-ui-sm text-danger-text"
            >
              {source.error}
            </p>
          )}
        </div>
        <div
          className={cn(
            'flex flex-col gap-6 border-t border-line p-(--ui--panel-x) @3xl/editor:border-t-0 @3xl/editor:border-s',
            status !== 'ready' && 'pointer-events-none opacity-50',
          )}
          inert={status !== 'ready'}
        >
          <Controls
            edit={edit}
            aspects={aspects}
            copy={copy}
            onAspect={(aspect) => commit({ aspect })}
            onStraighten={straighten}
            onZoom={(zoom) => commit({ zoom })}
            onTurn={turn}
            onFlip={flip}
          />
          <Previews live={live} natural={natural} src={status === 'ready' ? src : null} previews={previews} round={round} copy={copy} />
        </div>
      </div>
      {!round && <AltText value={edit.alt} disabled={status !== 'ready'} copy={copy} onChange={(alt) => commit({ alt })} />}
      <footer className="flex flex-wrap items-center gap-3 border-t border-line px-(--ui--panel-x) py-(--ui--panel-foot-y)">
        <span className="me-auto text-ui-sm text-fg-muted tabular-nums">
          {status === 'ready' && copy.output(out.width, out.height, FORMAT[outputType] ?? outputType)}
        </span>
        <Button variant="ghost" disabled={status !== 'ready'} onClick={reset}>
          {copy.reset}
        </Button>
        <AsyncButton onAction={save} disabled={status !== 'ready'} pendingLabel={copy.saving} successLabel={copy.saved} errorLabel={copy.saveFailed}>
          {copy.save}
        </AsyncButton>
      </footer>
      <div ref={politeRef} role="status" className="sr-only" />
    </article>
  )

  const shell = embedded ? (
    panel
  ) : (
    <main {...rest} className={cn('grid min-h-dvh w-full place-items-center bg-canvas px-4 py-10 text-fg', className)}>
      {panel}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{shell}</ThemeScope> : shell
}

export { ImageEditor, DEFAULT_COPY as IMAGE_EDITOR_COPY }
export type {
  ImageEditorAspect,
  ImageEditorCopy,
  ImageEditorEdit,
  ImageEditorPoint,
  ImageEditorPreview,
  ImageEditorProps,
  ImageEditorResult,
  ImageEditorVariant,
}
