'use client'

import { MicIcon, PhoneCallIcon, useIconState, VideoIcon } from '@youj/icons'

const control =
  'grid size-10 place-items-center rounded-full transition-colors duration-(--yj-duration-fast) ease-standard focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none'
const toggle = `${control} border border-line bg-surface text-fg hover:bg-raised aria-pressed:bg-raised`

export default function IconStateControls() {
  // Pressed toggles keep one name and announce the state with aria-pressed.
  const mic = useIconState({ label: 'Mute' })
  const camera = useIconState({ label: 'Camera off' })
  // An action names what happens next, so its name follows the state instead.
  const call = useIconState({ labels: ['Join call', 'Leave call'], defaultActive: true })

  return (
    <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="relative grid h-40 place-items-center bg-raised">
        <span className="grid size-16 place-items-center rounded-full bg-surface text-lg font-semibold text-fg">AL</span>
        <p className="absolute start-3 bottom-3 flex items-center gap-1.5 rounded-md bg-surface px-2 py-1 text-xs font-medium text-fg">
          {mic.active && <MicIcon active size={13} strokeWidth={2} className="text-danger" />}
          Ana Lima
        </p>
      </div>
      <div className="flex items-center justify-center gap-2.5 px-4 py-3.5">
        <button {...mic.buttonProps} className={toggle}>
          <MicIcon {...mic.iconProps} size={18} className={mic.active ? 'text-danger' : undefined} />
        </button>
        <button {...camera.buttonProps} className={toggle}>
          <VideoIcon {...camera.iconProps} size={18} />
        </button>
        <button {...call.buttonProps} className={`${control} text-on-accent ${call.active ? 'bg-danger' : 'bg-success'}`}>
          <PhoneCallIcon {...call.iconProps} size={18} />
        </button>
      </div>
    </div>
  )
}
