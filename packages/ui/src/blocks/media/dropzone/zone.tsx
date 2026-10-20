'use client'

import type { ComponentProps, ReactNode } from 'react'
import { cn } from '../../../lib/utils'

/* The zone: one button (Enter or Space opens the picker) that is also the
 * drop target, with a stack of drawn sheets that tells its state without
 * words. At rest they lie squared; when files are dragged anywhere over the
 * page they fan a little and the zone tints (ready); over it, the front sheet
 * lifts and the border closes into a solid line (over); a drag the rules turn
 * away turns it to danger (refused). Colours change on the fast token and the
 * sheets move on the CSS spring; under reduced motion only the colours
 * change. */

export type ZoneState = 'idle' | 'ready' | 'over' | 'refused' | 'reading' | 'full'

interface ZoneProps extends Omit<ComponentProps<'button'>, 'title'> {
  state: ZoneState
  title: ReactNode
  hint?: ReactNode
}

const SPRING = '[transition-duration:calc(var(--yj-duration-spring)*var(--yj-motion,1))] ease-spring'

/** The drawn stack: two sheets behind, a photo in front. */
function Sheets() {
  const sheet = 'fill-surface stroke-line-strong [transform-box:fill-box] origin-bottom transition-transform'
  return (
    <svg aria-hidden viewBox="0 0 72 60" fill="none" strokeWidth={1.25} className="h-16 w-19 overflow-visible">
      <rect
        x="15"
        y="12"
        width="30"
        height="38"
        rx="4"
        className={cn(
          sheet,
          SPRING,
          '-rotate-8 group-data-[state=ready]/zone:-rotate-14 group-data-[state=over]/zone:-rotate-16 group-data-[state=refused]/zone:-rotate-4',
        )}
      />
      <rect
        x="27"
        y="12"
        width="30"
        height="38"
        rx="4"
        className={cn(
          sheet,
          SPRING,
          'rotate-8 group-data-[state=ready]/zone:rotate-14 group-data-[state=over]/zone:rotate-16 group-data-[state=refused]/zone:rotate-4',
        )}
      />
      <g
        className={cn(
          '[transform-box:fill-box] origin-bottom transition-transform',
          SPRING,
          'group-data-[state=over]/zone:-translate-y-1.5 group-data-[state=ready]/zone:-translate-y-0.5',
        )}
      >
        <rect
          x="20"
          y="8"
          width="32"
          height="42"
          rx="4"
          className="fill-surface stroke-line-strong transition-[stroke] yj-duration-fast ease-standard group-data-[state=over]/zone:stroke-accent group-data-[state=refused]/zone:stroke-danger"
        />
        <rect x="24" y="12" width="24" height="20" rx="2" className="fill-band" />
        <path
          d="M24 30 L31.5 22.5 L36 27 L39.5 23.5 L48 32 V30 Q48 32 46 32 H26 Q24 32 24 30 Z"
          className="fill-fg-subtle transition-[fill] yj-duration-fast ease-standard group-data-[state=over]/zone:fill-accent group-data-[state=refused]/zone:fill-danger"
        />
        <circle
          cx="41.5"
          cy="17.5"
          r="2.25"
          className="fill-fg-subtle transition-[fill] yj-duration-fast ease-standard group-data-[state=over]/zone:fill-accent group-data-[state=refused]/zone:fill-danger"
        />
        <path d="M25 38 H44 M25 43 H37" strokeLinecap="round" className="stroke-line-strong" />
      </g>
    </svg>
  )
}

export function Zone({ state, title, hint, className, ...props }: ZoneProps) {
  return (
    <button
      type="button"
      data-slot="media-dropzone-zone"
      data-state={state}
      className={cn(
        'group/zone relative flex w-full flex-col items-center justify-center gap-3 rounded-[min(var(--radius-lg),var(--ui--panel-radius-max))] border border-dashed border-line-strong bg-surface px-6 py-8 text-center',
        'transition-[border-color,background-color,box-shadow] yj-duration-fast ease-standard focus-ring',
        'hover:border-fg-subtle hover:bg-hover',
        'data-[state=ready]:border-accent-line data-[state=ready]:bg-accent-subtle',
        'data-[state=over]:border-solid data-[state=over]:border-accent data-[state=over]:bg-accent-subtle data-[state=over]:shadow-[inset_0_0_0_1px_var(--color-accent)]',
        'data-[state=refused]:border-solid data-[state=refused]:border-danger data-[state=refused]:bg-danger-subtle',
        'data-[state=full]:cursor-not-allowed data-[state=full]:hover:border-line-strong data-[state=full]:hover:bg-surface',
        className,
      )}
      {...props}
    >
      <Sheets />
      <span className="flex flex-col items-center gap-1">
        <span className={cn('text-ui-lg font-medium text-fg', state === 'refused' && 'text-danger-text', state === 'full' && 'text-fg-muted')}>
          {title}
        </span>
        {/* Always a line, so the zone keeps its height from state to state. */}
        <span className={cn('min-h-5 text-ui', state === 'refused' ? 'text-danger-text' : 'text-fg-muted')}>{hint}</span>
      </span>
    </button>
  )
}
