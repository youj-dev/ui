'use client'

import { useId, type ElementType } from 'react'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '../../../components/ui/navigation-menu'
import { cn } from '../../../lib/utils'
import type { NavbarStoreDepartment, NavbarStoreGroup } from './data'

/* The departments on a wide screen: each opens a panel of category columns
 * beside its collection tiles (the picture eases in a little closer under the
 * pointer), on the kit's navigation menu, so the popup morphs between
 * departments and Escape returns to the trigger. Plain departments are links;
 * a highlighted one (Sale) wears the accent. The department holding the
 * current page carries a dot. */

const holds = (department: NavbarStoreDepartment, href?: string) => !!href && !!department.groups?.some((group) => group.links.some((link) => link.href === href))

function Column({ group, current, Link }: { group: NavbarStoreGroup; current?: string; Link: ElementType }) {
  const id = useId()
  return (
    <div role="group" aria-labelledby={id} className="flex w-40 flex-col gap-1">
      <p id={id} className="px-2 pb-1 text-ui-xs font-medium tracking-wide text-fg-subtle uppercase">
        {group.title}
      </p>
      {group.links.map((link) => (
        <NavigationMenuLink key={link.href} href={link.href} render={<Link href={link.href} />} active={link.href === current} closeOnClick className="px-2 py-1.5">
          {link.label}
        </NavigationMenuLink>
      ))}
    </div>
  )
}

interface DepartmentsProps {
  departments: NavbarStoreDepartment[]
  current?: string
  label: string
  Link: ElementType
}

export function Departments({ departments, current, label, Link }: DepartmentsProps) {
  return (
    <NavigationMenu aria-label={label} className="justify-start">
      <NavigationMenuList className="justify-start">
        {departments.map((department) =>
          department.groups ? (
            <NavigationMenuItem key={department.label} value={department.label}>
              <NavigationMenuTrigger className={cn(department.highlight && 'text-accent-text hover:text-accent-text')}>
                {department.label}
                {holds(department, current) && <span aria-hidden className="size-1.5 rounded-full bg-accent" />}
              </NavigationMenuTrigger>
              <NavigationMenuContent className="flex gap-6 p-4">
                <div className="flex gap-4">
                  {department.groups.map((group) => (
                    <Column key={group.title} group={group} current={current} Link={Link} />
                  ))}
                </div>
                {department.collections && department.collections.length > 0 && (
                  <div className="flex gap-3 border-s border-line ps-6">
                    {department.collections.map((collection) => (
                      <NavigationMenuLink
                        key={collection.href}
                        href={collection.href}
                        render={<Link href={collection.href} />}
                        closeOnClick
                        className="group/tile w-48 flex-col gap-1 p-1.5 hover:bg-transparent focus-visible:bg-transparent"
                      >
                        <span className="mb-1.5 block aspect-4/3 w-full overflow-hidden rounded-md border border-line">
                          <span className="block size-full transition-transform yj-duration-slow ease-standard group-hover/tile:scale-105">{collection.media}</span>
                        </span>
                        <span className="font-medium text-fg">{collection.label}</span>
                        {collection.description && <span className="text-ui-sm text-fg-muted">{collection.description}</span>}
                      </NavigationMenuLink>
                    ))}
                  </div>
                )}
              </NavigationMenuContent>
            </NavigationMenuItem>
          ) : (
            <NavigationMenuItem key={department.label}>
              <NavigationMenuLink
                href={department.href}
                render={<Link href={department.href ?? ''} />}
                active={department.href === current}
                className={cn(navigationMenuTriggerStyle(), department.highlight && 'text-accent-text hover:text-accent-text')}
              >
                {department.label}
              </NavigationMenuLink>
            </NavigationMenuItem>
          ),
        )}
      </NavigationMenuList>
    </NavigationMenu>
  )
}
