'use client'

import { useEffect, useId, useRef, type KeyboardEvent, type RefObject } from 'react'
import { SlidingIndicator } from '@youj/motion'
import { SearchIcon } from '@youj/icons/components/youj/icons/search'
import { cn } from '../../../lib/utils'
import { PopoverContent } from '../popover'
import { Toggle } from '../toggle'
import { displayNames, type LocaleInfo } from './multi-language-input-locales'
import { describeSummary, needsWork, statusName, type TranslationStatus } from './multi-language-input-model'
import type { Picker } from './multi-language-input-picker'
import { useMultiLanguageContext } from './multi-language-input-provider'
import { MultiLanguageProgress, StatusGlyph } from './multi-language-input-status'

/* The picker's list, a chunk of its own (the switcher fetches it as soon as
 * it has locales to pick from, before anyone opens it). A search field (a
 * combobox) drives a grouped listbox through aria-activedescendant, as cmdk
 * does, so focus never leaves the search: ↑ ↓ move, Enter picks, Escape
 * closes; the pointer highlights and picks. Pinned locales come first, then
 * recent ones, then the rest by region (or script), alphabetically; search
 * matches the name, the native name, the code and the region. "Needs work"
 * keeps only the locales with something missing, outdated or unreviewed.
 * The highlight glides between rows (SlidingIndicator); under reduced motion
 * it jumps. */

const REGION_ORDER: RegionGroup[] = ['americas', 'europe', 'middle-east-africa', 'asia-pacific', 'other']

type RegionGroup = 'americas' | 'europe' | 'middle-east-africa' | 'asia-pacific' | 'other'

const REGION_GROUPS: Record<Exclude<RegionGroup, 'other'>, string> = {
  americas: '419 005 013 021 029 US CA MX GT BZ SV HN NI CR PA CU DO HT JM PR TT BS BB CO VE EC PE BO BR PY UY AR CL GY SR',
  europe:
    '150 151 154 155 039 GB IE IS NO SE FI DK FO EE LV LT PL CZ SK HU AT CH LI DE NL BE LU FR MC AD ES PT IT SM VA MT SI HR BA RS ME XK MK AL GR CY BG RO MD UA BY RU TR GE AM AZ',
  'middle-east-africa':
    '002 015 202 145 EG LY TN DZ MA SD SS ET ER DJ SO KE UG RW BI TZ MZ MW ZM ZW BW NA ZA LS SZ MG MU AO CD CG GA CM CF TD NE NG BJ TG GH CI LR SL GN GW SN GM ML BF MR CV IL PS LB SY JO IQ IR SA YE OM AE QA BH KW',
  'asia-pacific': '142 009 030 034 035 053 CN TW HK MO JP KR KP MN IN PK BD LK NP BT MV AF KZ UZ KG TJ TM ID MY SG TH VN PH MM KH LA BN TL AU NZ PG FJ WS TO',
}
const REGION_TO_GROUP = new Map<string, RegionGroup>(
  Object.entries(REGION_GROUPS).flatMap(([group, codes]) => codes.split(' ').map((code) => [code, group as RegionGroup])),
)

function regionGroup(info: LocaleInfo): RegionGroup {
  return (info.region && REGION_TO_GROUP.get(info.region)) || 'other'
}

/** A script's name in the interface's language: 'Cyrillic', 'Devanagari'. Simplified and Traditional Chinese share Han. */
function scriptName(script: string, displayLocale: string): string {
  const key = script === 'Hans' || script === 'Hant' ? 'Hani' : script
  try {
    return displayNames(displayLocale, 'script')?.of(key) ?? key
  } catch {
    return key
  }
}

const fold = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase()

const regionNames = new Map<string, Intl.DisplayNames | null>()
function regionName(region: string | undefined, displayLocale: string): string {
  if (!region) return ''
  if (!regionNames.has(displayLocale)) {
    try {
      regionNames.set(displayLocale, new Intl.DisplayNames([displayLocale], { type: 'region' }))
    } catch {
      regionNames.set(displayLocale, null)
    }
  }
  try {
    return regionNames.get(displayLocale)?.of(region) ?? ''
  } catch {
    return ''
  }
}

/** Pinned, recent, then the rest by region or script (alphabetical within), filtered by the search and "Needs work". */
function useGroups(query: string) {
  const { locales, byCode, pinned, recents, summaries, labels, missingOnly, groupBy, displayLocale } = useMultiLanguageContext()
  const terms = fold(query.trim()).split(/\s+/).filter(Boolean)
  const shown = (l: LocaleInfo) => {
    if (missingOnly && !needsWork(summaries[l.code]?.status ?? 'missing')) return false
    const haystack = fold(`${l.label} ${l.autonym} ${l.native} ${l.code} ${regionName(l.region, displayLocale)}`)
    return terms.every((term) => haystack.includes(term))
  }
  const regionLabel: Record<RegionGroup, string> = {
    americas: labels.regionAmericas,
    europe: labels.regionEurope,
    'middle-east-africa': labels.regionMiddleEastAfrica,
    'asia-pacific': labels.regionAsiaPacific,
    other: labels.regionOther,
  }
  const pinnedSet = new Set(pinned)
  const recent = recents.filter((code) => !pinnedSet.has(code) && byCode.has(code))
  const collator = new Intl.Collator(displayLocale)
  const groups: { heading: string; items: LocaleInfo[] }[] = [
    { heading: labels.pinnedLanguages, items: pinned.map((code) => byCode.get(code)!) },
    { heading: labels.recentLanguages, items: recent.map((code) => byCode.get(code)!) },
  ]
  const buckets = new Map<string, LocaleInfo[]>()
  for (const l of locales) {
    if (pinnedSet.has(l.code) || recent.includes(l.code)) continue
    const key = l.group ?? (groupBy === 'region' ? regionGroup(l) : groupBy === 'script' ? scriptName(l.script, displayLocale) : labels.allLanguages)
    buckets.set(key, [...(buckets.get(key) ?? []), l])
  }
  const rank = (key: string) => REGION_ORDER.indexOf(key as RegionGroup)
  const keys = [...buckets.keys()].sort((a, b) => (groupBy === 'region' ? rank(a) - rank(b) : collator.compare(a, b)))
  for (const key of keys) {
    const heading = groupBy === 'region' && rank(key) >= 0 ? regionLabel[key as RegionGroup] : key
    groups.push({ heading, items: buckets.get(key)!.sort((a, b) => collator.compare(a.label, b.label)) })
  }
  return groups.map((g) => ({ ...g, items: g.items.filter(shown) })).filter((g) => g.items.length > 0)
}

function PickerContent({ picker, anchor }: { picker: Picker; anchor: RefObject<HTMLElement | null> }) {
  const c = useMultiLanguageContext()
  const { locales, active, setActive, summaries, labels, missingOnly, setMissingOnly } = c
  const { open, setOpen, query, setQuery, highlight, setHighlight, picked } = picker
  const byKeyboard = useRef(false)
  const listId = useId()
  const groups = useGroups(query)
  const rows = groups.flatMap((g) => g.items.map((l) => l.code))
  const current = rows.includes(highlight ?? '') ? highlight! : (rows[0] ?? null)
  const optionId = (code: string) => `${listId}-${code}`
  const toDo = locales.filter((l) => needsWork(summaries[l.code]?.status ?? 'missing')).length

  useEffect(() => {
    if (!open || !current || !byKeyboard.current) return
    document.getElementById(optionId(current))?.scrollIntoView?.({ block: 'nearest' })
  })

  const pick = (code: string) => {
    picked.current = true
    setActive(code, true)
    setOpen(false)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!rows.length) return
      byKeyboard.current = true
      const at = current ? rows.indexOf(current) : -1
      setHighlight(rows[(at + (event.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length]!)
    } else if (event.key === 'Enter' && current) {
      event.preventDefault()
      pick(current)
    }
  }
  const empty = missingOnly && !query.trim() ? labels.nothingToTranslate : labels.noLanguageMatches

  return (
    <PopoverContent
      anchor={anchor}
      align="start"
      aria-label={labels.language}
      className="w-[22rem] gap-0 overflow-hidden own:p-0"
      // A lone input's picker hands focus to its text once a locale is picked.
      finalFocus={() => (picked.current && c.focusTarget.current) || true}
    >
      <div className="own:flex h-10 shrink-0 items-center gap-2 border-b border-line ps-3 pe-1.5">
        <SearchIcon aria-hidden size={16} strokeWidth={1.75} className="shrink-0 own:text-fg-muted" />
        <input
          role="combobox"
          aria-expanded
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={current ? optionId(current) : undefined}
          aria-label={labels.searchLanguages(locales.length)}
          placeholder={labels.searchLanguages(locales.length)}
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setHighlight(null)
          }}
          onKeyDown={onKeyDown}
          className="h-full min-w-0 flex-1 bg-transparent text-ui text-fg outline-none placeholder:text-fg-muted touch:text-base"
        />
        <Toggle
          size="sm"
          variant="outline"
          pressed={missingOnly}
          onPressedChange={(pressed) => {
            setMissingOnly(pressed)
            setHighlight(null)
          }}
          className="shrink-0 gap-1.5 own:px-2 own:text-ui-sm own:font-normal shadow-none data-pressed:border-accent-line data-pressed:bg-accent-subtle data-pressed:text-accent-text"
        >
          {labels.needsWork}
          <span className="own:text-fg-muted own:tabular-nums in-data-pressed:text-accent-text">{toDo}</span>
        </Toggle>
      </div>
      <div
        id={listId}
        role="listbox"
        aria-label={labels.language}
        className={cn('relative isolate max-h-72 scroll-py-1.5 overflow-y-auto overscroll-contain p-1.5 yj-scrollbar', rows.length === 0 && 'own:hidden')}
      >
        {groups.map(({ heading, items }, i) => (
          <div key={heading} role="presentation">
            <div aria-hidden id={`${listId}-g${i}`} className="px-2 pt-2 pb-1 own:text-ui-xs own:font-medium own:tracking-wide text-fg-muted uppercase select-none">
              {heading}
            </div>
            <div role="group" aria-labelledby={`${listId}-g${i}`}>
              {items.map((l) => (
                <LocaleOption
                  key={l.code}
                  id={optionId(l.code)}
                  locale={l}
                  selected={l.code === active}
                  highlighted={l.code === current}
                  onHighlight={() => {
                    byKeyboard.current = false
                    setHighlight(l.code)
                  }}
                  onPick={() => pick(l.code)}
                />
              ))}
            </div>
          </div>
        ))}
        <SlidingIndicator match="[data-highlighted]" className="own:rounded-md own:bg-hover" />
      </div>
      {rows.length === 0 && (
        <p aria-hidden className="px-4 py-8 text-center own:text-ui own:text-fg-muted">
          {empty}
        </p>
      )}
      <span role="status" className="sr-only">
        {rows.length === 0 ? empty : ''}
      </span>
      <div className="border-t border-line px-3 pt-2.5 pb-3">
        <MultiLanguageProgress variant="bar" showCount />
      </div>
    </PopoverContent>
  )
}

interface LocaleOptionProps {
  id: string
  locale: LocaleInfo
  selected: boolean
  highlighted: boolean
  onHighlight: () => void
  onPick: () => void
}

function LocaleOption({ id, locale, selected, highlighted, onHighlight, onPick }: LocaleOptionProps) {
  const { summaries, labels } = useMultiLanguageContext()
  const summary = summaries[locale.code]
  const status: TranslationStatus = summary?.status ?? 'missing'
  // Only what needs saying: finished rows carry just their check.
  const detail = needsWork(status) ? describeSummary(labels, summary) : status === 'source' ? statusName(labels, status) : ''
  return (
    <div
      id={id}
      role="option"
      aria-selected={selected}
      data-highlighted={highlighted || undefined}
      onPointerMove={() => !highlighted && onHighlight()}
      // Keep focus in the search while the pointer picks.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onPick}
      className="relative own:flex min-h-control cursor-default items-center gap-2 rounded-md px-2 own:text-ui outline-none select-none"
    >
      <StatusGlyph status={status} />
      {locale.flag && (
        <span aria-hidden className="own:-me-0.5 own:text-ui own:leading-none">
          {locale.flag}
        </span>
      )}
      <span className={cn('shrink-0 truncate', selected && 'own:font-medium')}>{locale.label}</span>
      {locale.native !== locale.label && (
        <span lang={locale.code} dir={locale.dir} className="min-w-0 shrink-4 truncate own:text-fg-muted">
          {locale.native}
        </span>
      )}
      <span className={cn('own:ms-auto shrink-0 ps-2 own:text-ui-sm', needsWork(status) ? 'own:text-fg' : 'own:text-fg-muted')}>{detail}</span>
      <span aria-hidden className="w-11 shrink-0 own:text-end own:font-mono own:text-ui-xs own:text-fg-muted own:uppercase">
        {locale.code}
      </span>
    </div>
  )
}

export { PickerContent }
