import type { Ref } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar'
import { cn, initials } from '../../../lib/utils'
import type { CommentThreadPerson } from './data'
import { handleOf } from './markdown'

/* The @mention list's brains: where the caret is in a plain textarea, what
 * is being typed after an @, and who matches. The list itself is a listbox
 * the textarea drives through aria-activedescendant, so focus never leaves
 * the field. */

/** The @ being typed at the caret: where it starts and what follows it. Null when the caret isn't in a mention. */
export function mentionAt(value: string, caret: number): { start: number; query: string } | null {
  let i = caret
  while (i > 0 && /[\p{L}\p{N}._-]/u.test(value[i - 1]!)) i--
  if (value[i - 1] !== '@') return null
  const before = value[i - 2]
  // After a word character it's an email address or a handle mid-word, not a mention.
  if (before !== undefined && /[\p{L}\p{N}_]/u.test(before)) return null
  return { start: i - 1, query: value.slice(i, caret) }
}

/** People whose handle or name starts with the query (handles first), then those containing it; participants lead. */
export function matchPeople(people: readonly CommentThreadPerson[], query: string, lead: readonly string[] = [], limit = 6) {
  const q = query.toLowerCase()
  const score = (p: CommentThreadPerson) => {
    const handle = handleOf(p).toLowerCase()
    const name = p.name.toLowerCase()
    if (handle.startsWith(q)) return 0
    if (name.split(/\s+/).some((word) => word.startsWith(q))) return 1
    if (handle.includes(q) || name.includes(q)) return 2
    return -1
  }
  return people
    .map((person, index) => ({ person, index, score: score(person), lead: lead.includes(person.id) ? 0 : 1 }))
    .filter((m) => m.score >= 0)
    .sort((a, b) => a.score - b.score || a.lead - b.lead || a.index - b.index)
    .slice(0, limit)
    .map((m) => m.person)
}

const MIRRORED = [
  'direction',
  'boxSizing',
  'width',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderStyle',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'fontStretch',
  'fontSize',
  'lineHeight',
  'fontFamily',
  'textAlign',
  'textTransform',
  'textIndent',
  'letterSpacing',
  'wordSpacing',
  'tabSize',
] as const

/**
 * Where the caret at `index` sits inside a textarea, in px from its border
 * box's top-left corner (the scroll taken off): a hidden mirror of the field
 * with the same box and type, holding the text up to the caret and a marker.
 */
export function caretPoint(field: HTMLTextAreaElement, index: number): { top: number; left: number; height: number } {
  const style = getComputedStyle(field)
  const mirror = document.createElement('div')
  for (const prop of MIRRORED) mirror.style[prop] = style[prop]
  Object.assign(mirror.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    visibility: 'hidden',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
    overflow: 'hidden',
    height: 'auto',
  })
  mirror.textContent = field.value.slice(0, index)
  const marker = document.createElement('span')
  // The rest of the text keeps the marker's line wrapping where the field's does.
  marker.textContent = field.value.slice(index) || '.'
  mirror.append(marker)
  field.ownerDocument.body.append(mirror)
  const lineHeight = Number.parseFloat(style.lineHeight) || Number.parseFloat(style.fontSize) * 1.4
  const point = { top: marker.offsetTop - field.scrollTop, left: marker.offsetLeft - field.scrollLeft, height: lineHeight }
  mirror.remove()
  return point
}

export function MentionList({
  ref,
  id,
  label,
  people,
  active,
  top,
  x,
  above,
  rtl,
  onPick,
  onHover,
}: {
  ref?: Ref<HTMLDivElement>
  id: string
  label: string
  people: CommentThreadPerson[]
  active: number
  /** Where the caret is in the composer, in px: the list opens from there, towards the reading direction. */
  top: number
  x: number
  above: boolean
  rtl: boolean
  onPick: (person: CommentThreadPerson) => void
  onHover: (index: number) => void
}) {
  return (
    <div
      ref={ref}
      id={id}
      role="listbox"
      aria-label={label}
      data-slot="mention-list"
      data-yj-side={above ? 'top' : 'bottom'}
      style={{ top, left: x }}
      // Pointer presses never take focus from the field.
      onMouseDown={(event) => event.preventDefault()}
      className={cn(
        'absolute z-30 flex w-60 max-w-full flex-col gap-px rounded-lg border border-line bg-overlay p-1 text-fg shadow-md',
        'transition-[opacity,scale] yj-duration-fast ease-enter starting:scale-97 starting:opacity-0',
        above ? 'origin-bottom -translate-y-full' : 'origin-top',
        rtl && '-translate-x-full',
      )}
      data-yj-tone="overlay"
    >
      {people.map((person, i) => (
        <div
          key={person.id}
          id={`${id}-${i}`}
          role="option"
          aria-selected={i === active}
          onMouseMove={() => i !== active && onHover(i)}
          onClick={() => onPick(person)}
          className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-ui aria-selected:bg-hover"
        >
          <Avatar size="sm" aria-hidden className="size-5">
            {person.avatar && <AvatarImage src={person.avatar} alt="" />}
            <AvatarFallback className="text-ui-xs">{initials(person.name)}</AvatarFallback>
          </Avatar>
          <span className="truncate font-medium">{person.name}</span>
          <span className="ms-auto shrink-0 text-ui-sm text-fg-muted">@{handleOf(person)}</span>
        </div>
      ))}
    </div>
  )
}
