import { useCallback, useMemo, useRef, useState } from 'react'
import { toast } from '../../../components/ui/toast'
import { ALERTS, demo, PORTS, SHIPMENTS, type FleetAlert } from './data'
import { groupOf, reroute, track, voyageOf, type FleetMapHandle, type Group, type MapInsets, type SimClock, type Tracked } from './model'
import { useMedia } from './use-media'
import { useSimTime } from './use-sim-time'

/* Harbor's state: the fleet, its alerts, the view, the selection and the
 * list's group and search, with what's derived from them. */

export const PANEL = 336
export const DETAIL = 368
export const EDGE = 12

interface AlertState extends FleetAlert {
  /** When it was resolved, if it has been. */
  resolvedAt?: number
}

export function useHarbor({ defaultSelectedId, onReroute }: { defaultSelectedId: string | null; onReroute?: (ships: Tracked[]) => Promise<unknown> | unknown }) {
  const floating = useMedia('(min-width: 1024px)')
  const hud = useMedia('(min-width: 1440px)')
  const [clock] = useState<SimClock>(() => ({ time: 0 }))
  const time = useSimTime(clock)
  const [ships, setShips] = useState<Tracked[]>(() => {
    const now = Date.now()
    return SHIPMENTS.map((s) => track(s, now))
  })
  const [alerts, setAlerts] = useState<AlertState[]>(() => ALERTS.map((a) => ({ ...a })))
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches ? defaultSelectedId : null,
  )
  const [group, setGroup] = useState<Group>(() => groupOf(ships.find((s) => s.id === selectedId)?.status ?? 'on-time'))
  const [query, setQuery] = useState('')
  const [stormShown, setStormShown] = useState(true)
  const [announcement, setAnnouncement] = useState('')
  const map = useRef<FleetMapHandle>(null)
  const search = useRef<HTMLInputElement>(null)
  const stormBox = useRef<HTMLDivElement>(null)
  // The map's alert waits for its own button to settle before it goes.
  const [stormBusy, setStormBusy] = useState(false)
  // The panel keeps showing the last voyage while it slides away.
  const [shown, setShown] = useState(selectedId)
  if (selectedId && selectedId !== shown) setShown(selectedId)

  const voyages = useMemo(() => ships.map(voyageOf), [ships])
  const groups = useMemo(() => {
    const out: Record<Group, Tracked[]> = { transit: [], delayed: [], arrived: [] }
    for (const s of ships) out[groupOf(s.status)].push(s)
    out.transit.sort((a, b) => a.eta - b.eta)
    out.arrived.sort((a, b) => a.eta - b.eta)
    return out
  }, [ships])
  const q = query.trim().toLowerCase()
  const matches = (s: Tracked) => !q || `${s.vessel} ${s.booking} ${s.imo} ${PORTS[s.from]!.name} ${PORTS[s.to]!.name} ${s.from} ${s.to}`.toLowerCase().includes(q)
  const visible = groups[group].filter(matches)
  const selected = ships.find((s) => s.id === selectedId) ?? null
  const detail = ships.find((s) => s.id === shown) ?? null
  const held = groups.delayed
  const storm = alerts.find((a) => a.id === 'storm')!
  const atSea = groups.transit.length + held.length

  const select = useCallback(
    (id: string | null) => {
      setSelectedId(id)
      if (!id) return
      const ship = ships.find((s) => s.id === id)
      if (!ship) return
      setGroup(groupOf(ship.status))
      setAnnouncement(`${ship.vessel}, ${PORTS[ship.from]!.name} to ${PORTS[ship.to]!.name}${ship.hold ? `. ${ship.hold}` : ''}`)
    },
    [ships],
  )

  const rerouteShips = async (ids: string[]) => {
    const stuck = ships.filter((s) => ids.includes(s.id) && s.status === 'delayed')
    if (!stuck.length) return
    await (onReroute ? onReroute(stuck) : demo('FleetOverview: onReroute', 1400))
    const names = stuck.map((s) => s.vessel)
    setShips((list) => list.map((s) => (ids.includes(s.id) ? reroute(s, clock.time) : s)))
    setAnnouncement(`${names.join(' and ')} rerouted west of the storm cell`)
    toast.success(names.length > 1 ? `${names.length} ships rerouted` : `${names[0]} rerouted`, { description: 'West of the storm cell. Their ETAs are updated.' })
  }

  // The storm alert is resolved once nothing is holding for it, however that happened.
  const [heldCount, setHeldCount] = useState(held.length)
  if (heldCount !== held.length) {
    setHeldCount(held.length)
    if (!held.length) {
      setAlerts((list) => list.map((a) => (a.id === 'storm' && !a.resolvedAt ? { ...a, resolvedAt: Date.now() } : a)))
      if (!stormBusy) setStormShown(false)
    }
  }

  const open = !!selected
  const insets = useMemo<MapInsets>(
    () =>
      floating
        ? { top: 76, left: EDGE + PANEL + 20, right: open ? EDGE + DETAIL + 72 : 72, bottom: hud ? 112 : 24 }
        : { top: 20, left: 16, right: 56, bottom: 36 },
    [floating, hud, open],
  )

  const mapLabel = `Fleet map: ${atSea} ships at sea on their lanes${held.length ? `, ${held.length} holding for a storm over the Bay of Biscay` : ''}.${selected ? ` Showing ${selected.vessel}, ${PORTS[selected.from]!.name} to ${PORTS[selected.to]!.name}.` : ''}`

  return {
    floating,
    hud,
    clock,
    time,
    ships,
    alerts,
    selectedId,
    group,
    setGroup,
    query,
    setQuery,
    stormShown,
    setStormShown,
    announcement,
    map,
    search,
    stormBox,
    stormBusy,
    setStormBusy,
    voyages,
    groups,
    q,
    visible,
    selected,
    detail,
    held,
    storm,
    atSea,
    select,
    rerouteShips,
    open,
    insets,
    mapLabel,
  }
}

export type Harbor = ReturnType<typeof useHarbor>
