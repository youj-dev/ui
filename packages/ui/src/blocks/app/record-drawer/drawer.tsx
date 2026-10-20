'use client'

import { useRef, type ElementType, type ReactNode } from 'react'
import {
  BanknoteIcon,
  BarChartIcon,
  BriefcaseIcon,
  BuildingIcon,
  CalendarCheckIcon,
  CircleDashedIcon,
  CircleUserIcon,
  FlagIcon,
  HashIcon,
  UserCheckIcon,
} from '@youj/icons'
import { Button, buttonVariants } from '../../../components/ui/button'
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
} from '../../../components/ui/property-list'
import { ItemPager } from '../../../components/ui/item-pager'
import { SheetBody, SheetClose, SheetContent, SheetDescription, SheetTitle } from '../../../components/ui/sheet'
import { safeLink } from '../../../lib/safe-href'
import { STAGE_TONES, type RecordDrawerCopy, type RecordDrawerDeal, type RecordDrawerSection } from './data'
import { DealSections, type When } from './sections'

/** The editable properties, by key: what `onEditProperty` receives. */
export type RecordDrawerProperty = keyof RecordDrawerCopy['properties']

/* A company without a logo gets its initial on a tile tinted by its name. */
const TILE_TONES = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5']
function Logo({ name, logo }: { name: string; logo?: ReactNode }) {
  if (logo) return <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-canvas">{logo}</span>
  const tone = TILE_TONES[[...name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % TILE_TONES.length]
  return (
    <span
      aria-hidden
      style={{ ['--tile' as string]: `var(--color-${tone})` }}
      className="grid size-10 shrink-0 place-items-center rounded-lg border border-[color-mix(in_oklab,var(--tile)_30%,transparent)] bg-[color-mix(in_oklab,var(--tile)_16%,var(--color-overlay))] text-base font-semibold text-[color-mix(in_oklab,var(--tile)_70%,var(--color-fg))]"
    >
      {name.slice(0, 1)}
    </span>
  )
}

export interface DealDrawerProps {
  deal: RecordDrawerDeal
  index: number
  total: number
  onIndexChange: (index: number) => void
  copy: RecordDrawerCopy
  locale: string
  currency: string
  now: number
  when: When
  href?: string
  linkComponent: ElementType
  onEdit: () => void
  onOpen: () => void
  onEditProperty?: (property: RecordDrawerProperty) => void
  onViewAll: (section: RecordDrawerSection) => void
  className?: string
}

/** The floating drawer's content for one deal: stepping and actions, the company, its properties and its sections. */
export function DealDrawer({
  deal,
  index,
  total,
  onIndexChange,
  copy,
  locale,
  currency,
  now,
  when,
  href: rawHref,
  linkComponent: Link,
  onEdit,
  onOpen,
  onEditProperty,
  onViewAll,
  className,
}: DealDrawerProps) {
  const p = copy.properties
  // A link the app supplies that isn't http(s), mailto or relative leaves Open as a button.
  const href = safeLink(rawHref)
  // Focus starts on the drawer itself, so J and K step at once and no button opens on a tooltip.
  const popup = useRef<HTMLDivElement>(null)
  const edit = (property: RecordDrawerProperty) => (onEditProperty ? () => onEditProperty(property) : undefined)
  return (
    <SheetContent ref={popup} initialFocus={popup} variant="floating" backdrop="blur" showCloseButton={false} className={className}>
      <div className="flex h-13 shrink-0 items-center gap-2 px-4 touch:pt-1">
        <ItemPager index={index} total={total} onIndexChange={onIndexChange} shortcuts="global" locale={locale} />
        <div className="ms-auto flex items-center gap-1.5">
          <Button variant="outline" size="xs" onClick={onEdit}>
            {copy.edit}
          </Button>
          {href ? (
            <Link href={href} onClick={onOpen} className={buttonVariants({ size: 'xs' })}>
              {copy.open}
            </Link>
          ) : (
            <Button size="xs" onClick={onOpen}>
              {copy.open}
            </Button>
          )}
          <SheetClose render={<Button variant="ghost" size="icon-xs" className="ms-0.5 text-fg-muted" />}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden className="size-4">
              <path d="M18 6 L6 18 M6 6 L18 18" />
            </svg>
            <span className="sr-only">{copy.close}</span>
          </SheetClose>
        </div>
      </div>
      <SheetBody className="gap-0 p-0">
        <div key={deal.id} className="flex flex-col">
          <div className="flex items-center gap-3 px-5 pt-2 pb-4">
            <Logo name={deal.company.name} logo={deal.company.logo} />
            <div className="flex min-w-0 flex-col">
              <SheetTitle className="truncate text-lg leading-6 font-semibold">{deal.company.name}</SheetTitle>
              <SheetDescription className="truncate">{deal.company.email}</SheetDescription>
            </div>
          </div>
          <PropertyList className="px-5 pb-3 max-sm:[--property-label-width:--spacing(30)]">
            <PropertyListItem icon={<CircleUserIcon />} label={p.owner} onEdit={edit('owner')}>
              <PropertyPerson name={deal.owner.name} src={deal.owner.src} />
            </PropertyListItem>
            <PropertyListItem icon={<BriefcaseIcon />} label={p.deal} onEdit={edit('deal')}>
              <PropertyText>{deal.name}</PropertyText>
            </PropertyListItem>
            <PropertyListItem icon={<BuildingIcon />} label={p.industry} onEdit={edit('industry')}>
              <PropertyTag>{deal.industry}</PropertyTag>
            </PropertyListItem>
            <PropertyListItem icon={<CircleDashedIcon />} label={p.stage} onEdit={edit('stage')}>
              <PropertyStatus tone={STAGE_TONES[deal.stage]}>{copy.stages[deal.stage]}</PropertyStatus>
            </PropertyListItem>
            <PropertyListItem icon={<BarChartIcon />} label={p.probability} onEdit={edit('probability')}>
              <PropertyProgress value={deal.probability} />
            </PropertyListItem>
            <PropertyListItem icon={<CalendarCheckIcon />} label={p.closesAt} onEdit={edit('closesAt')}>
              <PropertyDate value={deal.closesAt} locale={locale} />
            </PropertyListItem>
            <PropertyListItem icon={<HashIcon />} label={p.age}>
              <PropertyAge since={deal.createdAt} now={now} locale={locale} />
            </PropertyListItem>
            <PropertyListItem icon={<FlagIcon />} label={p.nextStepAt} onEdit={edit('nextStepAt')}>
              <PropertyDate value={deal.nextStepAt} locale={locale} />
            </PropertyListItem>
            <PropertyListItem icon={<BanknoteIcon />} label={p.value} onEdit={edit('value')}>
              <PropertyMoney value={deal.value} currency={currency} locale={locale} />
            </PropertyListItem>
            <PropertyListItem icon={<UserCheckIcon />} label={p.lastEditedBy}>
              <PropertyPerson name={deal.lastEditedBy.name} src={deal.lastEditedBy.src} />
            </PropertyListItem>
          </PropertyList>
          <DealSections deal={deal} copy={copy} when={when} onViewAll={onViewAll} linkComponent={Link} />
        </div>
      </SheetBody>
    </SheetContent>
  )
}
