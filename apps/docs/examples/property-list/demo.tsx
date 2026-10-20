'use client'

import {
  BanknoteIcon,
  BarChartIcon,
  BriefcaseIcon,
  BuildingIcon,
  CalendarCheckIcon,
  CircleDashedIcon,
  CircleUserIcon,
  HashIcon,
  UserCheckIcon,
} from '@youj/icons'
import {
  PropertyAge,
  PropertyDate,
  PropertyList,
  PropertyListItem,
  PropertyMoney,
  PropertyPerson,
  PropertyProgress,
  PropertyStatus,
  PropertyTag,
  PropertyText,
} from '@youj/react'

// Pass `now` from the server so the age reads the same in the browser.
const NOW = Date.UTC(2026, 9, 5, 9, 30)
const DAY = 86_400_000

export default function PropertyListDemo() {
  return (
    <div className="w-full max-w-md rounded-xl border border-line bg-overlay p-5 shadow-sm">
      <PropertyList>
        <PropertyListItem icon={<CircleUserIcon />} label="Owner">
          <PropertyPerson name="Noor Haddad" />
        </PropertyListItem>
        <PropertyListItem icon={<BriefcaseIcon />} label="Deal">
          <PropertyText>Inference platform expansion</PropertyText>
        </PropertyListItem>
        <PropertyListItem icon={<BuildingIcon />} label="Industry">
          <PropertyTag>AI</PropertyTag>
        </PropertyListItem>
        <PropertyListItem icon={<CircleDashedIcon />} label="Stage">
          <PropertyStatus tone="warning">Proposal</PropertyStatus>
        </PropertyListItem>
        <PropertyListItem icon={<BarChartIcon />} label="Probability">
          <PropertyProgress value={62} />
        </PropertyListItem>
        <PropertyListItem icon={<CalendarCheckIcon />} label="Closes">
          <PropertyDate value="2026-11-30" />
        </PropertyListItem>
        <PropertyListItem icon={<HashIcon />} label="Age">
          <PropertyAge since={NOW - 12 * DAY} now={NOW} />
        </PropertyListItem>
        <PropertyListItem icon={<BanknoteIcon />} label="Value">
          <PropertyMoney value={324_000} />
        </PropertyListItem>
        <PropertyListItem icon={<UserCheckIcon />} label="Last edited by">
          <PropertyPerson name="Tomás Reyes" />
        </PropertyListItem>
      </PropertyList>
    </div>
  )
}
