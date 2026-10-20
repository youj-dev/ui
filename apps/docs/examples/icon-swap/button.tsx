'use client'

import { BellIcon, BellOffIcon, IconSwap, useIconState, UserCheckIcon, UserPlusIcon } from '@youj/icons'

const action =
  'inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-sm font-medium text-fg-muted transition-colors duration-(--yj-duration-fast) ease-standard hover:bg-raised hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none aria-pressed:border-line-strong aria-pressed:text-fg'

export default function IconSwapButton() {
  // Pressed toggles: the name stays put and aria-pressed carries the state,
  // so the swap itself is decorative (no `labels`).
  const mute = useIconState({ label: 'Mute' })
  const assign = useIconState({ label: 'Assign to me' })

  return (
    <div className="w-full max-w-md rounded-xl border border-line bg-surface p-4">
      <p className="font-mono text-xs text-fg-muted">KIN-482 · opened by Priya Raman</p>
      <p className="mt-1.5 text-sm font-medium text-fg">Checkout button flickers on slow networks</p>
      <div className="mt-4 flex gap-2">
        <button {...mute.buttonProps} className={action}>
          <IconSwap {...mute.iconProps} from={BellIcon} to={BellOffIcon} transition="morph" size={16} strokeWidth={1.75} />
          Mute
        </button>
        <button {...assign.buttonProps} className={action}>
          <IconSwap {...assign.iconProps} from={UserPlusIcon} to={UserCheckIcon} transition="pop" size={16} strokeWidth={1.75} />
          Assign to me
        </button>
      </div>
    </div>
  )
}
