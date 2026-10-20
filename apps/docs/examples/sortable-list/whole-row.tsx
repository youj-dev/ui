'use client'

import { SortableList, SortableListItem } from '@youj/react'

const SONGS = ['Intro', 'Midnight City', 'Kids', 'Wait', 'Outro']

export default function SortableListWholeRow() {
  return (
    <SortableList aria-label="Playlist" className="w-full max-w-xs gap-1" onValueChange={(order) => console.log(order)}>
      {SONGS.map((song) => (
        <SortableListItem key={song} value={song} asHandle>
          <span className="flex-1 px-1">{song}</span>
        </SortableListItem>
      ))}
    </SortableList>
  )
}
