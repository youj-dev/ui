'use client'

import { PropertyList, PropertyListItem, PropertyPerson, PropertyStatus, PropertyTag } from '@youj/react'

export default function PropertyListSideBySide() {
  return (
    <div className="w-64 rounded-xl border border-line bg-surface p-3">
      <PropertyList stack={false} className="[--property-label-width:5.5rem]">
        <PropertyListItem label="Assignee">
          <PropertyPerson name="Mei Tanaka" />
        </PropertyListItem>
        <PropertyListItem label="Status">
          <PropertyStatus tone="success">Shipped</PropertyStatus>
        </PropertyListItem>
        <PropertyListItem label="Label">
          <PropertyTag>Design</PropertyTag>
        </PropertyListItem>
      </PropertyList>
    </div>
  )
}
