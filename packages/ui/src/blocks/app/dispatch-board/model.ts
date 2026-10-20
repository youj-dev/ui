import type { RotaShift } from '../../../components/ui/time-lanes'
import type { RouteMapRoute, RouteMapStop } from '../../../components/ui/route-map'
import { at, DRIVERS, RUNS, type Decision, type Load, type Proposal } from './data'

/* Pure helpers: the board as the dispatcher's decisions leave it. An approved
 * reroute brings its load back on time at the proposed ETA; an approved
 * reassignment or assignment hands the load to its new driver. */

export type Decisions = Record<string, Decision>

export const proposalFor = (proposals: Proposal[], load: string) => proposals.find((p) => p.load === load)

export function applyDecisions(loads: Load[], proposals: Proposal[], decisions: Decisions): Load[] {
  return loads.map((load) => {
    const proposal = proposalFor(proposals, load.id)
    if (!proposal || decisions[proposal.id] !== 'approved') return load
    if (proposal.kind === 'reroute')
      return { ...load, status: 'on-time', eta: proposal.etaProposed!, late: undefined, delayed: undefined, ahead: proposal.path, at: load.at && { ...load.at, detail: `On time · via ${proposal.via!.proposed}` } }
    return { ...load, driver: proposal.to, status: load.status === 'booked' ? 'booked' : 'on-time', late: undefined }
  })
}

/** The selected load's route in its states, the proposal dotted while it waits; every other truck as a marker. */
export function mapFor(loads: Load[], selected: Load, proposal: Proposal | undefined, decision: Decision | undefined) {
  const stops: RouteMapStop[] = [
    { id: selected.origin.id, name: selected.origin.name, kind: 'origin', x: selected.origin.x, y: selected.origin.y },
    { id: selected.destination.id, name: selected.destination.name, kind: 'destination', x: selected.destination.x, y: selected.destination.y },
  ]
  if (selected.at) stops.push({ id: 'now', name: selected.id, kind: 'current', x: selected.at.x, y: selected.at.y, detail: selected.at.detail })
  for (const load of loads)
    if (load.id !== selected.id && load.at) stops.push({ id: `truck:${load.id}`, name: `${load.id} · ${load.customer}`, x: load.at.x, y: load.at.y, detail: load.at.detail })

  const routes: RouteMapRoute[] = []
  if (selected.driven) routes.push({ id: 'driven', status: 'done', path: selected.driven })
  if (selected.delayed) routes.push({ id: 'delayed', status: 'delayed', path: selected.delayed, label: 'Delayed' })
  if (selected.ahead) routes.push({ id: 'ahead', status: 'on-time', path: selected.ahead })
  if (proposal?.kind === 'reroute' && (decision ?? 'pending') === 'pending')
    routes.push({ id: 'proposed', status: 'proposed', path: proposal.path!, label: 'Proposed' })
  return { stops, routes }
}

/** The day's runs: the board's earlier ones, each load's run (late overruns in danger), and proposed runs dashed. */
export function shiftsFor(loads: Load[], proposals: Proposal[], decisions: Decisions): RotaShift[] {
  const shifts: RotaShift[] = RUNS.map((run) => ({ id: run.id, lane: run.lane, start: at(run.start), end: at(run.end), label: run.label, tone: run.done ? 'neutral' : undefined }))
  for (const load of loads) {
    if (!load.driver) continue
    const label = load.id.slice(3)
    const planEnd = load.eta - (load.late ?? 0)
    shifts.push({ id: `run:${load.id}`, lane: load.driver, start: at(load.departs), end: at(planEnd), label })
    if (load.late) shifts.push({ id: `late:${load.id}`, lane: load.driver, start: at(planEnd), end: at(load.eta), label: `+${load.late}m`, tone: 'danger', override: true, note: `${load.customer}: ${load.late} min late` })
  }
  for (const proposal of proposals) {
    if (!proposal.run || (decisions[proposal.id] ?? 'pending') !== 'pending') continue
    shifts.push({ id: `proposed:${proposal.id}`, lane: proposal.to!, start: at(proposal.run.start), end: at(proposal.run.end), label: proposal.load.slice(3), proposed: true, note: proposal.title })
  }
  return shifts
}

export const lanesFor = (loads: Load[]) =>
  DRIVERS.map((driver) => {
    const load = loads.find((l) => l.driver === driver.id && l.status !== 'booked')
    return { id: driver.id, name: driver.name, detail: load ? load.id : driver.detail }
  })
