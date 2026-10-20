'use client'

import { useState } from 'react'
import { BanknoteIcon, CalendarCheckIcon, CircleDashedIcon, CircleUserIcon } from '@youj/icons'
import { IllustrationHandshake } from '@youj/illustrations'
import {
  Button,
  PropertyDate,
  PropertyList,
  PropertyListItem,
  PropertyMoney,
  PropertyPerson,
  PropertyStatus,
  ItemPager,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@youj/react'

const deals = [
  { company: 'Orrery Labs', email: 'partnerships@orrerylabs.com', owner: 'Noor Haddad', stage: 'Proposal', tone: 'warning', closes: '2026-11-30', value: 324_000 },
  { company: 'Fernhill Bank', email: 'vendors@fernhillbank.com', owner: 'Tomás Reyes', stage: 'Negotiation', tone: 'accent', closes: '2026-12-12', value: 118_500 },
  { company: 'Quayside Foods', email: 'it@quaysidefoods.com', owner: 'Mei Tanaka', stage: 'Qualified', tone: 'accent', closes: '2027-01-20', value: 46_000 },
]

export default function FloatingSheet() {
  const [index, setIndex] = useState(0)
  const deal = deals[index]!
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>Open deal</SheetTrigger>
      <SheetContent variant="floating" backdrop="blur">
        <SheetHeader>
          <ItemPager index={index} total={deals.length} onIndexChange={setIndex} shortcuts="global" className="-ms-1 mb-2" />
          <SheetTitle>{deal.company}</SheetTitle>
          <SheetDescription>{deal.email}</SheetDescription>
        </SheetHeader>
        <SheetBody>
          {/* Decorative: with no title the scene is hidden from assistive tech. */}
          <div className="grid shrink-0 place-items-center rounded-lg py-1">
            <IllustrationHandshake unit={10} />
          </div>
          <PropertyList>
            <PropertyListItem icon={<CircleUserIcon />} label="Owner">
              <PropertyPerson name={deal.owner} />
            </PropertyListItem>
            <PropertyListItem icon={<CircleDashedIcon />} label="Stage">
              <PropertyStatus tone={deal.tone}>{deal.stage}</PropertyStatus>
            </PropertyListItem>
            <PropertyListItem icon={<CalendarCheckIcon />} label="Closes">
              <PropertyDate value={deal.closes} />
            </PropertyListItem>
            <PropertyListItem icon={<BanknoteIcon />} label="Value">
              <PropertyMoney value={deal.value} />
            </PropertyListItem>
          </PropertyList>
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
