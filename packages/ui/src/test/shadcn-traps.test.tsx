import { Button } from '../components/ui/button'
import { ContextMenuItem } from '../components/ui/context-menu'
import { DialogTrigger } from '../components/ui/dialog'
import { DropdownMenuCheckboxItem, DropdownMenuItem, DropdownMenuRadioItem, DropdownMenuSubTrigger } from '../components/ui/dropdown-menu'
import { MenubarItem } from '../components/ui/menubar'

/* shadcn code that compiles against Youj and then quietly does nothing is a
 * trap. This file is the ban list: each line below must stay a type error
 * (`pnpm typecheck` fails on an unused @ts-expect-error), so a refactor can't
 * quietly turn one back on. The guide that explains each is
 * guides/shadcn.mdx ("What changes"). */

// Never rendered: it only has to type-check.
function bannedShadcnProps() {
  return (
    <>
      {/* onSelect is the DOM's text-selection event on a Base UI menu item: it compiles in shadcn and never fires. Use onClick. */}
      {/* @ts-expect-error onSelect → onClick */}
      <DropdownMenuItem onSelect={() => {}}>Archive</DropdownMenuItem>
      {/* @ts-expect-error onSelect → onClick */}
      <DropdownMenuCheckboxItem onSelect={() => {}}>Pinned</DropdownMenuCheckboxItem>
      {/* @ts-expect-error onSelect → onClick */}
      <DropdownMenuRadioItem value="a" onSelect={() => {}}>A</DropdownMenuRadioItem>
      {/* @ts-expect-error onSelect → onClick */}
      <DropdownMenuSubTrigger onSelect={() => {}}>More</DropdownMenuSubTrigger>
      {/* @ts-expect-error onSelect → onClick */}
      <ContextMenuItem onSelect={() => {}}>Copy</ContextMenuItem>
      {/* @ts-expect-error onSelect → onClick */}
      <MenubarItem onSelect={() => {}}>New</MenubarItem>

      {/* asChild is Radix's. Base UI composes with `render`, and nothing in Youj aliases asChild. */}
      {/* @ts-expect-error asChild → render */}
      <Button asChild>Link</Button>
      {/* @ts-expect-error asChild → render */}
      <DialogTrigger asChild>Open</DialogTrigger>

      {/* The supported spellings compile. */}
      <DropdownMenuItem onClick={() => {}}>Archive</DropdownMenuItem>
      <Button render={<a href="/" />}>Link</Button>
    </>
  )
}

test('shadcn props that compile and then do nothing are type errors', () => {
  expect(bannedShadcnProps).toBeTypeOf('function')
})
