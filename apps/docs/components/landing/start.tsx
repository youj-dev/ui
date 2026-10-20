import Link from 'next/link'
import { ArrowRightIcon, GaugeIcon, KeyboardIcon, PackageIcon, ServerIcon, ShieldCheckIcon } from '@/components/client'
import { Section } from '@/components/landing/section'
import { Path, WidePath } from '@/components/landing/start-path'
import type { Piece, Plane } from '@/components/landing/start-stack'
import { BlocksFrame, KitStack, PiecePath } from '@/components/landing/start-stack-on-view'
import { ButtonLink } from '@/components/ui/button-link'
import { dependencyClosure, type Catalog } from '@/lib/catalog'
import { packageEntry, registryItems } from '@/lib/registry'

/* How to start, as two pictures of one stack, the kit's package entries as
 * planes: the whole kit is one command and every plane; one piece is a single
 * item, lifted off its plane with exactly what it brings, the rest ghosted.
 * A third way under them starts from a whole page: a block. Then what every part carries, in a word
 * each, and the way in. */

/** The pieces shown à la carte: a component, an icon, an interaction and a loader. */
const PIECES = ['button', 'icon-bell', 'dock', 'loader-build']
/** The block the third way in adds: a screen of figures and a chart, as its picture is. */
const PAGE = 'app-analytics-overview'
const UI = '@youj/react'
const CORE = '@youj/core'
const MOTION = '@youj/motion'
const LOADERS = '@youj/loaders'
const ICONS = '@youj/icons'
const ILLUSTRATIONS = '@youj/illustrations'

/** The planes, bottom to top: motion's core under its entries and the packages built on it, the components on top. */
const PLANES: Plane[] = [
  { id: 'motion', name: 'Motion', entry: MOTION, holds: 'tokens · themes · primitives' },
  { id: 'players', name: 'Players', entry: `${MOTION}/players`, holds: 'Lottie' },
  { id: 'interactions', name: 'Interactions', entry: `${MOTION}/interactions`, holds: 'interactions · backgrounds' },
  { id: 'loaders', name: 'Loaders', entry: LOADERS, holds: 'loading animations' },
  { id: 'illustrations', name: 'Illustrations', entry: ILLUSTRATIONS, holds: 'isometric scenes' },
  { id: 'icons', name: 'Icons', entry: ICONS, holds: 'animated icons' },
  { id: 'ui', name: 'UI', entry: UI, holds: 'components' },
]

/** The plane an item ships on: its package entry, with the UI package's own entries (`/chart`) on the UI plane, core's (tokens, themes) on motion's and each loader's (`@youj/loaders/<id>`) on the Loaders plane. */
function planeOf(entry: string): string | undefined {
  if (entry === UI || entry.startsWith(`${UI}/`)) return 'ui'
  if (entry === CORE || entry.startsWith(`${CORE}/`)) return 'motion'
  if (entry === LOADERS || entry.startsWith(`${LOADERS}/`)) return 'loaders'
  if (entry === `${MOTION}/backgrounds`) return 'interactions'
  return PLANES.find((plane) => plane.entry === entry)?.id
}

function piece(name: string): Piece {
  const items = registryItems()
  const brings = dependencyClosure(name, items)
  const byPlane: Record<string, string[]> = {}
  for (const item of [name, ...brings]) {
    const found = items.get(item)
    const plane = found && planeOf(packageEntry(found))
    if (plane) (byPlane[plane] ??= []).push(item)
  }
  return { name, items: byPlane, brings }
}

const PROOF = [
  { Icon: ShieldCheckIcon, label: 'AA in light and dark' },
  { Icon: KeyboardIcon, label: 'Keyboard first' },
  { Icon: GaugeIcon, label: 'Reduced motion' },
  { Icon: ServerIcon, label: 'Server-rendered' },
  { Icon: PackageIcon, label: 'Tree-shakable' },
]

/** `counts` is no longer drawn: the pictures carry no numbers. */
export function Start({ install, componentsUrl, screensUrl }: { install: string; componentsUrl: string; /** The Screens docs group's first page. */ screensUrl: string; counts?: Catalog }) {
  return (
    <Section id="start" title="Install the kit. Or copy a piece.">
      <div className="mt-12 grid gap-4 md:mt-14 lg:grid-cols-2">
        <Path label="All of it" command={install} mood="sandstone">
          <KitStack
            planes={PLANES}
            label={`It installs ${UI} with ${ICONS} and ${MOTION}, whose /interactions, /backgrounds and /players entries are there when you want them, and ${LOADERS} and ${ILLUSTRATIONS} beside them; motion also stands alone`}
          />
        </Path>
        <PiecePath planes={PLANES} pieces={PIECES.map(piece)} />
        <WidePath label="A whole screen" command={`npx @youj/cli add ${PAGE}`} picture={<BlocksFrame />}>
          <p className="max-w-[44ch] text-[14px] leading-relaxed text-pretty text-fg-muted">
            Start from a screen, not a blank file. Screens, sections and cards are copied in as source you own, in your theme.
          </p>
          {/* Quiet links: the command is this way's action, and the section's own buttons follow just below. */}
          <p className="flex flex-wrap gap-x-6 gap-y-2 text-[14px] font-medium">
            <Link prefetch={false} href={screensUrl} className="link-quiet hit-area rounded-sm focus-ring">
              Browse screens
            </Link>
          </p>
        </WidePath>
      </div>

      <div className="mt-12 flex flex-col items-center gap-8">
        <ul className="flex flex-wrap justify-center gap-x-7 gap-y-3">
          {PROOF.map(({ Icon, label }) => (
            <li key={label} className="flex items-center gap-2 text-[13.5px] text-fg-muted">
              <Icon size={16} strokeWidth={1.6} className="text-fg" />
              {label}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap justify-center gap-2">
          <ButtonLink href="/docs/installation" size="lg" className="px-5">
            Get started
            <ArrowRightIcon size={16} strokeWidth={2} className="rtl:-scale-x-100" />
          </ButtonLink>
          <ButtonLink href={componentsUrl} size="lg" variant="outline" className="px-5">
            Browse components
          </ButtonLink>
        </div>
      </div>
    </Section>
  )
}
