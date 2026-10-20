'use client'

import { MiniatureRepairBench } from '@youj/miniatures/repair-bench'

/** The maintenance page's repair bench, lamp lit: its checklist lights up as the window passes (`progress`, 0 to 1); when it ends the case closes and the beacon turns green. */
export function RepairBench({ progress, done }: { progress: number | null; done: boolean }) {
  return <MiniatureRepairBench interactive={false} size="100%" progress={progress} done={done} />
}
