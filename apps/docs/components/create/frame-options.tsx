'use client'

import {
  ACCOUNT_PARTS,
  ACCOUNTS,
  BRAND_PARTS,
  BRANDS,
  MOBILE_LABELS,
  MOBILE_NAVS,
  NOTIFICATIONS_PART,
  SEARCH_PARTS,
  SEARCHES,
  SIDEBAR_PARTS,
  SIDEBARS,
  TOPBAR_PARTS,
  TOPBARS,
  UPGRADE_PART,
  type FrameConfig,
} from '@youj/react/docs/create/config'
import { InspectorSection, InspectorSelect, InspectorSwitch, type InspectorOption } from '@youj/react/docs/inspector'
import { Schematic } from './schematic'

/* The Frame and Parts steps, as an inspector. Frame: the layout, each choice
 * a menu (the big ones show a wireframe of the frame they'd make, the part
 * drawn in the accent). Parts: the account and search menus, and the extras
 * as switches. Every choice reaches the preview at once, and a new variant is
 * one more row in a menu. (Its screens are a step of their own: screen-options.tsx.) */

/** The frame an option makes, drawn small for its menu. (The menu sizes bare icons; this keeps its own.) */
function Thumb({ sidebar, topbar, account, focus }: Pick<FrameConfig, 'sidebar' | 'topbar' | 'account'> & { focus: 'sidebar' | 'topbar' | 'account' }) {
  return (
    <span className="block w-16 overflow-hidden rounded-[5px] ring-1 ring-line [&_svg]:h-auto! [&_svg]:w-full!">
      <Schematic sidebar={sidebar} topbar={topbar} account={account} focus={focus} />
    </span>
  )
}

const names = <T extends string>(labels: Record<T, string>, options: readonly T[], notes?: Partial<Record<T, string>>): InspectorOption<T>[] =>
  options.map((value) => ({ value, label: labels[value], ...(notes?.[value] ? { note: notes[value] } : {}) }))

export function FrameOptions({ frame, onChange }: { frame: FrameConfig; onChange: (patch: Partial<FrameConfig>) => void }) {
  const sidebars: InspectorOption<FrameConfig['sidebar']>[] = SIDEBARS.map((sidebar) => ({
    value: sidebar,
    label: SIDEBAR_PARTS[sidebar].label,
    note: SIDEBAR_PARTS[sidebar].description,
    thumb: <Thumb sidebar={sidebar} topbar={frame.topbar} account={frame.account} focus="sidebar" />,
  }))
  const topbars: InspectorOption<FrameConfig['topbar']>[] = TOPBARS.map((topbar) => ({
    value: topbar,
    label: TOPBAR_PARTS[topbar].label,
    note: TOPBAR_PARTS[topbar].description,
    thumb: <Thumb sidebar={frame.sidebar} topbar={topbar} account={frame.account} focus="topbar" />,
  }))
  const brandLabels = Object.fromEntries(BRANDS.map((b) => [b, BRAND_PARTS[b].label])) as Record<FrameConfig['brand'], string>
  const brandNotes = Object.fromEntries(BRANDS.map((b) => [b, BRAND_PARTS[b].description])) as Record<FrameConfig['brand'], string>
  return (
    <div className="flex flex-col gap-6">
      <InspectorSection title="Layout">
        <InspectorSelect label="Sidebar" value={frame.sidebar} rich options={sidebars} onChange={(sidebar) => onChange({ sidebar })} />
        <InspectorSelect label="Top bar" value={frame.topbar} rich options={topbars} onChange={(topbar) => onChange({ topbar })} />
        <InspectorSelect label="Header" value={frame.brand} rich options={names(brandLabels, BRANDS, brandNotes)} onChange={(brand) => onChange({ brand })} />
        <InspectorSelect
          label="On phones"
          value={frame.mobile}
          rich
          options={names(MOBILE_LABELS, MOBILE_NAVS, { sheet: 'The sidebar slides in as a sheet.', tabs: 'A tab bar for the first four pages, and Menu for the rest.' })}
          onChange={(mobile) => onChange({ mobile })}
        />
      </InspectorSection>
    </div>
  )
}

/** The Parts step: what the frame includes. The account and search, and the extras. */
export function PartOptions({ frame, onChange }: { frame: FrameConfig; onChange: (patch: Partial<FrameConfig>) => void }) {
  const accounts: InspectorOption<FrameConfig['account']>[] = ACCOUNTS.map((account) => ({
    value: account,
    label: ACCOUNT_PARTS[account].label,
    note: ACCOUNT_PARTS[account].description,
    thumb: <Thumb sidebar={frame.sidebar} topbar={frame.topbar} account={account} focus="account" />,
  }))
  const searchLabels = { ...Object.fromEntries(Object.entries(SEARCH_PARTS).map(([k, p]) => [k, p.label])), none: 'None' } as Record<FrameConfig['search'], string>
  const searchNotes = { ...Object.fromEntries(Object.entries(SEARCH_PARTS).map(([k, p]) => [k, p.description])), none: 'No search in the top bar.' } as Record<FrameConfig['search'], string>
  return (
    <div className="flex flex-col gap-6">
      <InspectorSection title="Parts">
        <InspectorSelect label="Account" value={frame.account} rich options={accounts} onChange={(account) => onChange({ account })} />
        <InspectorSelect label="Search" value={frame.search} rich options={names(searchLabels, SEARCHES, searchNotes)} onChange={(search) => onChange({ search })} />
      </InspectorSection>
      <InspectorSection title="Extras">
        <InspectorSwitch label={NOTIFICATIONS_PART.label} note={NOTIFICATIONS_PART.description} checked={frame.notifications} onChange={(notifications) => onChange({ notifications })} />
        <InspectorSwitch label={UPGRADE_PART.label} note={UPGRADE_PART.description} checked={frame.upgrade} onChange={(upgrade) => onChange({ upgrade })} />
      </InspectorSection>
    </div>
  )
}
