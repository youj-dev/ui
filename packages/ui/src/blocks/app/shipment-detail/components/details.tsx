'use client'

import { BuildingIcon, CalendarClockIcon, FileTextIcon, HashIcon, PackageIcon, ThermometerIcon, TruckIcon, UserIcon } from '@youj/icons'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { PropertyList, PropertyListItem, PropertyMoney, PropertyPerson, PropertyStatus, PropertyText } from '../../../../components/ui/property-list'
import type { ShipmentDetailShipment } from '../data'

/** The shipment's record: references, parties, equipment and money, each editable where a dispatcher may change it. */
export function Details({ shipment: s, onEdit }: { shipment: ShipmentDetailShipment; onEdit: (field: 'driver' | 'window') => void }) {
  const edit = (field: 'driver' | 'window') => () => onEdit(field)
  return (
    <Card role="region" aria-labelledby="shipment-details" size="sm" className="min-w-0">
      <CardHeader>
        <CardTitle>
          <h2 id="shipment-details">Details</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <PropertyList>
          <PropertyListItem icon={<HashIcon />} label="PO / BOL">
            <PropertyText>{s.reference}</PropertyText>
          </PropertyListItem>
          <PropertyListItem icon={<BuildingIcon />} label="Customer">
            <PropertyText>{s.customer}</PropertyText>
          </PropertyListItem>
          <PropertyListItem icon={<UserIcon />} label="Driver" onEdit={edit('driver')}>
            <PropertyPerson name={s.driver.name} />
          </PropertyListItem>
          <PropertyListItem icon={<TruckIcon />} label="Trailer">
            <PropertyText>{s.trailer}</PropertyText>
          </PropertyListItem>
          <PropertyListItem icon={<ThermometerIcon />} label="Reefer">
            <PropertyStatus tone={s.reefer.ok ? 'success' : 'danger'}>{s.reefer.reading}</PropertyStatus>
          </PropertyListItem>
          <PropertyListItem icon={<PackageIcon />} label="Load">
            <PropertyText>{s.load}</PropertyText>
          </PropertyListItem>
          <PropertyListItem icon={<CalendarClockIcon />} label="Delivery window" onEdit={edit('window')}>
            <PropertyText>Today · {s.window}</PropertyText>
          </PropertyListItem>
          <PropertyListItem icon={<FileTextIcon />} label="Rate">
            <PropertyMoney value={s.rate.value} currency={s.rate.currency} />
          </PropertyListItem>
        </PropertyList>
      </CardContent>
    </Card>
  )
}
