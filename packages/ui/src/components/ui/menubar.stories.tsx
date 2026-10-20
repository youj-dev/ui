import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from './menubar'

const meta: Meta<typeof Menubar> = {
  title: 'UI/Navigation/Menubar',
  component: Menubar,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A desktop-app menu bar on Base UI Menubar. One tab stop: ←/→ move between menus, ↓ opens one, and once a menu is open, hovering or arrowing to its neighbor swaps menus without a click. The open trigger is marked by one SlidingIndicator that glides between triggers on the smooth spring; the menus are DropdownMenu’s (yj-pop popup, sliding row highlight, drawn checks, submenus). Reduced motion: the mark jumps and popups are instant.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Menubar>

function EditorMenubar() {
  const [ruler, setRuler] = useState(true)
  const [wordCount, setWordCount] = useState(false)
  const [zoom, setZoom] = useState('100')
  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            New document <MenubarShortcut>⌘N</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Open… <MenubarShortcut>⌘O</MenubarShortcut>
          </MenubarItem>
          <MenubarSub>
            <MenubarSubTrigger>Open recent</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem>Q3 planning.md</MenubarItem>
              <MenubarItem>Launch checklist.md</MenubarItem>
              <MenubarItem>Interview notes.md</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSeparator />
          <MenubarItem>
            Save <MenubarShortcut>⌘S</MenubarShortcut>
          </MenubarItem>
          <MenubarItem disabled>
            Save as template <MenubarShortcut>⇧⌘S</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Print… <MenubarShortcut>⌘P</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            Undo <MenubarShortcut>⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Cut <MenubarShortcut>⌘X</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Copy <MenubarShortcut>⌘C</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Paste <MenubarShortcut>⌘V</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem variant="danger">Delete document</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent>
          <MenubarGroup>
            <MenubarLabel>Show</MenubarLabel>
            <MenubarCheckboxItem checked={ruler} onCheckedChange={setRuler}>
              Ruler
            </MenubarCheckboxItem>
            <MenubarCheckboxItem checked={wordCount} onCheckedChange={setWordCount}>
              Word count
            </MenubarCheckboxItem>
          </MenubarGroup>
          <MenubarSeparator />
          <MenubarRadioGroup value={zoom} onValueChange={setZoom}>
            <MenubarLabel>Zoom</MenubarLabel>
            <MenubarRadioItem value="75">75%</MenubarRadioItem>
            <MenubarRadioItem value="100">100%</MenubarRadioItem>
            <MenubarRadioItem value="125">125%</MenubarRadioItem>
          </MenubarRadioGroup>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Help</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Keyboard shortcuts</MenubarItem>
          <MenubarItem>What’s new</MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Contact support</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  )
}

/** A document editor's menu bar: shortcuts, a submenu, checks and a radio group. */
export const Hero: Story = {
  render: () => <EditorMenubar />,
}

