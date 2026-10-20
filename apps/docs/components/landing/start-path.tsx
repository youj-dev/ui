import type { ReactNode } from 'react'
import { InstallField } from '@/components/landing/install-field'
import { Stage } from '@/components/site/stage'
import { BackdropLayer } from '@/components/docs/backdrop-layer'
import type { BackdropId } from '@/lib/backdrops'

/** A `npx youj …` command as what follows `youj`, for the install field (which puts each manager's runner in front). */
const runOf = (command: string) => command.replace(/^npx youj /, '')

/** One way in, as a card: its label, its command, and its picture (with any controls under it). Plain markup, so the Start section draws it on the server around a stack whose code waits (start-stack-on-view). */
export function Path({ label, command, controls, mood, children }: { label: string; command: string; controls?: ReactNode; /** A mood's still behind the picture (as on the parts' tiles); else the Youj aurora. */ mood?: BackdropId; children: ReactNode }) {
  return (
    <article className="flex min-w-0 flex-col gap-5 site-card rounded-2xl p-4 sm:p-6">
      <h3 className="text-[17px] leading-6 font-semibold tracking-tight text-fg">{label}</h3>
      <InstallField run={runOf(command)} className="w-full" />
      {/* Side by side, the figures share a height, and both stacks sit at the top so they line up plane for plane. */}
      <Stage as="figure" data-mood={mood} className="start-path-stage relative isolate m-0 flex flex-1 flex-col overflow-hidden rounded-xl">
        {mood ? (
          <>
            {/* Dark keeps the card's mood; light is the plain gray of the install field (styles/site.css). */}
            <BackdropLayer id={mood} live={false} className="start-path-dark -z-10 rounded-[inherit]" />
            <div aria-hidden className="start-path-light pointer-events-none absolute inset-0 -z-10 rounded-[inherit] bg-(--code-bg)" />
          </>
        ) : (
          <div aria-hidden className="start-wide-ground hc-aurora pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]" />
        )}
        <div className="relative">{children}</div>
        {controls && <div className="relative mt-auto flex justify-center px-4 pb-4">{controls}</div>}
      </Stage>
    </article>
  )
}

/**
 * A third way in, under the two stacks and as wide as both: its label, command and words (`children`) on the
 * start side and its picture on the end side, stacked like the others where they are. The picture is decoration:
 * the words say what it shows.
 */
export function WidePath({ label, command, picture, children }: { label: string; command: string; picture: ReactNode; children: ReactNode }) {
  return (
    <article className="flex min-w-0 flex-col gap-5 site-card rounded-2xl p-4 sm:p-6 lg:col-span-2 lg:grid lg:grid-cols-2 lg:items-center lg:gap-6">
      <div className="flex min-w-0 flex-col gap-5">
        <h3 className="text-[17px] leading-6 font-semibold tracking-tight text-fg">{label}</h3>
        <InstallField run={runOf(command)} className="w-full" />
        {children}
      </div>
      <Stage as="figure" aria-hidden className="relative isolate m-0 grid h-60 place-items-center overflow-hidden rounded-xl">
        <div aria-hidden className="start-wide-ground hc-aurora pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]" />
        <div className="relative">{picture}</div>
      </Stage>
    </article>
  )
}
