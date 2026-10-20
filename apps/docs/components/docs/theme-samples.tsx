import { shippedThemes } from '@youj/core/lib/youj/theme'
import { Stage } from '@/components/site/stage'

/* The theming page's live samples: stages painted with the role classes, so
 * what they show is the stylesheet's own derivation. Loaded as the page
 * scrolls to them (theme-samples-lazy.tsx), so the page's HTML and RSC don't
 * carry a theme scope per preset. */

/** The surfaces that carry text, each with the tone scope it is drawn in. */
const SURFACES: [string, string, ('chrome' | 'inverse' | 'overlay')?][] = [
  ['canvas', 'bg-canvas'],
  ['surface', 'bg-surface'],
  ['overlay', 'bg-overlay', 'overlay'],
  ['well', 'bg-well'],
  ['field', 'bg-field'],
  ['key', 'bg-key'],
  ['control', 'bg-control'],
  ['chrome', 'bg-chrome', 'chrome'],
  ['chrome-float', 'bg-chrome-float', 'chrome'],
  ['inverse', 'bg-inverse', 'inverse'],
]

/** Each ink as its solid, and as a soft badge: its text on its tint, ringed by its line. Written out, so Tailwind sees every class. */
const INKS = [
  ['accent', 'bg-accent', 'border-accent-line bg-accent-subtle text-accent-text'],
  ['success', 'bg-success', 'border-success-line bg-success-subtle text-success-text'],
  ['warning', 'bg-warning', 'border-warning-line bg-warning-subtle text-warning-text'],
  ['danger', 'bg-danger', 'border-danger-line bg-danger-subtle text-danger-text'],
  ['info', 'bg-info', 'border-info-line bg-info-subtle text-info-text'],
] as const

/** Each shipped preset's roles, live: its surfaces with the three text roles on them, and each ink solid and as a tint. In the site's mode. Kept to few classes: the page carries it twice. */
export function RoleSampler() {
  return (
    <div className="not-prose my-6 grid gap-3">
      {shippedThemes.map((preset) => (
        <figure key={preset.id} className="site-card overflow-hidden rounded-xl">
          <Stage theme={preset.id} className="grid grid-cols-2 gap-1.5 p-3 text-ui-xs sm:grid-cols-5">
            {SURFACES.map(([role, fill, tone]) => (
              <div key={role} data-yj-tone={tone} className={`rounded-md border border-line p-1.5 text-fg ${fill}`}>
                {role} <span className="text-fg-muted">Aa</span> <span className="text-fg-subtle">Aa</span>
              </div>
            ))}
            {INKS.map(([ink, solid, tint]) => (
              <span key={ink} className={`rounded-full border p-1 ps-1.5 ${tint}`}>
                <span className={`me-1 inline-block size-2 rounded-full ${solid}`} />
                {ink}
              </span>
            ))}
          </Stage>
          <figcaption className="border-t border-line px-3 py-1.5 text-ui-xs text-fg-muted">{preset.name}</figcaption>
        </figure>
      ))}
    </div>
  )
}

/** Graphite with `tone: { chrome: 'dark' }`, in light: the chrome and everything in it derive dark; the page stays light. */
export function TwoToneExample({ overlays = 'content' }: { overlays?: 'content' | 'chrome' }) {
  return (
    <figure className="site-card not-prose my-6 overflow-hidden rounded-xl">
      <Stage theme="graphite" mode="light" tone={{ chrome: 'dark', overlays }} className="grid grid-cols-[9rem_1fr] text-ui-sm">
        <aside data-yj-tone="chrome" className="row-span-2 flex flex-col gap-1 bg-chrome p-2 text-fg">
          <span className="px-2 py-1 font-medium">Acme</span>
          <span className="rounded-md bg-selected px-2 py-1">Dashboard</span>
          <span className="rounded-md px-2 py-1 text-fg-muted">Deploys</span>
          <span className="rounded-md px-2 py-1 text-fg-muted">Settings</span>
        </aside>
        <header data-yj-tone="header" className="flex items-center gap-2 border-b border-line bg-chrome p-2 text-fg">
          <span className="flex h-7 flex-1 items-center rounded-md border border-line-control bg-field px-2 text-fg-subtle">Search…</span>
          <span className="flex rounded-md bg-well p-0.5">
            <span className="rounded-[5px] bg-key px-2 py-0.5">Day</span>
            <span className="px-2 py-0.5 text-fg-muted">Week</span>
          </span>
          <span className="rounded-md bg-control px-2.5 py-1">Share</span>
          <span className="rounded-md bg-action px-2.5 py-1 text-on-action">Deploy</span>
        </header>
        <main className="flex flex-col gap-2 p-3">
          <div className="rounded-lg border border-line bg-surface p-3">
            <div className="font-medium">Usage</div>
            <div className="text-fg-muted">The page, its cards and fields stay light.</div>
            <div className="mt-2 flex gap-2">
              <span className="rounded-md bg-control px-2.5 py-1">Details</span>
              <span className="rounded-full bg-accent-subtle px-2 py-0.5 text-ui-xs text-accent-text">New</span>
            </div>
          </div>
          <div data-yj-tone="overlay" className="w-44 rounded-lg border border-line bg-overlay p-1 text-fg shadow-md">
            <div className="rounded-md bg-hover px-2 py-1">A menu item</div>
            <div className="px-2 py-1 text-fg-muted">{overlays === 'chrome' ? 'Menus follow the chrome' : 'Menus follow the page'}</div>
          </div>
        </main>
      </Stage>
      <figcaption className="border-t border-line px-3 py-1.5 text-ui-xs text-fg-muted">
        <code>{`{ ...graphite, tone: { chrome: 'dark'${overlays === 'chrome' ? ", overlays: 'chrome'" : ''} } }`}</code>, light mode
      </figcaption>
    </figure>
  )
}
