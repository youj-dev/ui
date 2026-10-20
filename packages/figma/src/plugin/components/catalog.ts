import { ENTRIES as CHARTS, SOURCES as CHART_SOURCES } from './charts'
import { ENTRIES as INPUTS, SOURCES as INPUT_SOURCES } from './inputs'
import { ENTRIES as INSTRUMENTS, SOURCES as INSTRUMENT_SOURCES } from './instruments'
import { ENTRIES as LAYOUT, SOURCES as LAYOUT_SOURCES } from './layout'
import { ENTRIES as MENUS, SOURCES as MENU_SOURCES } from './menus'
import type { Entry, Source } from './parts'
import { ENTRIES as PICKERS, SOURCES as PICKER_SOURCES } from './pickers'

/* The catalog: the components drawn after the core sets, in page order, by
 * batch. Each entry is a set on the Components page with its reference line;
 * each batch's SOURCES are its drift guard (test/sources.test.ts). */

export const CATALOG: Entry[] = [...INPUTS, ...PICKERS, ...MENUS, ...LAYOUT, ...CHARTS, ...INSTRUMENTS]

export const CATALOG_SOURCES: Source[] = [...INPUT_SOURCES, ...PICKER_SOURCES, ...MENU_SOURCES, ...LAYOUT_SOURCES, ...CHART_SOURCES, ...INSTRUMENT_SOURCES]
