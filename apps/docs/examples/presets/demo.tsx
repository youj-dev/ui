'use client'

import type { ReactNode } from 'react'
import { LinkIcon } from '@youj/icons'
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Toaster,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  toast,
} from '@youj/react'

// Each @youj/react overlay is a Base UI part wearing one preset. Try them at ¼ speed.
function Tile({ preset, part, children }: { preset: string; part: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-line bg-surface p-3.5">
      <div>
        <p className="font-mono text-[13px] text-fg">{preset}</p>
        <p className="mt-0.5 text-xs text-fg-muted">{part}</p>
      </div>
      {children}
    </div>
  )
}

const trigger = <Button variant="outline" size="sm" />

export default function PresetsDemo() {
  return (
    <div className="grid w-full max-w-2xl grid-cols-2 gap-2.5 sm:grid-cols-3">
      <Tile preset="yj-pop" part="Popover, Menu, Select">
        <Popover>
          <PopoverTrigger render={trigger}>Share</PopoverTrigger>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>Share preview</PopoverTitle>
              <PopoverDescription>Anyone with the link can view this deployment.</PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      </Tile>
      <Tile preset="yj-tooltip" part="Tooltip">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger render={<Button variant="outline" size="icon-sm" aria-label="Copy link" />}>
              <LinkIcon />
            </TooltipTrigger>
            <TooltipContent>Copy link</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </Tile>
      <Tile preset="yj-dialog" part="Dialog, with yj-backdrop">
        <Dialog>
          <DialogTrigger render={trigger}>Rename</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename project</DialogTitle>
              <DialogDescription>The new name shows in URLs and on every deployment.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
              <DialogClose render={<Button />}>Rename</DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Tile>
      <Tile preset="yj-sheet-end" part="Sheet">
        <Sheet>
          <SheetTrigger render={trigger}>Activity</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Activity</SheetTitle>
              <SheetDescription>What changed in youj-web today.</SheetDescription>
            </SheetHeader>
            <SheetBody>
              <p className="text-sm text-fg-muted">Priya promoted a41f9e2 to production.</p>
            </SheetBody>
          </SheetContent>
        </Sheet>
      </Tile>
      <Tile preset="yj-sheet-bottom" part="Drawer, swipe to close">
        <Drawer>
          <DrawerTrigger render={trigger}>Details</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Deployment details</DrawerTitle>
              <DrawerDescription>Built in 38s from main, 4 minutes ago.</DrawerDescription>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>
      </Tile>
      <Tile preset="yj-toast" part="Toast stack">
        <Button variant="outline" size="sm" onClick={() => toast.success('Deployed to production', { description: 'youj-web · 4f2a91c · 38s' })}>
          Deploy
        </Button>
        <Toaster />
      </Tile>
    </div>
  )
}
