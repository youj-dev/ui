'use client'

import { BookmarkIcon, HeartIcon, PlayIcon, useIconState, VolumeIcon, type IconState } from '@youj/icons'

const control =
  'grid size-9 place-items-center rounded-full text-fg-muted transition-colors duration-(--yj-duration-fast) ease-standard hover:bg-raised hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none'

/** What assistive technology gets from each button: its name, and its pressed state if it has one. */
function Announced({ state }: { state: IconState }) {
  const { 'aria-label': name, 'aria-pressed': pressed } = state.buttonProps
  return (
    <li className="flex items-center gap-2 font-mono text-xs">
      <span className="text-fg-muted">button</span>
      <span className="text-fg">“{name}”</span>
      {pressed !== undefined && <span className={pressed ? 'text-accent' : 'text-fg-muted'}>{pressed ? 'pressed' : 'not pressed'}</span>}
    </li>
  )
}

export default function UseIconStateDemo() {
  // An action names what it will do next: Play, then Pause. No aria-pressed.
  const play = useIconState({ labels: ['Play', 'Pause'] })
  // Pressed toggles keep one name and report their state with aria-pressed.
  const save = useIconState({ label: 'Save episode' })
  const like = useIconState({ label: 'Like' })
  const mute = useIconState({ label: 'Mute' })

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
        <button {...play.buttonProps} className="grid size-11 shrink-0 place-items-center rounded-full bg-fg text-canvas focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none">
          <PlayIcon {...play.iconProps} size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-fg">Shipping motion at scale</p>
          <p className="truncate text-xs text-fg-muted">Interface Notes · Episode 42</p>
        </div>
        <button {...save.buttonProps} className={`${control} aria-pressed:text-fg`}>
          <BookmarkIcon {...save.iconProps} size={18} />
        </button>
        <button {...like.buttonProps} className={`${control} aria-pressed:text-danger`}>
          <HeartIcon {...like.iconProps} size={18} />
        </button>
        <button {...mute.buttonProps} className={`${control} aria-pressed:text-fg`}>
          <VolumeIcon {...mute.iconProps} size={18} />
        </button>
      </div>
      <ul aria-label="Accessible names" className="space-y-1.5 rounded-xl border border-dashed border-line-strong px-4 py-3">
        {[play, save, like, mute].map((state, i) => (
          <Announced key={i} state={state} />
        ))}
      </ul>
    </div>
  )
}
