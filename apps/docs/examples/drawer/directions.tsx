'use client'

import {
  Button,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  type DrawerDirection,
} from '@youj/react'
import { ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon, ArrowUpIcon } from '@youj/icons'
import { IllustrationCompass } from '@youj/illustrations'

// `swipeDirection` is the way the drawer leaves: a "down" drawer sits on the bottom edge.
const DIRECTIONS: { direction: DrawerDirection; edge: string; Icon: typeof ArrowDownIcon }[] = [
  { direction: 'down', edge: 'bottom', Icon: ArrowDownIcon },
  { direction: 'up', edge: 'top', Icon: ArrowUpIcon },
  { direction: 'left', edge: 'left', Icon: ArrowLeftIcon },
  { direction: 'right', edge: 'right', Icon: ArrowRightIcon },
]

export default function DrawerDirections() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {DIRECTIONS.map(({ direction, edge, Icon }) => (
        <Drawer key={direction} swipeDirection={direction}>
          <DrawerTrigger render={<Button variant="outline" className="w-32" />}>
            <Icon />
            Swipe {direction}
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>From the {edge} edge</DrawerTitle>
              <DrawerDescription>Swipe it {direction} to dismiss it, or press Escape.</DrawerDescription>
            </DrawerHeader>
            {/* Decorative: with no title the scene is hidden from assistive tech. */}
            <IllustrationCompass unit={9} className="mx-auto" />
            <DrawerFooter>
              <DrawerClose render={<Button variant="outline" />}>Close</DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ))}
    </div>
  )
}
