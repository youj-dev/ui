import type { PreviewListLook } from './data'

/* An item's placeholder picture, drawn: a page in the card's own surface on a
 * soft ground, laid out as one of the `looks` (the demo's: a landing page,
 * docs, a dashboard or a store), with the item's tone on its one accent. It
 * stands in for a screenshot, which an item passes as `thumbnail`. */

export const PAGES = {
  landing: (
    <>
      <rect x="14" y="14" width="22" height="5" rx="2.5" className="fill-(--thumb-tone)" />
      <rect x="104" y="14" width="14" height="5" rx="2.5" className="fill-hover" />
      <rect x="124" y="14" width="14" height="5" rx="2.5" className="fill-hover" />
      <rect x="144" y="14" width="18" height="5" rx="2.5" className="fill-hover" />
      <rect x="14" y="40" width="74" height="9" rx="4.5" className="fill-fg-subtle" />
      <rect x="14" y="55" width="56" height="9" rx="4.5" className="fill-fg-subtle" />
      <rect x="14" y="74" width="62" height="5" rx="2.5" className="fill-hover" />
      <rect x="14" y="86" width="30" height="12" rx="6" className="fill-(--thumb-tone)" />
      <rect x="104" y="36" width="58" height="62" rx="8" className="fill-(--thumb-tone) opacity-25" />
      <circle cx="133" cy="62" r="13" className="fill-(--thumb-tone)" />
    </>
  ),
  docs: (
    <>
      <rect x="14" y="14" width="20" height="5" rx="2.5" className="fill-(--thumb-tone)" />
      <rect x="14" y="32" width="38" height="5" rx="2.5" className="fill-fg-subtle" />
      <rect x="14" y="44" width="30" height="5" rx="2.5" className="fill-hover" />
      <rect x="14" y="56" width="34" height="5" rx="2.5" className="fill-hover" />
      <rect x="14" y="68" width="26" height="5" rx="2.5" className="fill-hover" />
      <rect x="68" y="30" width="62" height="9" rx="4.5" className="fill-fg-subtle" />
      <rect x="68" y="47" width="94" height="5" rx="2.5" className="fill-hover" />
      <rect x="68" y="59" width="88" height="5" rx="2.5" className="fill-hover" />
      <rect x="68" y="71" width="94" height="5" rx="2.5" className="fill-hover" />
      <rect x="68" y="83" width="40" height="5" rx="2.5" className="fill-(--thumb-tone)" />
    </>
  ),
  dashboard: (
    <>
      <rect x="14" y="14" width="22" height="5" rx="2.5" className="fill-(--thumb-tone)" />
      <rect x="14" y="30" width="44" height="22" rx="6" className="fill-hover" />
      <rect x="66" y="30" width="44" height="22" rx="6" className="fill-hover" />
      <rect x="118" y="30" width="44" height="22" rx="6" className="fill-hover" />
      <rect x="20" y="37" width="14" height="4" rx="2" className="fill-fg-subtle" />
      <rect x="72" y="37" width="18" height="4" rx="2" className="fill-fg-subtle" />
      <rect x="124" y="37" width="12" height="4" rx="2" className="fill-fg-subtle" />
      <rect x="14" y="62" width="9" height="14" rx="2" className="fill-(--thumb-tone) opacity-40" />
      <rect x="28" y="56" width="9" height="20" rx="2" className="fill-(--thumb-tone) opacity-40" />
      <rect x="42" y="64" width="9" height="12" rx="2" className="fill-(--thumb-tone) opacity-40" />
      <rect x="56" y="52" width="9" height="24" rx="2" className="fill-(--thumb-tone)" />
      <rect x="70" y="60" width="9" height="16" rx="2" className="fill-(--thumb-tone) opacity-40" />
      <rect x="84" y="56" width="9" height="20" rx="2" className="fill-(--thumb-tone) opacity-40" />
      <rect x="14" y="84" width="148" height="5" rx="2.5" className="fill-hover" />
    </>
  ),
  store: (
    <>
      <rect x="14" y="14" width="22" height="5" rx="2.5" className="fill-(--thumb-tone)" />
      <rect x="132" y="14" width="30" height="5" rx="2.5" className="fill-hover" />
      <rect x="14" y="30" width="44" height="40" rx="6" className="fill-(--thumb-tone) opacity-30" />
      <rect x="66" y="30" width="44" height="40" rx="6" className="fill-(--thumb-tone)" />
      <rect x="118" y="30" width="44" height="40" rx="6" className="fill-(--thumb-tone) opacity-30" />
      <rect x="14" y="78" width="30" height="5" rx="2.5" className="fill-fg-subtle" />
      <rect x="66" y="78" width="26" height="5" rx="2.5" className="fill-fg-subtle" />
      <rect x="118" y="78" width="32" height="5" rx="2.5" className="fill-fg-subtle" />
      <rect x="14" y="88" width="16" height="5" rx="2.5" className="fill-hover" />
      <rect x="66" y="88" width="16" height="5" rx="2.5" className="fill-hover" />
      <rect x="118" y="88" width="16" height="5" rx="2.5" className="fill-hover" />
    </>
  ),
}

/** The four pages the default looks draw. */
export const LOOKS: PreviewListLook[] = (Object.keys(PAGES) as (keyof typeof PAGES)[]).map((id) => ({ id, page: PAGES[id] }))

function PreviewThumb({ look, looks, tone = 'chart-1' }: { look?: string; looks: PreviewListLook[]; tone?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 176 104"
      data-slot="preview-thumb"
      className="block size-full rounded-lg bg-band"
      style={{ ['--thumb-tone' as string]: `var(--color-${tone})` }}
    >
      <rect x="6" y="6" width="164" height="92" rx="6" className="fill-surface" />
      <g>{(looks.find((l) => l.id === look) ?? looks[0])?.page}</g>
    </svg>
  )
}

export { PreviewThumb }
