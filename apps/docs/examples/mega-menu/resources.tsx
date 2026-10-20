'use client'

import {
  BookmarkIcon,
  CalendarIcon,
  CodeIcon,
  FileTextIcon,
  MessageIcon,
  UsersIcon,
} from '@youj/icons'
import {
  MegaMenuContent,
  MegaMenuFeatured,
  MegaMenuGroup,
  MegaMenuLink,
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@youj/react'

export default function MegaMenuResources() {
  return (
    // The bar sits at the top of the stage, so its panels open into the room below.
    <div className="flex h-[19rem] w-full max-w-2xl flex-col">
      <div className="flex items-center gap-4 rounded-xl border border-line bg-canvas px-4 py-2 shadow-xs">
        <span className="text-ui-lg font-semibold tracking-tight text-fg">Northwind</span>
        {/* The top padding keeps a flipped panel clear of a 56px sticky header. */}
        <NavigationMenu aria-label="Main" collisionPadding={{ top: 64, right: 8, bottom: 8, left: 8 }}>
          <NavigationMenuList>
            <NavigationMenuItem value="resources">
              <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
              <MegaMenuContent
                featured={
                  // Without `media`, the card's art is a soft wash of the accent.
                  <MegaMenuFeatured
                    href="#changelog"
                    eyebrow="Changelog"
                    title="Branch previews for monorepos"
                    description="Every package in a pull request gets its own URL."
                  />
                }
              >
                <MegaMenuGroup title="Learn">
                  <MegaMenuLink href="#docs" icon={<BookmarkIcon size={16} />} title="Docs" />
                  <MegaMenuLink href="#guides" icon={<FileTextIcon size={16} />} title="Guides" />
                  <MegaMenuLink href="#api" icon={<CodeIcon size={16} />} title="API reference" />
                </MegaMenuGroup>
                <MegaMenuGroup title="Community">
                  <MegaMenuLink href="#forum" icon={<MessageIcon size={16} />} title="Forum" />
                  <MegaMenuLink href="#events" icon={<CalendarIcon size={16} />} title="Events" />
                  <MegaMenuLink href="#experts" icon={<UsersIcon size={16} />} title="Experts" />
                </MegaMenuGroup>
              </MegaMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  )
}
