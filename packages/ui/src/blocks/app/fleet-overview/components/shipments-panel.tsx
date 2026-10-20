'use client'

import { CheckCircleIcon, MapIcon, RouteIcon, SearchIcon } from '@youj/icons'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '../../../../components/ui/alert'
import { Badge } from '../../../../components/ui/badge'
import { AsyncButton } from '../../../../components/ui/async-button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../../../../components/ui/empty'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../../../components/ui/input-group'
import { Kbd } from '../../../../components/ui/kbd'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs'
import { cn } from '../../../../lib/utils'
import type { Group } from '../model'
import type { Harbor } from '../use-harbor'
import { FleetFigures } from './fleet-figures'
import { LiveClock } from './live-clock'
import { ShipmentList } from './shipment-list'

/* The shipments panel: the fleet's count, the storm warning, its figures,
 * search, and the ships by status in Tabs. */

export function ShipmentsPanel({ harbor, embedded = false }: { harbor: Harbor; embedded?: boolean }) {
  const Title = embedded ? 'h2' : 'h1'
  const {
    floating,
    hud,
    time,
    ships,
    selectedId,
    group,
    setGroup,
    query,
    setQuery,
    stormShown,
    setStormShown,
    search,
    stormBox,
    stormBusy,
    setStormBusy,
    groups,
    q,
    visible,
    held,
    storm,
    atSea,
    select,
    rerouteShips,
  } = harbor

  const empty = (
    <Empty className="py-10">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          {q ? <SearchIcon /> : group === 'delayed' ? <CheckCircleIcon trigger="mount" className="text-success" /> : <MapIcon />}
        </EmptyMedia>
        <EmptyTitle>{q ? 'No ships match' : group === 'delayed' ? 'Nothing holding' : 'Nothing here yet'}</EmptyTitle>
        <EmptyDescription>
          {q
            ? `No ${{ transit: 'sailing ship', delayed: 'ship holding', arrived: 'ship in port' }[group]} matches “${query.trim()}”.`
            : group === 'delayed'
              ? 'Every ship at sea is under way.'
              : 'Ships show up here as they sail.'}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-3 px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col">
            <Title className="text-ui-lg font-semibold tracking-tight text-fg">Fleet</Title>
            <p className="text-ui-sm text-fg-muted">
              <span className="tabular-nums">{atSea}</span> at sea · <span className="tabular-nums">{groups.arrived.length}</span> in port
            </p>
          </div>
          {!floating && <LiveClock className="mt-1" />}
        </div>
        <div ref={stormBox}>
          <Alert
            variant="warning"
            open={stormShown && !!storm && (!storm.resolvedAt || stormBusy)}
            onOpenChange={setStormShown}
            dismissLabel="Dismiss storm warning"
          >
            <AlertTitle>{storm.title}</AlertTitle>
            <AlertDescription>{storm.body}</AlertDescription>
            <AlertAction>
              <AsyncButton
                size="sm"
                onAction={() => {
                  setStormBusy(true)
                  return rerouteShips(held.map((s) => s.id))
                }}
                pendingLabel={storm.pending}
                successLabel={storm.done}
                onActionStateChange={(state) => {
                  if (state !== 'idle') return
                  setStormBusy(false)
                  // It goes once its button has said so, and focus moves on first rather than to the page.
                  if (stormBox.current?.contains(document.activeElement)) search.current?.focus()
                  setStormShown(false)
                }}
              >
                <RouteIcon size={14} /> {storm.action}
              </AsyncButton>
            </AlertAction>
          </Alert>
        </div>
        {!hud && <FleetFigures ships={ships} compact />}
        <InputGroup>
          <InputGroupAddon>
            <SearchIcon size={16} />
          </InputGroupAddon>
          <InputGroupInput
            ref={search}
            aria-label="Search ships"
            placeholder="Ship, booking or port"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && query) {
                event.preventDefault()
                setQuery('')
              }
            }}
          />
          <InputGroupAddon align="inline-end" className="max-md:hidden">
            <Kbd>/</Kbd>
          </InputGroupAddon>
        </InputGroup>
      </div>
      <Tabs value={group} onValueChange={(value) => setGroup(value as Group)} className="flex min-h-0 flex-1 flex-col">
        <TabsList aria-label="Ships by status" className="px-3">
          {(
            [
              ['transit', 'Sailing'],
              ['delayed', 'Holding'],
              ['arrived', 'In port'],
            ] as const
          ).map(([value, label]) => (
            <TabsTrigger key={value} value={value}>
              {label}
              <Badge variant={value === 'delayed' && groups.delayed.length ? 'warning' : 'secondary'} size="sm" className="tabular-nums">
                {groups[value].length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
        {(['transit', 'delayed', 'arrived'] as const).map((value) => (
          <TabsContent key={value} value={value} className={cn('min-h-0 flex-1 p-2', floating && 'overflow-y-auto overscroll-contain')}>
            <ShipmentList
              ships={value === group ? visible : groups[value]}
              time={time}
              selectedId={selectedId}
              onSelect={select}
              empty={empty}
              label={{ transit: 'Ships sailing', delayed: 'Ships holding', arrived: 'Ships in port' }[value]}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
